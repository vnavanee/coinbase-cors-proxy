const CB = "https://api.exchange.coinbase.com";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { product } = req.query;
  if (!product) return res.status(400).json({ error: "Missing ?product= e.g. ?product=BTC-USD,ETH-USD,SOL-USD" });

  const ids = product.split(",").map(p => p.trim().toUpperCase()).filter(Boolean).slice(0, 10);
  const invalid = ids.filter(p => !/^[A-Z0-9]+-[A-Z0-9]+$/.test(p));
  if (invalid.length) return res.status(400).json({ error: `Invalid product IDs: ${invalid.join(", ")}` });

  const results = await Promise.allSettled(ids.map(async id => {
    const r = await fetch(`${CB}/products/${id}/ticker`, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    return { id, price: parseFloat(d.price), bid: parseFloat(d.bid), ask: parseFloat(d.ask), volume: parseFloat(d.volume), time: d.time };
  }));

  const data = {}, errors = {};
  results.forEach((r, i) => {
    const sym = ids[i].replace(/-USD.*$/, "");
    if (r.status === "fulfilled") data[sym] = r.value;
    else errors[sym] = r.reason?.message || "failed";
  });

  res.setHeader("Cache-Control", "public, s-maxage=5, stale-while-revalidate=10");
  return res.status(200).json({ data, ...(Object.keys(errors).length && { errors }), fetchedAt: new Date().toISOString() });
};
