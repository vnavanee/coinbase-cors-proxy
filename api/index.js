module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({
    name: "coinbase-cors-proxy",
    status: "ok",
    endpoints: {
      ticker: "/api/ticker?product=BTC-USD",
      batch:  "/api/ticker?product=BTC-USD,ETH-USD,SOL-USD"
    }
  });
};
