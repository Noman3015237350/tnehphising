/* ============================================================
   DEVILS WILL RISE — Victims List API
   GET /api/victims?key=tneh2024
   ============================================================ */

const DASHBOARD_KEY = process.env.DASHBOARD_KEY || 'tneh2024';
const OWNER = process.env.OWNER || '@tneh_owner';

export default function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if(req.method === 'OPTIONS'){
    return res.status(200).end();
  }

  if(req.method !== 'GET'){
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  const key = req.query.key || '';
  if(key !== DASHBOARD_KEY){
    return res.status(401).json({ ok:false, error:'Unauthorized — wrong key' });
  }

  const store = globalThis.__DWR_VICTIMS__ || new Map();
  const list = Array.from(store.values()).sort((a,b)=> b.createdAt - a.createdAt);

  return res.status(200).json({
    ok: true,
    owner: OWNER,
    count: list.length,
    victims: list
  });
}
