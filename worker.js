const BASE = "https://api.sonzaix.indevs.in"

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const path = url.pathname

    // ======================
    // 🔹 UI EXPLORER
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
  </style>
</head>
<body>

<h2>🚀 API Explorer Falcon</h2>

<button onclick="call('/api/home')">Home</button>
<button onclick="call('/api/search?q=cinta')">Search</button>

<button onclick="call('/raw/melolo/home')">RAW Home</button>
<button onclick="call('/raw/melolo/search?q=cinta')">RAW Search</button>

<input id="custom" placeholder="/raw/melolo/detail?id=..." style="width:300px"/>
<button onclick="customCall()">Custom</button>

<pre id="output">Klik tombol untuk test API...</pre>

<script>
async function call(url){
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
    // 🔹 RAW PROXY
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

      const books = json?.data?.[0]?.books || []

      const result = books.map(item => ({
        id: item.drama_id,
        title: item.drama_name,
        thumbnail: item.thumb_url
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

      const books = json?.data?.[0]?.books || []

      const result = books.map(item => ({
        id: item.drama_id,
        title: item.drama_name,
        thumbnail: item.thumb_url
      }))

      return Response.json(result)
    }

    return new Response("OK")
  }
}
