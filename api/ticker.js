/**
 * Vercel Serverless Function: /api/ticker
 *
 * Proxies public Coinbase Exchange ticker requests to bypass browser CORS.
 *
 * Usage:
 *   GET /api/ticker?product=BTC-USD
 *   GET /api/ticker?product=BTC-USD,ETH-USD,SOL-USD   (comma-separated batch)
 *
 * Returns:
 *   { data: { BTC: { price, bid, ask, volume, time }, ETH: {...} }, fetchedAt }
 */

const CB_EXCHANGE_BASE = "https://api.exchange.coinbase.com";

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
}

function productToSymbol(productId) {
  return productId.replace(/-USD[T]?$/, "");
}

async function fetchTicker(productId) {
  const url = `${CB_EXCHANGE_BASE}/products/${encodeURIComponent(productId)}/ticker`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "coinbase-cors-proxy/1.0",
    },
  });

  if (!res.ok) {
    throw new Error(`Coinbase returned HTTP ${res.status} for ${productId}`);
  }

  const data = await res.json();
  return {
    price: parseFloat(data.price) || null,
    bid:   parseFloat(data.bid)   || null,
    ask:   parseFloat(data.ask)   || null,
    volume: parseFloat(data.volume) || null,
    time:  data.time || new Date().toISOString(),
    productId,
  };
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const productParam = req.query.product;

  if (!productParam) {
    return res.status(400).json({
      error: "Missing ?product= param. Example: ?product=BTC-USD or ?product=BTC-USD,ETH-USD,SOL-USD",
    });
  }

  // Support comma-separated batch: ?product=BTC-USD,ETH-USD,SOL-USD
  const productIds = productParam
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 10); // cap at 10 to prevent abuse

  // Validate — only allow standard product ID format
  const invalid = productIds.filter((p) => !/^[A-Z0-9]+-[A-Z0-9]+$/.test(p));
  if (invalid.length > 0) {
    return res.status(400).json({ error: `Invalid product IDs: ${invalid.join(", ")}` });
  }

  try {
    const results = await Promise.allSettled(productIds.map(fetchTicker));

    const data = {};
    const errors = {};

    for (let i = 0; i < productIds.length; i++) {
      const symbol = productToSymbol(productIds[i]);
      const result = results[i];
      if (result.status === "fulfilled") {
        data[symbol] = result.value;
      } else {
        errors[symbol] = result.reason?.message || "Unknown error";
      }
    }

    // Cache at the CDN edge for 5s to reduce upstream load
    res.setHeader("Cache-Control", "public, s-maxage=5, stale-while-revalidate=10");

    return res.status(200).json({
      data,
      ...(Object.keys(errors).length > 0 && { errors }),
      fetchedAt: new Date().toISOString(),
    });

  } catch (err) {
    return res.status(502).json({ error: "Proxy fetch failed", detail: err.message });
  }
};
