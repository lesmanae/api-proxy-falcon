/**
 * ⚡ Sonzai X API — Worker + Explorer
 * Deploy: https://api-proxy-falcon.fajarlsmn2k21.workers.dev/
 * - GET /          → HTML API Explorer
 * - GET /health    → Status JSON
 * - GET /melolo/*  → Proxy ke api.sonzaix.indevs.in
 * - ... dst semua provider
 */

const TARGET_BASE = "https://api.sonzaix.indevs.in";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

const ALLOWED_PREFIXES = [
  "/melolo", "/meloshort", "/goodshort", "/dramawave",
  "/reelshort", "/freereels", "/netshort", "/dramabox",
  "/drama", "/sosmed", "/terabox", "/youtube",
  "/anime", "/samehada", "/shinigami", "/stats"
];

// Simple in-memory rate limiter (resets per isolate)
const rateMap = new Map();
function checkRate(ip) {
  const now = Date.now();
  const e = rateMap.get(ip);
  if (!e || now - e.ts > 60_000) { rateMap.set(ip, { count: 1, ts: now }); return true; }
  if (e.count >= 60) return false;
  e.count++;
  return true;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}

// ─── HTML Explorer (embedded) ─────────────────────────────────────────────────
const EXPLORER_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sonzai X API Explorer</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#0a0a0f;color:#e2e8f0;min-height:100vh}
header{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:28px 24px;text-align:center;border-bottom:1px solid #1e1e3a}
header h1{font-size:1.7rem;background:linear-gradient(135deg,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
.proxy-badge{display:inline-flex;align-items:center;gap:6px;background:#6366f115;border:1px solid #6366f130;border-radius:20px;padding:4px 12px;font-size:.65rem;color:#818cf8;margin-top:8px;font-family:monospace}
.proxy-dot{width:6px;height:6px;background:#4ade80;border-radius:50%;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.stats-bar{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;padding:12px 24px;background:#0a0a12;border-bottom:1px solid #1e1e2e}
.stat{text-align:center;padding:0 8px}
.stat-num{font-size:1.3rem;font-weight:700;color:#c084fc;font-family:monospace}
.stat-label{font-size:.58rem;color:#64748b;text-transform:uppercase;letter-spacing:1px}
.toolbar{padding:12px 20px;background:#0a0a12;position:sticky;top:0;z-index:20;border-bottom:1px solid #1e1e2e;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.toolbar input{flex:1;min-width:180px;background:#12121a;border:1px solid #1e1e2e;border-radius:7px;padding:7px 12px;color:#e2e8f0;font-size:.78rem;outline:none}
.toolbar input:focus{border-color:#6366f1}
.filter-btns{display:flex;gap:5px;flex-wrap:wrap}
.fbtn{padding:5px 10px;border-radius:6px;border:1px solid #1e1e2e;background:#12121a;color:#94a3b8;font-size:.6rem;font-weight:700;cursor:pointer;transition:all .15s;text-transform:uppercase;letter-spacing:.5px}
.fbtn:hover,.fbtn.active{background:#6366f1;color:#fff;border-color:#6366f1}
.expand-all{padding:5px 11px;border-radius:6px;border:1px solid #1e1e2e;background:#12121a;color:#94a3b8;font-size:.6rem;font-weight:700;cursor:pointer;margin-left:auto}
.expand-all:hover{background:#1e1e2e;color:#fff}
.container{max-width:1100px;margin:0 auto;padding:20px}
.cat-section{margin-bottom:32px}
.cat-title{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#475569;margin-bottom:12px;display:flex;align-items:center;gap:10px}
.cat-title::after{content:'';flex:1;height:1px;background:#1e1e2e}
.provider-card{background:#12121a;border:1px solid #1e1e2e;border-radius:13px;margin-bottom:12px;overflow:hidden}
.prov-header{padding:13px 18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;transition:background .15s}
.prov-header:hover{background:#1a1a28}
.ph-left{display:flex;align-items:center;gap:10px}
.prov-name{font-weight:700;font-size:.92rem}
.badge{font-size:.55rem;padding:2px 6px;border-radius:4px;font-weight:700}
.ep-count{font-size:.6rem;color:#64748b;font-family:monospace}
.base-path{font-size:.58rem;color:#374151;font-family:monospace}
.chevron{font-size:.65rem;color:#475569;transition:transform .25s}
.chevron.open{transform:rotate(180deg)}
.ep-grid{display:none;border-top:1px solid #1e1e2e;padding:14px;gap:10px;grid-template-columns:repeat(auto-fill,minmax(340px,1fr))}
.ep-grid.open{display:grid}
.ep{background:#0e0e16;border:1px solid #1a1a28;border-radius:10px;overflow:hidden;display:flex;flex-direction:column}
.ep-head{display:flex;align-items:center;gap:8px;padding:9px 13px;border-bottom:1px solid #1a1a28}
.method{font-size:.52rem;font-weight:700;padding:2px 6px;border-radius:3px;background:#14532d;color:#4ade80;font-family:monospace}
.ep-path{font-family:monospace;font-size:.68rem;color:#94a3b8}
.ep-name{margin-left:auto;font-size:.58rem;color:#475569}
.ep-params{padding:10px 13px;border-bottom:1px solid #1a1a28}
.params-lbl{font-size:.55rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#374151;margin-bottom:7px}
.no-param{font-size:.6rem;color:#374151;font-style:italic}
.param-row{display:flex;align-items:center;gap:5px;margin-bottom:5px}
.param-input-wrap{flex:1;display:flex;align-items:center;gap:4px}
.pname{font-family:monospace;font-size:.62rem;color:#c084fc;min-width:80px}
.preq{font-size:.48rem;background:#7f1d1d;color:#fca5a5;padding:1px 4px;border-radius:3px;font-weight:700}
.popt{font-size:.48rem;background:#1e293b;color:#64748b;padding:1px 4px;border-radius:3px;font-weight:700}
.ptype{font-size:.5rem;background:#0f172a;color:#38bdf8;padding:1px 4px;border-radius:3px;font-family:monospace;border:1px solid #1e3a5f}
.param-field{flex:1;background:#080810;border:1px solid #1a1a28;border-radius:4px;padding:4px 7px;font-size:.65rem;color:#cbd5e1;font-family:monospace;outline:none;min-width:0}
.param-field:focus{border-color:#6366f1}
.ep-url{padding:7px 13px;border-bottom:1px solid #1a1a28}
.url-label{font-size:.5rem;color:#374151;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
.url-preview{background:#060609;border:1px solid #1a1a28;border-radius:4px;padding:5px 8px;font-family:monospace;font-size:.56rem;word-break:break-all;display:flex;justify-content:space-between;align-items:flex-start;gap:6px}
.url-text{flex:1;line-height:1.5}.url-text .b{color:#6366f1}.url-text .p{color:#94a3b8}.url-text .q{color:#34d399}
.btn-copy-url{font-size:.5rem;background:#1e1e2e;color:#64748b;border:1px solid #2a2a3a;border-radius:3px;padding:2px 6px;cursor:pointer;white-space:nowrap;transition:all .15s;flex-shrink:0}
.btn-copy-url:hover{background:#334155;color:#fff}
.ep-send{padding:8px 13px}
.btn-send{width:100%;padding:8px;border:none;border-radius:7px;font-size:.72rem;font-weight:700;color:#fff;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px}
.btn-send:hover{filter:brightness(1.15)}.btn-send:active{transform:scale(.98)}.btn-send:disabled{opacity:.6;cursor:not-allowed}
.btn-send .spinner{display:none;width:12px;height:12px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite}
.btn-send.loading .spinner{display:block}.btn-send.loading .btn-label{opacity:.7}
@keyframes spin{to{transform:rotate(360deg)}}
.ep-resp{display:none;border-top:1px solid #1a1a28;flex-direction:column}
.ep-resp.visible{display:flex}
.resp-bar{display:flex;align-items:center;gap:8px;padding:5px 13px;background:#0a0a12;border-bottom:1px solid #1a1a28}
.resp-status{font-size:.58rem;font-weight:700;font-family:monospace}
.resp-time{font-size:.55rem;color:#374151;font-family:monospace;margin-left:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px}
.btn-copy-resp{font-size:.5rem;background:#1e1e2e;color:#64748b;border:1px solid #2a2a3a;border-radius:3px;padding:2px 6px;cursor:pointer;transition:all .15s;flex-shrink:0}
.btn-copy-resp:hover{background:#334155;color:#fff}
.resp-body{padding:10px 13px;max-height:340px;overflow:auto}
.resp-body pre{font-size:.6rem;font-family:monospace;white-space:pre-wrap;word-break:break-all;line-height:1.6}
.ok-c{color:#34d399}.err-c{color:#f87171}.warn-c{color:#fbbf24}
.json-key{color:#93c5fd}.json-str{color:#86efac}.json-num{color:#fcd34d}.json-bool{color:#f9a8d4}.json-null{color:#94a3b8}
.note{font-size:.58rem;color:#374151;margin-top:5px;padding-top:5px;border-top:1px solid #1a1a28;font-style:italic}
.note span{color:#f59e0b}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e1e2e;border-radius:4px}
.hidden{display:none!important}
footer{text-align:center;padding:24px;color:#374151;font-size:.65rem;border-top:1px solid #1e1e2e;margin-top:16px}
</style>
</head>
<body>
<header>
  <h1>⚡ Sonzai X API Explorer</h1>
  <div class="proxy-badge"><span class="proxy-dot"></span>Proxy via Cloudflare Workers</div>
</header>
<div class="stats-bar">
  <div class="stat"><div class="stat-num">13</div><div class="stat-label">Providers</div></div>
  <div class="stat"><div class="stat-num">64</div><div class="stat-label">Endpoints</div></div>
  <div class="stat"><div class="stat-num" id="stat-hits">--</div><div class="stat-label">Total Hits</div></div>
  <div class="stat"><div class="stat-num" id="stat-visitors">--</div><div class="stat-label">Visitors</div></div>
</div>
<div class="toolbar">
  <input type="text" id="searchInput" placeholder="🔍  Cari endpoint, path, parameter..." oninput="applyFilters()">
  <div class="filter-btns">
    <button class="fbtn active" onclick="setCategory('all',this)">All</button>
    <button class="fbtn" onclick="setCategory('Short Drama API',this)">Short Drama</button>
    <button class="fbtn" onclick="setCategory('Movie API',this)">Movie</button>
    <button class="fbtn" onclick="setCategory('Tool API',this)">Tools</button>
    <button class="fbtn" onclick="setCategory('Anime API',this)">Anime</button>
    <button class="fbtn" onclick="setCategory('Manga API',this)">Manga</button>
  </div>
  <button class="expand-all" onclick="toggleAll()">▼ Expand All</button>
</div>
<div class="container" id="app"></div>
<footer><p>⚡ Sonzai X API Explorer · Powered by Cloudflare Workers</p></footer>
<script>
const PROXY=location.origin;
const PROVIDERS=[
  {id:'melolo',name:'Melolo Short Drama',color:'#3b82f6',badge:'VIDEO',cat:'Short Drama API',endpoints:[
    {id:'search',path:'/melolo/search',desc:'Search',fields:[{n:'q',l:'query',req:true,v:'cinta'},{n:'result',l:'result',t:'number',v:'10'},{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'home',path:'/melolo/home',desc:'Homepage',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'populer',path:'/melolo/populer',desc:'Trending',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'new',path:'/melolo/new',desc:'Latest',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'detail',path:'/melolo/detail',desc:'Detail',pathParam:true,fields:[{n:'id',l:'id',req:true,v:'7604805998028524597'}]},
    {id:'stream',path:'/melolo/stream',desc:'Stream',pathParam:true,fields:[{n:'id',l:'id',req:true,v:'7605082003200805893'}]},
  ]},
  {id:'meloshort',name:'Meloshort Short Drama',color:'#ec4899',badge:'VIDEO',cat:'Short Drama API',endpoints:[
    {id:'home',path:'/meloshort/home',desc:'Homepage',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'populer',path:'/meloshort/populer',desc:'Trending',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'new',path:'/meloshort/new',desc:'Latest',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'search',path:'/meloshort/search',desc:'Search',fields:[{n:'query',l:'query',req:true,v:'cinta'},{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'detail',path:'/meloshort/detail',desc:'Detail',fields:[{n:'dramaId',l:'dramaId',req:true,v:'68fb509fcfb66cb496173efd'}]},
    {id:'stream',path:'/meloshort/stream',desc:'Stream',fields:[{n:'dramaId',l:'dramaId',req:true,v:'68fb509fcfb66cb496173efd'},{n:'episodeId',l:'episodeId',req:true,v:'68fb50a1cfb66cb496173efe'}]},
  ]},
  {id:'goodshort',name:'GoodShort Short Drama',color:'#10b981',badge:'VIDEO',cat:'Short Drama API',endpoints:[
    {id:'home',path:'/goodshort/home',desc:'Homepage',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'populer',path:'/goodshort/populer',desc:'Trending',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'new',path:'/goodshort/new',desc:'Latest',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'nav',path:'/goodshort/nav',desc:'Categories',fields:[]},
    {id:'search',path:'/goodshort/search',desc:'Search',fields:[{n:'query',l:'query',req:true,v:'SISTEM'},{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'detail',path:'/goodshort/detail',desc:'Detail',fields:[{n:'bookId',l:'bookId',req:true,v:'31001293031'}]},
    {id:'stream',path:'/goodshort/stream',desc:'Chapters',fields:[{n:'bookId',l:'bookId',req:true,v:'31001020259'}]},
  ]},
  {id:'dramawave',name:'DramaWave Short Drama',color:'#8b5cf6',badge:'VIDEO',cat:'Short Drama API',endpoints:[
    {id:'home',path:'/dramawave/home',desc:'Homepage',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'new',path:'/dramawave/new',desc:'Latest',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'populer',path:'/dramawave/populer',desc:'Trending',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'search',path:'/dramawave/search',desc:'Search',fields:[{n:'q',l:'query',req:true,v:'cinta'},{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'detail',path:'/dramawave/detail',desc:'Detail',fields:[{n:'id',l:'id',req:true,v:'jYV3ctG1s0'}]},
    {id:'stream',path:'/dramawave/stream',desc:'Stream',fields:[{n:'dramaId',l:'dramaId',req:true,v:'jYV3ctG1s0'},{n:'episode',l:'episode',t:'number',req:true,v:'1'}]},
  ]},
  {id:'reelshort',name:'ReelShort Short Drama',color:'#f59e0b',badge:'VIDEO',cat:'Short Drama API',endpoints:[
    {id:'home',path:'/reelshort/home',desc:'Homepage',fields:[]},
    {id:'populer',path:'/reelshort/populer',desc:'Trending',fields:[]},
    {id:'new',path:'/reelshort/new',desc:'Latest',fields:[]},
    {id:'search',path:'/reelshort/search',desc:'Search',fields:[{n:'query',l:'query',req:true,v:'sistem'},{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'detail',path:'/reelshort/detail',desc:'Detail',fields:[{n:'bookId',l:'bookId',req:true,v:'6912a740a243495b7d09ace2'}]},
    {id:'stream',path:'/reelshort/stream',desc:'Stream',fields:[{n:'bookId',l:'bookId',req:true,v:'6912a740a243495b7d09ace2'},{n:'chapterId',l:'chapterId',req:true,v:'sfe7zypnx6'}]},
  ]},
  {id:'freereels',name:'FreeReels Short Drama',color:'#06b6d4',badge:'VIDEO',cat:'Short Drama API',endpoints:[
    {id:'home',path:'/freereels/home',desc:'Homepage',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'populer',path:'/freereels/populer',desc:'Trending',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'new',path:'/freereels/new',desc:'Latest',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'search',path:'/freereels/search',desc:'Search',fields:[{n:'q',l:'query',req:true,v:'love'},{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'detail',path:'/freereels/detail',desc:'Detail',fields:[{n:'dramaId',l:'dramaId',req:true,v:'UxhVGruD4D'}]},
    {id:'stream',path:'/freereels/stream',desc:'Stream',fields:[{n:'dramaId',l:'dramaId',req:true,v:'UxhVGruD4D'},{n:'episode',l:'episode',t:'number',req:true,v:'1'}]},
  ]},
  {id:'netshort',name:'NetShort Short Drama',color:'#f43f5e',badge:'VIDEO',cat:'Short Drama API',endpoints:[
    {id:'home',path:'/netshort/home',desc:'Homepage',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'populer',path:'/netshort/populer',desc:'Trending',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'new',path:'/netshort/new',desc:'Latest',fields:[]},
    {id:'search',path:'/netshort/search',desc:'Search',fields:[{n:'query',l:'query',req:true,v:'cinta'},{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'detail',path:'/netshort/detail',desc:'Detail',fields:[{n:'dramaId',l:'dramaId',req:true,v:'2001954146244636674'}]},
    {id:'stream',path:'/netshort/stream',desc:'Stream (episode)',fields:[{n:'dramaId',l:'dramaId',req:true,v:'2001954146244636674'},{n:'episode',l:'episode',t:'number',req:true,v:'1'}]},
  ]},
  {id:'dramabox',name:'DramaBox Short Drama',color:'#a855f7',badge:'VIDEO',cat:'Short Drama API',endpoints:[
    {id:'home',path:'/dramabox/home',desc:'Homepage',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'populer',path:'/dramabox/populer',desc:'Trending',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'new',path:'/dramabox/new',desc:'Latest',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'search',path:'/dramabox/search',desc:'Search',fields:[{n:'q',l:'query',req:true,v:'cinta'},{n:'result',l:'result',t:'number',v:'10'},{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'detail',path:'/dramabox/detail',desc:'Detail',pathParam:true,fields:[{n:'id',l:'id',req:true,v:'42000001340'}]},
    {id:'stream',path:'/dramabox/stream',desc:'Stream',fields:[{n:'dramaId',l:'dramaId',req:true,v:'42000001340'},{n:'episodeIndex',l:'episodeIndex',t:'number',req:true,v:'0'}]},
  ]},
  {id:'drama',name:'Drama (Drakor)',color:'#14b8a6',badge:'MOVIE',cat:'Movie API',endpoints:[
    {id:'homekorea',path:'/drama/home/korea',desc:'Home Korea',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'homechina',path:'/drama/home/china',desc:'Home China',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'search',path:'/drama/search',desc:'Search',fields:[{n:'q',l:'query',req:true,v:'Squid Game'},{n:'limit',l:'limit',t:'number',v:'10'}]},
    {id:'info',path:'/drama/info',desc:'Info',fields:[{n:'id',l:'id',req:true,v:'3135'}]},
    {id:'stream',path:'/drama/stream',desc:'Stream',fields:[{n:'id',l:'id',req:true,v:'36943'}]},
  ]},
  {id:'sosmed',name:'Social Media Downloader',color:'#ec4899',badge:'TOOL',cat:'Tool API',endpoints:[
    {id:'tiktok',path:'/sosmed/tiktok',desc:'TikTok',fields:[{n:'url',l:'url',req:true,v:'https://vt.tiktok.com/ZSmbFjNGC/'}]},
    {id:'facebook',path:'/sosmed/facebook',desc:'Facebook',fields:[{n:'url',l:'url',req:true,v:'https://www.facebook.com/share/r/19f798L4GQ/'}]},
    {id:'instagram',path:'/sosmed/instagram',desc:'Instagram',fields:[{n:'url',l:'url',req:true,v:'https://www.instagram.com/reels/DUAj4SRD_IV'}]},
  ]},
  {id:'terabox',name:'TeraBox Downloader',color:'#22d3ee',badge:'TOOL',cat:'Tool API',endpoints:[
    {id:'dl',path:'/terabox',desc:'Download',fields:[{n:'url',l:'url',req:true,v:'https://1024terabox.com/s/1HcZ4bbKShOS8o69NX7MXFg'},{n:'pwd',l:'pwd',v:''}]},
  ]},
  {id:'youtube',name:'YouTube Downloader',color:'#ef4444',badge:'TOOL',cat:'Tool API',endpoints:[
    {id:'video',path:'/youtube/video',desc:'Download Video',fields:[{n:'url',l:'url',req:true,v:'https://www.youtube.com/watch?v=rcAw6ZQ0jbE'}]},
    {id:'music',path:'/youtube/music',desc:'Download Audio',fields:[{n:'url',l:'url',req:true,v:'https://www.youtube.com/watch?v=rcAw6ZQ0jbE'}]},
  ]},
  {id:'anime',name:'Anime',color:'#ef4444',badge:'ANIME',cat:'Anime API',endpoints:[
    {id:'home',path:'/anime/home',desc:'Latest Update',fields:[{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'ongoing',path:'/anime/ongoing',desc:'Ongoing',fields:[]},
    {id:'jadwal',path:'/anime/jadwal',desc:'Jadwal Rilis',fields:[]},
    {id:'animelist',path:'/anime/anime-list',desc:'Anime List',fields:[]},
    {id:'search',path:'/anime/search',desc:'Search',fields:[{n:'query',l:'query',req:true,v:'tensei'},{n:'page',l:'page',t:'number',v:'1'}]},
    {id:'detail',path:'/anime/detail',desc:'Detail',fields:[{n:'series',l:'series',req:true,v:'tensei-akujo-kuro-rekishi-sub-indo'}]},
    {id:'stream',path:'/anime/stream',desc:'Stream',fields:[{n:'slug',l:'slug',req:true,v:'al-150566-1'},{n:'series',l:'series',v:'tensei-akujo-kuro-rekishi-sub-indo'},{n:'episode',l:'episode',t:'number',v:'1'}]},
  ]},
  {id:'samehada',name:'Samehadaku Anime',color:'#ef4444',badge:'ANIME',cat:'Anime API',endpoints:[
    {id:'search',path:'/samehada',desc:'Search',fields:[{n:'s',l:'search',req:true,v:'tensei'}]},
    {id:'dl',path:'/samehada',desc:'Download',fields:[{n:'dl',l:'url slug',req:true,v:'tensei-shitara-dragon-no-tamago-datta-episode-1'}]},
  ]},
  {id:'shinigami',name:'Shinigami Manga',color:'#6366f1',badge:'MANGA',cat:'Manga API',endpoints:[
    {id:'search',path:'/shinigami/search',desc:'Search',fields:[{n:'q',l:'query',req:true,v:'villain'}]},
    {id:'chapter',path:'/shinigami/chapter',desc:'Chapters',pathParam:true,fields:[{n:'id',l:'id (UUID)',req:true,v:'aec5b7bf-63ca-4ed7-a7da-eea78f227036'}]},
    {id:'dl',path:'/shinigami/download',desc:'Download',pathParam:true,fields:[{n:'id',l:'id (UUID)',req:true,v:'93f5cda7-344a-434b-b9d7-bc29caff34c2'}]},
  ]},
];
const CATS=['Short Drama API','Movie API','Tool API','Anime API','Manga API'];
const CAT_ICONS={'Short Drama API':'🎬','Movie API':'🎥','Tool API':'🛠️','Anime API':'🔴','Manga API':'📖'};
let expandedAll=false,activeCategory='all';

function buildUrl(p,ep){
  const key=p.id+'_'+ep.id;let path=ep.path;
  const params=new URLSearchParams();
  for(const f of ep.fields){
    const el=document.getElementById('f_'+key+'_'+f.n);
    const val=el?el.value.trim():f.v||'';
    if(!val)continue;
    if(ep.pathParam&&f.n==='id')path+='/'+val;
    else params.append(f.n,val);
  }
  const qs=params.toString();
  return PROXY+path+(qs?'?'+qs:'');
}

function refreshUrl(p,ep){
  const key=p.id+'_'+ep.id;
  const url=buildUrl(p,ep);
  const prev=document.getElementById('urlprev_'+key);
  if(!prev)return;
  const qi=url.indexOf('?');
  const pathStr=url.slice(PROXY.length,qi>-1?qi:url.length);
  const qStr=qi>-1?'?'+url.slice(qi+1):'';
  prev.innerHTML='<span class="b">'+PROXY+'</span><span class="p">'+pathStr+'</span><span class="q">'+qStr+'</span>';
}

function highlight(j){
  return j.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,m=>{
      let c='json-num';
      if(/^"/.test(m))c=/:$/.test(m)?'json-key':'json-str';
      else if(/true|false/.test(m))c='json-bool';
      else if(/null/.test(m))c='json-null';
      return '<span class="'+c+'">'+m+'</span>';
    });
}

async function sendReq(pid,eid){
  const p=PROVIDERS.find(x=>x.id===pid);
  const ep=p.endpoints.find(x=>x.id===eid);
  const key=pid+'_'+eid;
  const btn=document.getElementById('send_'+key);
  const respBox=document.getElementById('resp_'+key);
  const rstat=document.getElementById('rstat_'+key);
  const rtime=document.getElementById('rtime_'+key);
  const rpre=document.getElementById('rpre_'+key);
  const url=buildUrl(p,ep);
  btn.classList.add('loading');btn.disabled=true;
  btn.querySelector('.btn-label').textContent='Sending...';
  respBox.classList.add('visible');
  rstat.textContent='LOADING';rstat.style.color='#f59e0b';
  rtime.textContent='';rpre.className='warn-c';
  rpre.innerHTML='// Sending...\\n// '+url;
  const t0=performance.now();
  try{
    const res=await fetch(url);
    const ms=Math.round(performance.now()-t0);
    rtime.textContent=ms+'ms · '+url.replace(PROXY,'');
    const ct=res.headers.get('content-type')||'';
    let data;
    if(ct.includes('json')){try{data=await res.json();}catch{data={error:'Failed to parse JSON'};}}
    else{const txt=await res.text();data={content_type:ct,preview:txt.substring(0,800)};}
    rstat.textContent=res.status+' '+res.statusText;
    if(res.ok){rstat.style.color='#34d399';rpre.className='ok-c';}
    else{rstat.style.color='#f87171';rpre.className='err-c';}
    rpre.innerHTML=highlight(JSON.stringify(data,null,2));
  }catch(err){
    rstat.textContent='NETWORK ERROR';rstat.style.color='#f87171';
    rtime.textContent=Math.round(performance.now()-t0)+'ms';
    rpre.className='err-c';rpre.innerHTML='// Error: '+err.message;
  }finally{
    btn.classList.remove('loading');btn.disabled=false;
    btn.querySelector('.btn-label').textContent='Send Request ⚡';
  }
}

function copyUrl(pid,eid){
  const p=PROVIDERS.find(x=>x.id===pid),ep=p.endpoints.find(x=>x.id===eid);
  navigator.clipboard.writeText(buildUrl(p,ep));
  const btn=document.querySelector('[data-copyurl="'+pid+'_'+eid+'"]');
  if(btn){btn.textContent='Copied!';setTimeout(()=>btn.textContent='Copy URL',1200);}
}
function copyResp(pid,eid){
  const pre=document.getElementById('rpre_'+pid+'_'+eid);
  if(pre){navigator.clipboard.writeText(pre.innerText);
    const btn=document.querySelector('[data-copyresp="'+pid+'_'+eid+'"]');
    if(btn){btn.textContent='Copied!';setTimeout(()=>btn.textContent='Copy',1200);}
  }
}

function renderField(p,ep,f){
  const key=p.id+'_'+ep.id;
  return '<div class="param-row"><div class="param-input-wrap">'
    +'<span class="pname">'+f.l+'</span>'
    +(f.req?'<span class="preq">REQ</span>':'<span class="popt">OPT</span>')
    +'<span class="ptype">'+(f.t||'string')+'</span>'
    +'<input class="param-field" id="f_'+key+'_'+f.n+'" type="'+(f.t||'text')+'" value="'+(f.v||'')+'"'
    +' oninput="refreshUrl(PROVIDERS.find(x=>x.id===\''+p.id+'\'),PROVIDERS.find(x=>x.id===\''+p.id+'\').endpoints.find(x=>x.id===\''+ep.id+'\'))">'
    +'</div></div>';
}

function renderEp(p,ep){
  const key=p.id+'_'+ep.id;
  const pd=ep.pathParam?ep.path+'/{id}':ep.path;
  return '<div class="ep">'
    +'<div class="ep-head"><span class="method">GET</span><span class="ep-path">'+pd+'</span><span class="ep-name">'+ep.desc+'</span></div>'
    +'<div class="ep-params"><div class="params-lbl">Parameters</div>'
    +(ep.fields.length===0?'<div class="no-param">Tidak ada parameter</div>':ep.fields.map(f=>renderField(p,ep,f)).join(''))
    +(ep.pathParam?'<div class="note"><span>⚠</span> id sebagai path param</div>':'')
    +'</div>'
    +'<div class="ep-url"><div class="url-label">Request URL</div>'
    +'<div class="url-preview"><div class="url-text" id="urlprev_'+key+'"><span class="b">'+PROXY+'</span><span class="p">'+ep.path+'</span></div>'
    +'<button class="btn-copy-url" data-copyurl="'+key+'" onclick="copyUrl(\''+p.id+'\',\''+ep.id+'\')">Copy URL</button></div></div>'
    +'<div class="ep-send"><button class="btn-send" id="send_'+key+'" style="background:'+p.color+'" onclick="sendReq(\''+p.id+'\',\''+ep.id+'\')">'
    +'<div class="spinner"></div><span class="btn-label">Send Request ⚡</span></button></div>'
    +'<div class="ep-resp" id="resp_'+key+'">'
    +'<div class="resp-bar"><span class="resp-status" id="rstat_'+key+'">READY</span>'
    +'<span class="resp-time" id="rtime_'+key+'"></span>'
    +'<button class="btn-copy-resp" data-copyresp="'+key+'" onclick="copyResp(\''+p.id+'\',\''+ep.id+'\')">Copy</button></div>'
    +'<div class="resp-body"><pre id="rpre_'+key+'" class="warn-c">// Klik Send Request untuk mengirim...</pre></div>'
    +'</div></div>';
}

function renderProvider(p){
  return '<div class="provider-card" data-cat="'+p.cat+'">'
    +'<div class="prov-header" onclick="toggleProv(\''+p.id+'\')">'
    +'<div class="ph-left"><div><div class="prov-name" style="color:'+p.color+'">'+p.name+'</div>'
    +'<div class="base-path">'+PROXY+p.endpoints[0].path.split('/').slice(0,2).join('/')+'/...</div></div>'
    +'<span class="badge" style="background:'+p.color+'20;color:'+p.color+';border:1px solid '+p.color+'33">'+p.badge+'</span>'
    +'<span class="ep-count">'+p.endpoints.length+' endpoints</span></div>'
    +'<span class="chevron" id="chev_'+p.id+'">▼</span></div>'
    +'<div class="ep-grid" id="grid_'+p.id+'">'+p.endpoints.map(ep=>renderEp(p,ep)).join('')+'</div></div>';
}

function build(){
  let html='';
  CATS.forEach(cat=>{
    const grp=PROVIDERS.filter(p=>p.cat===cat);if(!grp.length)return;
    html+='<div class="cat-section" data-category="'+cat+'">'
      +'<div class="cat-title">'+(CAT_ICONS[cat]||'')+' '+cat+'</div>'
      +grp.map(renderProvider).join('')+'</div>';
  });
  document.getElementById('app').innerHTML=html;
  PROVIDERS.forEach(p=>p.endpoints.forEach(ep=>refreshUrl(p,ep)));
}

function toggleProv(id){
  document.getElementById('grid_'+id).classList.toggle('open');
  document.getElementById('chev_'+id).classList.toggle('open');
}
function toggleAll(){
  expandedAll=!expandedAll;
  document.querySelectorAll('.ep-grid').forEach(g=>g.classList.toggle('open',expandedAll));
  document.querySelectorAll('.chevron').forEach(c=>c.classList.toggle('open',expandedAll));
  document.querySelector('.expand-all').textContent=expandedAll?'▲ Collapse All':'▼ Expand All';
}
function setCategory(cat,btn){
  activeCategory=cat;
  document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');applyFilters();
}
function applyFilters(){
  const q=document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('.cat-section').forEach(sec=>{
    const ok=activeCategory==='all'||sec.dataset.category===activeCategory;
    if(!ok){sec.classList.add('hidden');return;}
    sec.classList.remove('hidden');
    if(!q){sec.querySelectorAll('.provider-card').forEach(c=>c.classList.remove('hidden'));return;}
    sec.querySelectorAll('.provider-card').forEach(card=>card.classList.toggle('hidden',!card.innerText.toLowerCase().includes(q)));
  });
}
async function loadStats(){
  try{
    const res=await fetch(PROXY+'/stats');if(!res.ok)return;
    const s=await res.json();
    if(s.total_hits!==undefined)document.getElementById('stat-hits').textContent=s.total_hits.toLocaleString();
    if(s.unique_visitors!==undefined)document.getElementById('stat-visitors').textContent=s.unique_visitors.toLocaleString();
  }catch{}
}
build();loadStats();
<\/script>
</body>
</html>`;

// ─── Main Fetch Handler ───────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ── Serve HTML Explorer di root ─────────────────────────────────────────
    if (path === "/" || path === "") {
      return new Response(EXPLORER_HTML, {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }

    // ── Health check ────────────────────────────────────────────────────────
    if (path === "/health") {
      return json({ status: "ok", worker: "Sonzai X API Proxy", target: TARGET_BASE, timestamp: new Date().toISOString() });
    }

    // ── Rate limiting ───────────────────────────────────────────────────────
    const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
    if (!checkRate(clientIP)) {
      return json({ error: "Rate limit exceeded. Coba lagi dalam 60 detik." }, 429);
    }

    // ── Validasi path ───────────────────────────────────────────────────────
    const isAllowed = ALLOWED_PREFIXES.some(p => path.startsWith(p));
    if (!isAllowed) {
      return json({ error: "Endpoint tidak ditemukan", path, available: ALLOWED_PREFIXES }, 404);
    }

    // ── Proxy ke upstream ───────────────────────────────────────────────────
    const targetUrl = TARGET_BASE + path + url.search;
    try {
      const t0 = Date.now();
      const upstream = await fetch(new Request(targetUrl, {
        method: request.method,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
          "Referer": TARGET_BASE,
          "Origin": TARGET_BASE,
        },
        body: ["POST","PUT","PATCH"].includes(request.method) ? request.body : undefined,
        redirect: "follow",
      }));
      const elapsed = Date.now() - t0;
      const ct = upstream.headers.get("content-type") || "application/json";
      const body = await upstream.arrayBuffer();
      const headers = new Headers(CORS_HEADERS);
      headers.set("Content-Type", ct);
      headers.set("X-Proxy-By", "api-proxy-falcon.fajarlsmn2k21.workers.dev");
      headers.set("X-Response-Time", `${elapsed}ms`);
      headers.set("Cache-Control", "public, max-age=30");
      return new Response(body, { status: upstream.status, statusText: upstream.statusText, headers });
    } catch (err) {
      return json({ error: "Upstream request gagal", message: err.message, target: targetUrl }, 502);
    }
  }
};

