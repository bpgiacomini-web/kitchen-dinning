import { authenticatedUser } from './user-data.js';
import { consumeAccountRateLimit, sendRateLimitResponse } from './_lib/rate-limit.js';

const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v2/product/';

export function createPizzaLookupHandler({ fetcher = fetch, authenticate = authenticatedUser, limitRequests = consumeAccountRateLimit } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed.' });
    }

    const identity = await authenticate(req);
    if (identity.error) return res.status(identity.status || 503).json({ error: identity.error });
    const upc = String(req.body?.upc || '').trim();
    if (!/^\d{8,14}$/.test(upc)) return res.status(400).json({ error: 'Enter an 8 to 14 digit UPC barcode.' });
    try {
      const allowance = await limitRequests({ scope: 'pizza-upc-lookup', accountId: identity.userId, limit: 30, windowSeconds: 60 });
      if (!allowance.allowed) return sendRateLimitResponse(res, allowance.retryAfterSeconds);
    } catch (error) {
      console.error('Metro Eats UPC lookup rate limit unavailable', String(error?.message || 'rate_limit_error').slice(0, 80));
      return res.status(503).json({ error: 'UPC lookup is temporarily unavailable. Please try again later.' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const url = new URL(`${OPEN_FOOD_FACTS_URL}${encodeURIComponent(upc)}.json`);
      url.searchParams.set('fields', 'code,product_name,product_name_en,brands');
      const response = await fetcher(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'MetroEats/1.0 (frozen-pizza UPC lookup)' },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`upstream_${response.status}`);
      const payload = await response.json();
      const product = payload?.product;
      const brand = String(product?.brands || '').split(',')[0].trim();
      const name = String(product?.product_name_en || product?.product_name || '').trim();
      if (payload?.status !== 1 || !product || (!brand && !name)) return res.status(404).json({ error: 'No product details were found for that UPC. You can enter the brand and pizza name yourself.' });
      const productCode = String(product.code || '');
      return res.status(200).json({ product: { upc: /^\d{8,14}$/.test(productCode) ? productCode : upc, brand, name, source: 'Open Food Facts' } });
    } catch (error) {
      console.error('Metro Eats UPC lookup failed', String(error?.message || 'upstream_error').slice(0, 80));
      return res.status(502).json({ error: 'Product lookup is temporarily unavailable. You can enter the brand and pizza name yourself.' });
    } finally { clearTimeout(timeout); }
  };
}

export default createPizzaLookupHandler();
