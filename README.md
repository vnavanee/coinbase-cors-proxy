# coinbase-cors-proxy

CORS proxy for Coinbase Exchange public ticker API. One file, zero dependencies.

## Deploy steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "init"
gh repo create coinbase-cors-proxy --public --push
# or: git remote add origin https://github.com/YOU/coinbase-cors-proxy.git && git push -u origin main
```

### 2. Deploy on Vercel
1. Go to https://vercel.com/new
2. Import your `coinbase-cors-proxy` repo
3. Click **Deploy** (no settings to change)

### 3. CRITICAL — Disable Deployment Protection
After deploy, in the Vercel dashboard:
- Go to your project → **Settings** → **Deployment Protection**
- Set to **Disabled**
- Click **Save**
- Then go to **Deployments** → click the three dots on the latest deploy → **Redeploy**

Without this step all requests get a 401 or 404.

### 4. Test in browser
```
https://YOUR-PROJECT.vercel.app/api/ticker?product=BTC-USD
https://YOUR-PROJECT.vercel.app/api/ticker?product=BTC-USD,ETH-USD,SOL-USD
```
Should return JSON with live prices.

### 5. Set in dashboard
In `crypto_algo_trader.jsx` line 14:
```js
const PROXY_BASE = "https://YOUR-PROJECT.vercel.app";
```

## Response format
```json
{
  "data": {
    "BTC": { "price": 63088, "bid": 63085, "ask": 63091, "volume": 18432, "time": "..." }
  },
  "fetchedAt": "2026-06-04T..."
}
```
