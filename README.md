# coinbase-cors-proxy

A zero-dependency Vercel Edge Function that proxies the public Coinbase Exchange
ticker API, adding CORS headers so browser-based apps (including Claude artifacts)
can fetch live prices without being blocked.

## Deploy in 3 steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "init"
gh repo create coinbase-cors-proxy --public --push
```

### 2. Import into Vercel
1. Go to https://vercel.com/new
2. Click **Import** → select your `coinbase-cors-proxy` repo
3. Leave all settings as default — Vercel auto-detects the Edge Function
4. Click **Deploy**

Your proxy URL will be: `https://coinbase-cors-proxy.vercel.app`

### 3. Update the trading dashboard
In `crypto_algo_trader.jsx`, find this line near the top:
```js
const PROXY_BASE = "https://YOUR-PROXY.vercel.app";
```
Replace it with your actual Vercel deployment URL.

---

## API

### GET /api/ticker?product=BTC-USD
```json
{
  "data": {
    "BTC": { "price": 63088, "bid": 63085, "ask": 63091, "volume": 18432.5, "time": "...", "productId": "BTC-USD" }
  },
  "fetchedAt": "2026-06-04T..."
}
```

### GET /api/ticker?product=BTC-USD,ETH-USD,SOL-USD
Batch fetch — returns all three in one round-trip.

---

## Local development
```bash
npm install
npm run dev
# Proxy runs at http://localhost:3000/api/ticker?product=BTC-USD
```

---

## Security notes
- Only `GET` requests are accepted; `POST`/`PUT`/etc. return 405
- Product IDs are validated against `/^[A-Z0-9]+-[A-Z0-9]+$/` to prevent path injection
- Batches are capped at 10 products per request
- The `ALLOWED_ORIGINS` array in `api/ticker.js` currently allows `*` for convenience.
  In production, replace it with your exact origin (e.g. `https://claude.ai`)
- Edge responses are cached for 5 seconds (`s-maxage=5`) to reduce upstream load
