// Swapline sunumu, 17. slayt: canlı sesli ajan hazır mı? Anahtarın kendisi asla dönmez.
export async function onRequestGet({ env }) {
  const hazir = Boolean(env.ELEVENLABS_API_KEY);
  return new Response(JSON.stringify({ hazir, statik: false, anahtar: hazir, ajan: true, internet: true }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });
}
