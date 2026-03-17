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
    // 🔹 HOME API (FIX)
    // ======================
    if (path === "/api/home") {
      const res = await fetch(BASE + "/melolo/home")
      const json = await res.json()

      const books = json?.data?.[0]?.books || []

      const result = books.map(item => ({
        id: item.drama_id,
        title: item.drama_name,
        thumbnail: item.thumb_url,
        views: item.watch_value,
        episode: item.episode_count
      }))

      return Response.json(result)
    }

    // ======================
    // 🔹 SEARCH API (FIX)
    // ======================
    if (path === "/api/search") {
      const q = url.searchParams.get("q") || ""

      const res = await fetch(BASE + "/melolo/search?q=" + q)
      const json = await res.json()

      const books = json?.data?.[0]?.books || []

      const result = books.map(item => ({
        id: item.drama_id,
        title: item.drama_name,
        thumbnail: item.thumb_url
      }))

      return Response.json(result)
    }

    // ======================
    // 🔹 DETAIL API
    // ======================
    if (path === "/api/detail") {
      const id = url.searchParams.get("id")

      const res = await fetch(BASE + `/melolo/detail?id=${id}`)
      const json = await res.json()

      const d = json?.data || {}

      return Response.json({
        title: d.drama_name,
        description: d.description,
        thumbnail: d.thumb_url,
        episodes: d.episodes || []
      })
    }

    // ======================
    // 🔹 PLAYER API
    // ======================
    if (path === "/api/player") {
      const id = url.searchParams.get("id")

      const res = await fetch(BASE + `/melolo/player?id=${id}`)
      const json = await res.json()

      return Response.json({
        video: json?.data?.url || null
      })
    }

    // ======================
    // 🔹 DEFAULT PAGE
    // ======================
    return new Response(
      JSON.stringify({
        status: "OK",
        message: "API Proxy Falcon 🚀",
        endpoints: [
          "/api/home",
          "/api/search?q=keyword",
          "/api/detail?id=xxx",
          "/api/player?id=xxx",
          "/raw/*"
        ]
      }, null, 2),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    )
  }
}
