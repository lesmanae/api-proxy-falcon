const BASE = "https://api.sonzaix.indevs.in"

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const path = url.pathname

    // ======================
    // 🔥 PRO EXPLORER UI
    // ======================
    if (path === "/explorer") {
      return new Response(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Falcon Explorer PRO</title>

<style>
body {
  background:#0f172a;
  color:white;
  font-family:sans-serif;
  padding:20px;
}

.grid {
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(150px,1fr));
  gap:15px;
}

.card {
  background:#020617;
  border-radius:12px;
  overflow:hidden;
  cursor:pointer;
  transition:.2s;
}

.card:hover { transform:scale(1.05); }

.card img {
  width:100%;
  height:200px;
  object-fit:cover;
}

.card p {
  padding:10px;
  font-size:14px;
}

video {
  width:100%;
  margin-top:20px;
  border-radius:10px;
}

input,button {
  padding:10px;
  border-radius:8px;
  border:none;
  margin:5px;
}

pre {
  background:#020617;
  padding:10px;
  border-radius:10px;
  overflow:auto;
}
</style>
</head>

<body>

<h2>🚀 Falcon Explorer PRO</h2>

<!-- PROVIDER -->
<button onclick="setProvider('melolo')">Melolo</button>
<button onclick="setProvider('dramawave')">Dramawave</button>
<button onclick="setProvider('goodshort')">GoodShort</button>

<br><br>

<input id="id" placeholder="Manual ID (opsional)">
<button onclick="manualDetail()">Detail</button>
<button onclick="manualPlayer()">Play</button>

<h3>📺 List</h3>
<div id="list" class="grid"></div>

<h3>🎬 Player</h3>
<video id="player" controls></video>

<h3>📄 JSON</h3>
<pre id="json">Loading...</pre>

<script>
let provider = "melolo"

function setProvider(p){
  provider = p
  loadHome()
}

async function loadHome(){
  const res = await fetch("/raw/" + provider + "/home")
  const json = await res.json()

  const books = json?.data?.[0]?.books || []
  const list = document.getElementById("list")
  list.innerHTML = ""

  books.forEach(item => {
    const div = document.createElement("div")
    div.className = "card"

    div.innerHTML = \`
      <img src="\${item.thumb_url}">
      <p>\${item.drama_name}</p>
    \`

    div.onclick = () => selectItem(item.drama_id)

    list.appendChild(div)
  })

  document.getElementById("json").textContent =
    JSON.stringify(json, null, 2)
}

async function selectItem(id){
  document.getElementById("id").value = id

  // DETAIL
  const d = await fetch("/raw/" + provider + "/detail?id=" + id)
  const dj = await d.json()

  document.getElementById("json").textContent =
    JSON.stringify(dj, null, 2)

  // PLAYER
  try {
    const p = await fetch("/raw/" + provider + "/player?id=" + id)
    const pj = await p.json()

    const video =
      pj?.data?.url ||
      pj?.data?.video_url ||
      pj?.url

    if(video){
      document.getElementById("player").src = video
    }
  } catch(e){
    console.log("player error")
  }
}

async function manualDetail(){
  const id = document.getElementById("id").value
  const res = await fetch("/raw/" + provider + "/detail?id=" + id)
  const json = await res.json()
  document.getElementById("json").textContent =
    JSON.stringify(json, null, 2)
}

async function manualPlayer(){
  const id = document.getElementById("id").value
  const res = await fetch("/raw/" + provider + "/player?id=" + id)
  const json = await res.json()

  const video =
    json?.data?.url ||
    json?.data?.video_url ||
    json?.url

  if(video){
    document.getElementById("player").src = video
  }

  document.getElementById("json").textContent =
    JSON.stringify(json, null, 2)
}

loadHome()
</script>

</body>
</html>`, {
        headers: { "content-type": "text/html; charset=UTF-8" }
      })
    }

    // ======================
    // 🔹 RAW PROXY
    // ======================
    if (path.startsWith("/raw/")) {
      const target = BASE + path.replace("/raw", "") + url.search
      return fetch(target)
    }

    return new Response("OK")
  }
}
