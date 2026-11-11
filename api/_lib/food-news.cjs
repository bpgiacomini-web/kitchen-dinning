// Preview reads one fixed public feed. Never proxy caller-supplied URLs or
// forward account credentials. This runs inside the existing lookup function.
async function readFoodNews(fetchImpl) {
  const response = await fetchImpl('https://bpgiacomini-web.github.io/kitchen-dinning/news.json', {
    headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Feed unavailable');
  const text = await response.text();
  if (text.length > 250000) throw new Error('Feed too large');
  const payload = JSON.parse(text);
  if (!Array.isArray(payload.items)) throw new Error('Invalid feed');
  return { updated: payload.updated, items: payload.items.slice(0, 20) };
}
module.exports = { readFoodNews };
