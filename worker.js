const BASE = "https://api.sonzaix.indevs.in"

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const path = url.pathname

    if (path === "/explorer") {
      return new Response(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Falcon Auto Player</title>

<style>
body { background:#0f172a;color:white;font-family:sans-serif;padding:20px }
.grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:15px }
.card { background:#020617;border-radius:12px;overflow:hidden;cursor:pointer }
.card img { width:100%;height:200px;object-fit:cover }
.card p { padding:10px;font-size:14px }
video { width:100%;margin-top:20px }
</style>
</head>

<body>

<h2>🔥 Falcon Auto Player</h2>

<button onclick="setProvider('melolo')">Melolo</button>
<button onclick="setProvider('dramawave')">Dramawave</button>
<button onclick="setProvider('goodshort')">GoodShort</button>

<div id="list" class="grid"></div>

<video id="player" controls></video>
<pre id="json"></pre>

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

    div.onclick = () => autoPlay(item.drama_id)

    list.appendChild(div)
  })
}

async function autoPlay(id){
  // 1. ambil detail
  const d = await fetch("/raw/" + provider + "/detail?id=" + id)
  const dj = await d.json()

  document.getElementById("json").textContent =
    JSON.stringify(dj, null, 2)

  // 2. cari episode
  let ep = null

  if(dj?.data?.episodes){
    ep = dj.data.episodes[0]?.id
  }

  if(!ep && dj?.data?.episode_list){
    ep = dj.data.episode_list[0]?.episode_id
  }

  if(!ep){
    console.log("episode tidak ditemukan")
    return
  }

  // 3. play
  const p = await fetch("/raw/" + provider + "/player?id=" + ep)
  const pj = await p.json()

  const video =
    pj?.data?.url ||
    pj?.data?.video_url ||
    pj?.url

  if(video){
    document.getElementById("player").src = video
  }
}

loadHome()
</script>

</body>
</html>`, {
        headers: { "content-type": "text/html; charset=UTF-8" }
      })
    }

    if (path.startsWith("/raw/")) {
      const target = BASE + path.replace("/raw", "") + url.search
      return fetch(target)
    }

    return new Response("OK")
  }
}
