// Only the ER.GG server can call this endpoint. Store the raw token in Render, never here.
const TOKEN_SHA256 = '3913a840b4581a0a2a3d65233ab0ab611664ab7f1e5897d7f14b71fab18cd4c2';
const json = (body: unknown, status = 200) => Response.json(body, {status});
Deno.serve(async (req: Request) => {
  const token = req.headers.get('x-cache-token') || '';
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  if (!token || hash !== TOKEN_SHA256) return json({error:'Unauthorized'},401);
  if (req.method !== 'POST') return json({error:'Method not allowed'},405);
  try {
    const raw = await req.text();
    if (raw.length > 2_000_000) return json({error:'Too large'},413);
    const input = JSON.parse(raw);
    if (typeof input.key !== 'string' || input.key.length > 512 || !/^\/v[12]\/(user\/|games\/|rank\/|data\/|weaponRoutes\/)/.test(input.key)) return json({error:'Invalid key'},400);
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
    const key = keys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const headers: Record<string,string> = {'apikey':key,'Content-Type':'application/json'};
    if (!keys.default) headers.Authorization = 'Bearer '+key;
    const base = Deno.env.get('SUPABASE_URL')+'/rest/v1/er_api_cache';
    if (input.action === 'get' && input.key === '/v2/data/statistics' && input.scope) {
      if (!['overview','items','character'].includes(input.scope) || !Number.isInteger(input.character ?? 0) || (input.character ?? 0) < 0 || (input.character ?? 0) > 10000) return json({error:'Invalid scope'},400);
      const response = await fetch(Deno.env.get('SUPABASE_URL')+'/rest/v1/rpc/er_statistics_snapshot', {
        method:'POST',headers,body:JSON.stringify({p_scope:input.scope,p_character:input.character ?? 0}),signal:AbortSignal.timeout(2500)
      });
      if (!response.ok) return json({error:'Statistics unavailable'},503);
      return json(await response.json());
    }
    if (input.action === 'get') {
      const query = new URLSearchParams({cache_key:'eq.'+input.key,retain_until:'gt.'+new Date().toISOString(),select:'body,fetched_at,expires_at',limit:'1'});
      const response = await fetch(base+'?'+query,{headers,signal:AbortSignal.timeout(2500)});
      if(!response.ok) return json({error:'Cache unavailable'},503);
      const rows = await response.json();
      return json(rows[0] || null);
    }
    if(input.action !== 'put' || !input.body || typeof input.body !== 'object' || Array.isArray(input.body) || (input.body.code != null && ![0,200].includes(Number(input.body.code)))) return json({error:'Invalid response'},400);
    const ttl = Math.max(30_000, Math.min(86_400_000, Number(input.ttl)||30_000));
    const now = Date.now();
    const response = await fetch(base+'?on_conflict=cache_key',{method:'POST',headers:{...headers,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({cache_key:input.key,body:input.body,fetched_at:new Date(now).toISOString(),expires_at:new Date(now+ttl).toISOString(),retain_until:new Date(now+7*86400000).toISOString()}),signal:AbortSignal.timeout(2500)});
    if(!response.ok)return json({error:'Cache write failed'},503);
    // Indexed retention cleanup; this cache owns only this table.
    await fetch(base+'?retain_until=lt.'+encodeURIComponent(new Date(now).toISOString()),{method:'DELETE',headers,signal:AbortSignal.timeout(2500)}).catch(()=>{});
    return json({ok:true});
  } catch { return json({error:'Cache unavailable'},503); }
});
