const BASE = "https://api.sonzaix.indevs.in"

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const path = url.pathname

    // ======================
    // 🔥 UNIVERSAL STREAM AUTO
    // ======================
    if (path === "/api/stream") {
      const provider = url.searchParams.get("p")
      const id = url.searchParams.get("id")

      if (!provider || !id) {
        return Response.json({ error: "missing p or id" })
      }

      // ambil detail dulu
      const detailRes = await fetch(`${BASE}/${provider}/detail?id=${id}`)
      const detail = await detailRes.json()

      // AUTO DETECT PARAM
      let streamUrl = ""

      // melolo
      if (provider === "melolo") {
        streamUrl = `${BASE}/melolo/stream?id=${id}`
      }

      // goodshort
      else if (provider === "goodshort") {
        streamUrl = `${BASE}/goodshort/stream?bookId=${id}`
      }

      // dramawave
      else if (provider === "dramawave") {
        streamUrl = `${BASE}/dramawave/stream?dramaId=${id}&episode=1`
      }

      // fallback
      else {
        return Response.json({ error: "provider not supported yet" })
      }

      const res = await fetch(streamUrl)
      const text = await res.text()

      return new Response(text, {
        headers: { "content-type": "application/json" }
      })
    }

    // ======================
    // 🔹 RAW PROXY
    // ======================
    if (path.startsWith("/api/")) {
      const target = BASE + path.replace("/api", "") + url.search
      return fetch(target)
    }

    return new Response("OK")
  }
}
