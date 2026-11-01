module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "Arama metni gerekli" });

  const key = process.env.SERPAPI_KEY;
  if (!key) return res.status(500).json({ error: "Sunucu anahtarı tanımlı değil" });

  const url = new URL("https://serpapi.com/search.json");
  url.search = new URLSearchParams({
    engine: "google_shopping",
    q,
    gl: "tr",
    hl: "tr",
    api_key: key,
  }).toString();

  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok || data.error) {
      return res.status(502).json({ error: data.error || "Arama başarısız" });
    }

    const results = (data.shopping_results || [])
      .filter(p => typeof p.extracted_price === "number")
      .map(p => ({
        title: p.title,
        price: p.price,
        extracted_price: p.extracted_price,
        source: p.source,
        link: p.product_link || p.link,
        thumbnail: p.thumbnail,
      }))
      .sort((a, b) => a.extracted_price - b.extracted_price);

    res.status(200).json({ results });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
};
