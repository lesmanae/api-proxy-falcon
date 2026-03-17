const BASE = "https://api.sonzaix.indevs.in"

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const path = url.pathname

    // ======================
    // 🔹 UI EXPLORER (FULL)
    // ======================
    if (path === "/explorer") {
      return new Response(`
<!DOCTYPE html>
<html>
<head>
  <title>API Explorer 🚀</title>
  <style>
    body { font-family: sans-serif; background:#0f172a; color:white; padding:20px }
    button { padding:10px; margin:5px; border:none; border-radius:8px; cursor:pointer }
    pre { background:#020617; padding:10px; overflow:auto; border-radius:10px }
    input { padding:10px; border-radius:8px; border:none }
  </style>
</head>
<body>

<h2>🚀 API Explorer Falcon</h2>

<h3>📦 Provider</h3>
<button onclick="setProvider('melolo')">Melolo</button>
<button onclick="setProvider('dramawave')">Dramawave</button>
<button onclick="setProvider('goodshort')">GoodShort</button>

<h3>⚙️ Endpoint</h3>
<button onclick="call('home')">Home</button>
<button onclick="call('search?q=cinta')">Search</button>
<button onclick="call('detail?id=7452742487271017488')">Detail</button>
<button onclick="call('player?id=7452742487271017488')">Player</button>

<h3>🧪 Custom</h3>
<input id="custom" placeholder="detail?id=..." />
<button onclick="customCall()">Run</button>

<pre id="output">Klik tombol untuk test API...</pre>

<script>
let provider = "melolo"

function setProvider(p){
  provider = p
  document.getElementById("output").textContent = "Provider: " + p
}

async function call(endpoint){
  const url = "/raw/" + provider + "/" + endpoint
  const res = await fetch(url)
  const text = await res.text()
  document.getElementById("output").textContent = text
}

function customCall(){
  const val = document.getElementById("custom").value
  call(val)
}
</script>

</body>
</html>
`, {
        headers: { "content-type": "text/html" }
      })
    }

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

      const res = await fetch(BASE + "/melolo/detail?id=" + id)
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

      const res = await fetch(BASE + "/melolo/player?id=" + id)
      const json = await res.json()

      return Response.json({
        video: json?.data?.url || null
      })
    }

    // ======================
    // 🔹 DEFAULT
    // ======================
    return new Response(
      JSON.stringify({
        status: "OK",
        message: "API Proxy Falcon 🚀",
        endpoints: [
          "/explorer",
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
