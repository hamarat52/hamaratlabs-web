// Swapline sunumu, 17. slayt: ElevenLabs sesli soru-cevap ajanı için kısa ömürlü imzalı adres.
// Anahtar yalnız Cloudflare Pages gizli değişkeninde (ELEVENLABS_API_KEY); istemciye gitmez.
// Harcama sınırı ajanın kendisinde: konuşma en çok 90 sn, günde en çok 4, aynı anda 1.
const AJAN = 'agent_9401m8eza99qfx5a30fqhg7cdkaf';
const IZINLI = ['https://hamaratlabs.com', 'https://www.hamaratlabs.com'];

const json = (durum, govde) =>
  new Response(JSON.stringify(govde), {
    status: durum,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });

export async function onRequestGet({ request, env }) {
  const kaynak = request.headers.get('origin') || request.headers.get('referer') || '';
  if (!IZINLI.some((k) => kaynak.startsWith(k)) && !kaynak.includes('.hamaratlabs-web.pages.dev')) {
    return json(403, { hata: 'kaynak' });
  }
  if (!env.ELEVENLABS_API_KEY) return json(503, { hata: 'anahtar-yok' });
  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AJAN}`,
      { headers: { 'xi-api-key': env.ELEVENLABS_API_KEY } },
    );
    if (!r.ok) return json(502, { hata: 'ust', durum: r.status });
    const j = await r.json();
    if (typeof j.signed_url !== 'string' || !j.signed_url.startsWith('wss://')) return json(502, { hata: 'bicim' });
    return json(200, { signed_url: j.signed_url });
  } catch {
    return json(502, { hata: 'baglanti' });
  }
}
