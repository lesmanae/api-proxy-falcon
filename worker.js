const BASE = "https://api.sonzaix.indevs.in"

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const path = url.pathname

    // ======================
    // 🔹 RAW PROXY (ALL API)
    // ======================
    if (path.startsWith("/raw/")) {
      const target = BASE + path.replace("/raw", "") + url.search
      return fetch(target)
    }

    // ======================
    // 🔹 HOME API
    // ======================
    if (path === "/api/home") {
      const res = await fetch(BASE + "/melolo/home")
      const json = await res.json()

      const data = json?.data || []

      const result = data.map(item => ({
        id: item.id,
        title: item.title,
        thumbnail: item.cover,
        views: item.views
      }))

      return Response.json(result)
    }

    // ======================
    // 🔹 SEARCH API
    // ======================
    if (path === "/api/search") {
      const q = url.searchParams.get("q") || ""

      const res = await fetch(BASE + "/melolo/search?q=" + q)
      const json = await res.json()

      const result = json?.data?.map(item => ({
        id: item.id,
        title: item.title,
        thumbnail: item.cover
      })) || []

      return Response.json(result)
    }

    // ======================
    // 🔹 DETAIL API
    // ======================
    if (path === "/api/detail") {
      const id = url.searchParams.get("id")

      const res = await fetch(BASE + "/melolo/detail?id=" + id)
      const json = await res.json()

      const d = json?.data || {}

      return Response.json({
        title: d.title,
        description: d.description,
        thumbnail: d.cover,
        episodes: d.episodes || []
      })
    }

    // ======================
    // 🔹 PLAYER API
    // ======================
    if (path === "/api/player") {
      const id = url.searchParams.get("id")

      const res = await fetch(BASE + "/melolo/player?id=" + id)
      const json = await res.json()

      return Response.json({
        video: json?.data?.url || null
      })
    }

    // ======================
    // 🔹 DEFAULT
    // ======================
    return new Response("API Proxy Running 🚀", {
      headers: { "content-type": "text/plain" }
    })
  }
}
