/**
 * ⚡ Sonzai X API — Worker + Explorer
 * Deploy: https://api-proxy-falcon.fajarlsmn2k21.workers.dev/
 * - GET /       → HTML API Explorer
 * - GET /health → Status JSON
 * - GET /* → Proxy ke api.sonzaix.indevs.in atau custom render
 */

const TARGET_BASE = "https://api.sonzaix.indevs.in";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const ALLOWED = [
  "/melolo","/meloshort","/goodshort","/dramawave",
  "/reelshort","/freereels","/netshort","/dramabox",
  "/drama","/sosmed","/terabox","/youtube",
  "/anime","/samehada","/shinigami","/stats",
  "/missav",
];

const rateMap = new Map();
function checkRate(ip) {
  const now = Date.now();
  const e = rateMap.get(ip);
  if (!e || now - e.ts > 60000) { rateMap.set(ip, { count: 1, ts: now }); return true; }
  if (e.count >= 60) return false;
  e.count++;
  return true;
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML — ditulis sebagai string biasa
// ─────────────────────────────────────────────────────────────────────────────
function getHTML() {
  return [
    '<!DOCTYPE html>',
    '<html lang="id">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">',
    '<title>Api Explorer</title>',
    '<style>',
    '*{margin:0;padding:0;box-sizing:border-box}',
    'body{font-family:"Segoe UI",system-ui,sans-serif;background:#0a0a0f;color:#e2e8f0;min-height:100vh}',
    'header{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:28px 24px;text-align:center;border-bottom:1px solid #1e1e3a}',
    'header h1{font-size:1.7rem;background:linear-gradient(135deg,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}',
    '.proxy-badge{display:inline-flex;align-items:center;gap:6px;background:#6366f115;border:1px solid #6366f130;border-radius:20px;padding:4px 12px;font-size:.65rem;color:#818cf8;margin-top:8px;font-family:monospace}',
    '.dot{width:6px;height:6px;background:#4ade80;border-radius:50%;animation:pulse 2s infinite}',
    '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}',
    '.sbar{display:flex;gap:15px;flex-wrap:wrap;justify-content:center;padding:12px 24px;background:#0a0a12;border-bottom:1px solid #1e1e2e}',
    '.stat{text-align:center;padding:0 8px}',
    '.sn{font-size:1.3rem;font-weight:700;color:#c084fc;font-family:monospace}',
    '.sl{font-size:.58rem;color:#64748b;text-transform:uppercase;letter-spacing:1px}',
    '.toolbar{padding:12px 20px;background:#0a0a12;position:sticky;top:0;z-index:20;border-bottom:1px solid #1e1e2e;display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
    '.toolbar input{flex:1;min-width:180px;background:#12121a;border:1px solid #1e1e2e;border-radius:7px;padding:7px 12px;color:#e2e8f0;font-size:.78rem;outline:none}',
    '.toolbar input:focus{border-color:#6366f1}',
    '.fbtns{display:flex;gap:5px;flex-wrap:wrap}',
    '.fb{padding:5px 10px;border-radius:6px;border:1px solid #1e1e2e;background:#12121a;color:#94a3b8;font-size:.6rem;font-weight:700;cursor:pointer;transition:all .15s;text-transform:uppercase}',
    '.fb:hover,.fb.on{background:#6366f1;color:#fff;border-color:#6366f1}',
    '.xpand{padding:5px 11px;border-radius:6px;border:1px solid #1e1e2e;background:#12121a;color:#94a3b8;font-size:.6rem;font-weight:700;cursor:pointer;margin-left:auto}',
    '.xpand:hover{background:#1e1e2e;color:#fff}',
    '.wrap{max-width:1100px;margin:0 auto;padding:20px;width:100%;overflow-x:hidden}',
    '.catsec{margin-bottom:32px}',
    '.cattitle{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#475569;margin-bottom:12px;display:flex;align-items:center;gap:10px}',
    '.cattitle::after{content:"";flex:1;height:1px;background:#1e1e2e}',
    '.pcard{background:#12121a;border:1px solid #1e1e2e;border-radius:13px;margin-bottom:12px;overflow:hidden;width:100%}',
    '.ph{padding:13px 18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;transition:background .15s}',
    '.ph:hover{background:#1a1a28}',
    '.phl{display:flex;align-items:center;gap:10px;min-width:0}',
    '.phl>div{min-width:0}',
    '.pname{font-weight:700;font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.bdg{font-size:.55rem;padding:2px 6px;border-radius:4px;font-weight:700;flex-shrink:0}',
    '.epc{font-size:.6rem;color:#64748b;font-family:monospace;flex-shrink:0}',
    '.bpath{font-size:.58rem;color:#374151;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.chev{font-size:.65rem;color:#475569;transition:transform .25s;flex-shrink:0}',
    '.chev.open{transform:rotate(180deg)}',
    '.epgrid{display:none;border-top:1px solid #1e1e2e;padding:12px;gap:10px;grid-template-columns:1fr}',
    '@media(min-width:768px){.epgrid{grid-template-columns:repeat(auto-fill,minmax(320px,1fr))}}',
    '.epgrid.open{display:grid}',
    '.ep{background:#0e0e16;border:1px solid #1a1a28;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;min-width:0}',
    '.eph{display:flex;align-items:center;gap:8px;padding:12px 13px;border-bottom:1px solid #1a1a28;cursor:pointer;user-select:none;transition:background .15s}',
    '.eph:hover{background:#151520}',
    '.echev{font-size:.65rem;color:#475569;transition:transform .25s;margin-left:8px}',
    '.echev.open{transform:rotate(180deg)}',
    '.mth{font-size:.52rem;font-weight:700;padding:2px 6px;border-radius:3px;background:#14532d;color:#4ade80;font-family:monospace;flex-shrink:0}',
    '.epath{font-family:monospace;font-size:.68rem;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}',
    '.ename{margin-left:auto;font-size:.58rem;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.epbody{display:none;flex-direction:column}',
    '.epbody.open{display:flex}',
    '.epparams{padding:10px 13px;border-bottom:1px solid #1a1a28}',
    '.plbl{font-size:.55rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#374151;margin-bottom:7px}',
    '.noparam{font-size:.6rem;color:#374151;font-style:italic}',
    '.prow{display:flex;align-items:center;gap:5px;margin-bottom:5px}',
    '.piw{flex:1;display:flex;align-items:center;gap:4px}',
    '.pn{font-family:monospace;font-size:.62rem;color:#c084fc;min-width:70px}',
    '.req{font-size:.48rem;background:#7f1d1d;color:#fca5a5;padding:1px 4px;border-radius:3px;font-weight:700}',
    '.opt{font-size:.48rem;background:#1e293b;color:#64748b;padding:1px 4px;border-radius:3px;font-weight:700}',
    '.pty{font-size:.5rem;background:#0f172a;color:#38bdf8;padding:1px 4px;border-radius:3px;font-family:monospace;border:1px solid #1e3a5f}',
    '.pfield{flex:1;background:#080810;border:1px solid #1a1a28;border-radius:4px;padding:4px 7px;font-size:.65rem;color:#cbd5e1;font-family:monospace;outline:none;min-width:0}',
    '.pfield:focus{border-color:#6366f1}',
    '.epurl{padding:7px 13px;border-bottom:1px solid #1a1a28;min-width:0}',
    '.ulbl{font-size:.5rem;color:#374151;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}',
    '.uprev{background:#060609;border:1px solid #1a1a28;border-radius:4px;padding:5px 8px;font-family:monospace;font-size:.56rem;display:flex;justify-content:space-between;align-items:flex-start;gap:6px;min-width:0}',
    '.utext{flex:1;line-height:1.5;word-break:break-all;overflow-wrap:anywhere;min-width:0}',
    '.utext .b{color:#6366f1}.utext .p{color:#94a3b8}.utext .q{color:#34d399}',
    '.cpurl{font-size:.5rem;background:#1e1e2e;color:#64748b;border:1px solid #2a2a3a;border-radius:3px;padding:2px 6px;cursor:pointer;white-space:nowrap;flex-shrink:0}',
    '.cpurl:hover{background:#334155;color:#fff}',
    '.epsend{padding:8px 13px}',
    '.sendbtn{width:100%;padding:8px;border:none;border-radius:7px;font-size:.72rem;font-weight:700;color:#fff;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px}',
    '.sendbtn:hover{filter:brightness(1.15)}.sendbtn:active{transform:scale(.98)}.sendbtn:disabled{opacity:.6;cursor:not-allowed}',
    '.spin{display:none;width:12px;height:12px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:sp .6s linear infinite}',
    '.sendbtn.loading .spin{display:block}.sendbtn.loading .slbl{opacity:.7}',
    '@keyframes sp{to{transform:rotate(360deg)}}',
    '.epresp{display:none;border-top:1px solid #1a1a28;flex-direction:column}',
    '.epresp.show{display:flex}',
    '.rbar{display:flex;align-items:center;gap:8px;padding:5px 13px;background:#0a0a12;border-bottom:1px solid #1a1a28}',
    '.rstat{font-size:.58rem;font-weight:700;font-family:monospace}',
    '.rtime{font-size:.55rem;color:#374151;font-family:monospace;margin-left:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:150px}',
    '.cpres{font-size:.5rem;background:#1e1e2e;color:#64748b;border:1px solid #2a2a3a;border-radius:3px;padding:2px 6px;cursor:pointer;flex-shrink:0}',
    '.cpres:hover{background:#334155;color:#fff}',
    '.rbody{padding:10px 13px;max-height:340px;overflow:auto}',
    '.rbody pre{font-size:.6rem;font-family:monospace;white-space:pre-wrap;word-break:break-all;line-height:1.6}',
    '.ok{color:#34d399}.er{color:#f87171}.wn{color:#fbbf24}',
    '.jk{color:#93c5fd}.js{color:#86efac}.jn{color:#fcd34d}.jb{color:#f9a8d4}.jl{color:#94a3b8}',
    '.note{font-size:.58rem;color:#374151;margin-top:5px;padding-top:5px;border-top:1px solid #1a1a28;font-style:italic}',
    '.note em{color:#f59e0b;font-style:normal}',
    '::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e1e2e;border-radius:4px}',
    '.gone{display:none!important}',
    'footer{text-align:center;padding:24px;color:#374151;font-size:.65rem;border-top:1px solid #1e1e2e;margin-top:16px}',
    '</style>',
    '</head>',
    '<body>',
    '<header>',
    '  <h1>&#x26A1; Api Explorer</h1>',
    '  <div class="proxy-badge"><span class="dot"></span>Proxy via Cloudflare Workers</div>',
    '</header>',
    '<div class="sbar">',
    '  <div class="stat"><div class="sn">14</div><div class="sl">Providers</div></div>',
    '  <div class="stat"><div class="sn">65</div><div class="sl">Endpoints</div></div>',
    '</div>',
    '<div class="toolbar">',
    '  <input type="text" id="srch" placeholder="&#x1F50D;  Cari endpoint, path, parameter..." oninput="doFilter()">',
    '  <div class="fbtns">',
    '    <button class="fb on" data-cat="all" onclick="setCat(this)">All</button>',
    '    <button class="fb" data-cat="sd" onclick="setCat(this)">Short Drama</button>',
    '    <button class="fb" data-cat="mv" onclick="setCat(this)">Movie</button>',
    '    <button class="fb" data-cat="tl" onclick="setCat(this)">Tools</button>',
    '    <button class="fb" data-cat="an" onclick="setCat(this)">Anime</button>',
    '    <button class="fb" data-cat="mg" onclick="setCat(this)">Manga</button>',
    '  </div>',
    '  <button class="xpand" onclick="xpandAll()">&#x25BC; Expand All</button>',
    '</div>',
    '<div class="wrap" id="app"></div>',
    '<footer>&#x26A1; Api Explorer &middot; Powered by Cloudflare Workers</footer>',
    '<script>',
    'var BASE=location.origin;',
    'var xAll=false, curCat="all";',
    // ── PROVIDERS DATA ────────────────────────────────────────────────────
    'var PV=[',
    // Short Drama
    '{id:"melolo",nm:"Melolo Short Drama",cl:"#3b82f6",bd:"VIDEO",ct:"sd",ep:[',
    '  {id:"search",path:"/melolo/search",ds:"Search",f:[{n:"q",l:"query",r:1,v:"cinta"},{n:"result",l:"result",t:"number",v:"10"},{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"home",path:"/melolo/home",ds:"Homepage",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"populer",path:"/melolo/populer",ds:"Trending",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"new",path:"/melolo/new",ds:"Latest",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"detail",path:"/melolo/detail",ds:"Detail",pp:1,f:[{n:"id",l:"id",r:1,v:"7604805998028524597"}]},',
    '  {id:"stream",path:"/melolo/stream",ds:"Stream",pp:1,f:[{n:"id",l:"id",r:1,v:"7605082003200805893"}]}',
    ']},',
    '{id:"meloshort",nm:"Meloshort Short Drama",cl:"#ec4899",bd:"VIDEO",ct:"sd",ep:[',
    '  {id:"home",path:"/meloshort/home",ds:"Homepage",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"populer",path:"/meloshort/populer",ds:"Trending",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"new",path:"/meloshort/new",ds:"Latest",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"search",path:"/meloshort/search",ds:"Search",f:[{n:"query",l:"query",r:1,v:"cinta"},{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"detail",path:"/meloshort/detail",ds:"Detail",f:[{n:"dramaId",l:"dramaId",r:1,v:"68fb509fcfb66cb496173efd"}]},',
    '  {id:"stream",path:"/meloshort/stream",ds:"Stream",f:[{n:"dramaId",l:"dramaId",r:1,v:"68fb509fcfb66cb496173efd"},{n:"episodeId",l:"episodeId",r:1,v:"68fb50a1cfb66cb496173efe"}]}',
    ']},',
    '{id:"goodshort",nm:"GoodShort Short Drama",cl:"#10b981",bd:"VIDEO",ct:"sd",ep:[',
    '  {id:"home",path:"/goodshort/home",ds:"Homepage",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"populer",path:"/goodshort/populer",ds:"Trending",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"new",path:"/goodshort/new",ds:"Latest",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"nav",path:"/goodshort/nav",ds:"Categories",f:[]},',
    '  {id:"search",path:"/goodshort/search",ds:"Search",f:[{n:"query",l:"query",r:1,v:"SISTEM"},{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"detail",path:"/goodshort/detail",ds:"Detail",f:[{n:"bookId",l:"bookId",r:1,v:"31001293031"}]},',
    '  {id:"stream",path:"/goodshort/stream",ds:"Chapters",f:[{n:"bookId",l:"bookId",r:1,v:"31001020259"}]}',
    ']},',
    '{id:"dramawave",nm:"DramaWave Short Drama",cl:"#8b5cf6",bd:"VIDEO",ct:"sd",ep:[',
    '  {id:"home",path:"/dramawave/home",ds:"Homepage",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"new",path:"/dramawave/new",ds:"Latest",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"populer",path:"/dramawave/populer",ds:"Trending",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"search",path:"/dramawave/search",ds:"Search",f:[{n:"q",l:"query",r:1,v:"cinta"},{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"detail",path:"/dramawave/detail",ds:"Detail",f:[{n:"id",l:"id",r:1,v:"jYV3ctG1s0"}]},',
    '  {id:"stream",path:"/dramawave/stream",ds:"Stream",f:[{n:"dramaId",l:"dramaId",r:1,v:"jYV3ctG1s0"},{n:"episode",l:"episode",t:"number",r:1,v:"1"}]}',
    ']},',
    '{id:"reelshort",nm:"ReelShort Short Drama",cl:"#f59e0b",bd:"VIDEO",ct:"sd",ep:[',
    '  {id:"home",path:"/reelshort/home",ds:"Homepage",f:[]},',
    '  {id:"populer",path:"/reelshort/populer",ds:"Trending",f:[]},',
    '  {id:"new",path:"/reelshort/new",ds:"Latest",f:[]},',
    '  {id:"search",path:"/reelshort/search",ds:"Search",f:[{n:"query",l:"query",r:1,v:"sistem"},{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"detail",path:"/reelshort/detail",ds:"Detail",f:[{n:"bookId",l:"bookId",r:1,v:"6912a740a243495b7d09ace2"}]},',
    '  {id:"stream",path:"/reelshort/stream",ds:"Stream",f:[{n:"bookId",l:"bookId",r:1,v:"6912a740a243495b7d09ace2"},{n:"chapterId",l:"chapterId",r:1,v:"sfe7zypnx6"}]}',
    ']},',
    '{id:"freereels",nm:"FreeReels Short Drama",cl:"#06b6d4",bd:"VIDEO",ct:"sd",ep:[',
    '  {id:"home",path:"/freereels/home",ds:"Homepage",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"populer",path:"/freereels/populer",ds:"Trending",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"new",path:"/freereels/new",ds:"Latest",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"search",path:"/freereels/search",ds:"Search",f:[{n:"q",l:"query",r:1,v:"love"},{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"detail",path:"/freereels/detail",ds:"Detail",f:[{n:"dramaId",l:"dramaId",r:1,v:"UxhVGruD4D"}]},',
    '  {id:"stream",path:"/freereels/stream",ds:"Stream",f:[{n:"dramaId",l:"dramaId",r:1,v:"UxhVGruD4D"},{n:"episode",l:"episode",t:"number",r:1,v:"1"}]}',
    ']},',
    '{id:"netshort",nm:"NetShort Short Drama",cl:"#f43f5e",bd:"VIDEO",ct:"sd",ep:[',
    '  {id:"home",path:"/netshort/home",ds:"Homepage",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"populer",path:"/netshort/populer",ds:"Trending",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"new",path:"/netshort/new",ds:"Latest",f:[]},',
    '  {id:"search",path:"/netshort/search",ds:"Search",f:[{n:"query",l:"query",r:1,v:"cinta"},{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"detail",path:"/netshort/detail",ds:"Detail",f:[{n:"dramaId",l:"dramaId",r:1,v:"2001954146244636674"}]},',
    '  {id:"stream",path:"/netshort/stream",ds:"Stream (ep)",f:[{n:"dramaId",l:"dramaId",r:1,v:"2001954146244636674"},{n:"episode",l:"episode",t:"number",r:1,v:"1"}]}',
    ']},',
    '{id:"dramabox",nm:"DramaBox Short Drama",cl:"#a855f7",bd:"VIDEO",ct:"sd",ep:[',
    '  {id:"home",path:"/dramabox/home",ds:"Homepage",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"populer",path:"/dramabox/populer",ds:"Trending",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"new",path:"/dramabox/new",ds:"Latest",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"search",path:"/dramabox/search",ds:"Search",f:[{n:"q",l:"query",r:1,v:"cinta"},{n:"result",l:"result",t:"number",v:"10"},{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"detail",path:"/dramabox/detail",ds:"Detail",pp:1,f:[{n:"id",l:"id",r:1,v:"42000001340"}]},',
    '  {id:"stream",path:"/dramabox/stream",ds:"Stream",f:[{n:"dramaId",l:"dramaId",r:1,v:"42000001340"},{n:"episodeIndex",l:"episodeIndex",t:"number",r:1,v:"0"}]}',
    ']},',
    // Movie
    '{id:"drama",nm:"Drama (Drakor)",cl:"#14b8a6",bd:"MOVIE",ct:"mv",ep:[',
    '  {id:"homekorea",path:"/drama/home/korea",ds:"Home Korea",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"homechina",path:"/drama/home/china",ds:"Home China",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"search",path:"/drama/search",ds:"Search",f:[{n:"q",l:"query",r:1,v:"Squid Game"},{n:"limit",l:"limit",t:"number",v:"10"}]},',
    '  {id:"info",path:"/drama/info",ds:"Info",f:[{n:"id",l:"id",r:1,v:"3135"}]},',
    '  {id:"stream",path:"/drama/stream",ds:"Stream",f:[{n:"id",l:"id",r:1,v:"36943"}]}',
    ']},',
    // MissAV
    '{id:"missav",nm:"MissAV API",cl:"#f43f5e",bd:"VIDEO",ct:"mv",ep:[',
    '  {id:"search",path:"/missav/api/v1/search",ds:"Search Video",f:[{n:"query",l:"query",r:1,v:"korea"},{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"detail",path:"/missav/api/v1/detail",ds:"Get Detail",f:[{n:"url",l:"url",r:1,v:""}]}',
    ']},',
    // Tools
    '{id:"sosmed",nm:"Social Media DL",cl:"#ec4899",bd:"TOOL",ct:"tl",ep:[',
    '  {id:"tiktok",path:"/sosmed/tiktok",ds:"TikTok",f:[{n:"url",l:"url",r:1,v:"https://vt.tiktok.com/ZSmbFjNGC/"}]},',
    '  {id:"facebook",path:"/sosmed/facebook",ds:"Facebook",f:[{n:"url",l:"url",r:1,v:"https://www.facebook.com/share/r/19f798L4GQ/"}]},',
    '  {id:"instagram",path:"/sosmed/instagram",ds:"Instagram",f:[{n:"url",l:"url",r:1,v:"https://www.instagram.com/reels/DUAj4SRD_IV"}]}',
    ']},',
    '{id:"terabox",nm:"TeraBox Downloader",cl:"#22d3ee",bd:"TOOL",ct:"tl",ep:[',
    '  {id:"dl",path:"/terabox",ds:"Download",f:[{n:"url",l:"url",r:1,v:"https://1024terabox.com/s/1HcZ4bbKShOS8o69NX7MXFg"},{n:"pwd",l:"pwd",v:""}]}',
    ']},',
    '{id:"youtube",nm:"YouTube Downloader",cl:"#ef4444",bd:"TOOL",ct:"tl",ep:[',
    '  {id:"video",path:"/youtube/video",ds:"Download Video",f:[{n:"url",l:"url",r:1,v:"https://www.youtube.com/watch?v=rcAw6ZQ0jbE"}]},',
    '  {id:"music",path:"/youtube/music",ds:"Download Audio",f:[{n:"url",l:"url",r:1,v:"https://www.youtube.com/watch?v=rcAw6ZQ0jbE"}]}',
    ']},',
    // Anime
    '{id:"anime",nm:"Anime",cl:"#ef4444",bd:"ANIME",ct:"an",ep:[',
    '  {id:"home",path:"/anime/home",ds:"Latest Update",f:[{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"ongoing",path:"/anime/ongoing",ds:"Ongoing",f:[]},',
    '  {id:"jadwal",path:"/anime/jadwal",ds:"Jadwal Rilis",f:[]},',
    '  {id:"animelist",path:"/anime/anime-list",ds:"Anime List",f:[]},',
    '  {id:"search",path:"/anime/search",ds:"Search",f:[{n:"query",l:"query",r:1,v:"tensei"},{n:"page",l:"page",t:"number",v:"1"}]},',
    '  {id:"detail",path:"/anime/detail",ds:"Detail",f:[{n:"series",l:"series",r:1,v:"tensei-akujo-kuro-rekishi-sub-indo"}]},',
    '  {id:"stream",path:"/anime/stream",ds:"Stream",f:[{n:"slug",l:"slug",r:1,v:"al-150566-1"},{n:"series",l:"series",v:"tensei-akujo-kuro-rekishi-sub-indo"},{n:"episode",l:"episode",t:"number",v:"1"}]}',
    ']},',
    '{id:"samehada",nm:"Samehadaku Anime",cl:"#ef4444",bd:"ANIME",ct:"an",ep:[',
    '  {id:"search",path:"/samehada",ds:"Search",f:[{n:"s",l:"search",r:1,v:"tensei"}]},',
    '  {id:"dl",path:"/samehada",ds:"Download",f:[{n:"dl",l:"url slug",r:1,v:"tensei-shitara-dragon-no-tamago-datta-episode-1"}]}',
    ']},',
    // Manga
    '{id:"shinigami",nm:"Shinigami Manga",cl:"#6366f1",bd:"MANGA",ct:"mg",ep:[',
    '  {id:"search",path:"/shinigami/search",ds:"Search",f:[{n:"q",l:"query",r:1,v:"villain"}]},',
    '  {id:"chapter",path:"/shinigami/chapter",ds:"Chapters",pp:1,f:[{n:"id",l:"id (UUID)",r:1,v:"aec5b7bf-63ca-4ed7-a7da-eea78f227036"}]},',
    '  {id:"dl",path:"/shinigami/download",ds:"Download",pp:1,f:[{n:"id",l:"id (UUID)",r:1,v:"93f5cda7-344a-434b-b9d7-bc29caff34c2"}]}',
    ']}',
    '];', // end PV

    // ── HELPERS ───────────────────────────────────────────────────────────
    'var CATS=[',
    '  {id:"sd",lbl:"Short Drama API",ico:"&#x1F3AC;"},',
    '  {id:"mv",lbl:"Movie API",ico:"&#x1F3A5;"},',
    '  {id:"tl",lbl:"Tool API",ico:"&#x1F6E0;&#xFE0F;"},',
    '  {id:"an",lbl:"Anime API",ico:"&#x1F534;"},',
    '  {id:"mg",lbl:"Manga API",ico:"&#x1F4D6;"}',
    '];',

    'function getP(pid){ return PV.find(function(x){return x.id===pid;}); }',
    'function getEp(p,eid){ return p.ep.find(function(x){return x.id===eid;}); }',

    'function buildUrl(pid,eid){',
    '  var p=getP(pid), ep=getEp(p,eid);',
    '  var path=ep.path, params=new URLSearchParams();',
    '  ep.f.forEach(function(f){',
    '    var el=document.getElementById("f_"+pid+"_"+eid+"_"+f.n);',
    '    var val=el?el.value.trim():(f.v||"");',
    '    if(!val)return;',
    '    if(ep.pp&&f.n==="id")path+="/"+val;',
    '    else params.append(f.n,val);',
    '  });',
    '  var qs=params.toString();',
    '  return BASE+path+(qs?"?"+qs:"");',
    '}',

    'function refreshUrl(pid,eid){',
    '  var url=buildUrl(pid,eid);',
    '  var el=document.getElementById("uprev_"+pid+"_"+eid);',
    '  if(!el)return;',
    '  var qi=url.indexOf("?");',
    '  var ps=url.slice(BASE.length,qi>-1?qi:url.length);',
    '  var qs=qi>-1?"?"+url.slice(qi+1):"";',
    '  el.innerHTML=\'<span class="b">\'+BASE+\'</span><span class="p">\'+ps+\'</span><span class="q">\'+qs+"</span>";',
    '}',

    'function hlJson(j){',
    '  return j.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")',
    '   .replace(/("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g,function(m){',
    '     var c="jn";',
    '     if(/^"/.test(m))c=/:$/.test(m)?"jk":"js";',
    '     else if(/true|false/.test(m))c="jb";',
    '     else if(/null/.test(m))c="jl";',
    '     return \'<span class="\'+c+\'">\'+m+"</span>";',
    '   });',
    '}',

    // ── SEND REQUEST ──────────────────────────────────────────────────────
    'function doSend(pid,eid){',
    '  var url=buildUrl(pid,eid);',
    '  var btn=document.getElementById("sb_"+pid+"_"+eid);',
    '  var box=document.getElementById("rb_"+pid+"_"+eid);',
    '  var rst=document.getElementById("rs_"+pid+"_"+eid);',
    '  var rtm=document.getElementById("rt_"+pid+"_"+eid);',
    '  var pre=document.getElementById("rp_"+pid+"_"+eid);',
    '  btn.classList.add("loading"); btn.disabled=true;',
    '  btn.querySelector(".slbl").textContent="Sending...";',
    '  box.classList.add("show");',
    '  rst.textContent="LOADING"; rst.style.color="#f59e0b";',
    '  rtm.textContent=""; pre.className="wn";',
    '  pre.textContent="// Sending to: "+url;',
    '  var t0=performance.now();',
    '  fetch(url).then(function(res){',
    '    var ms=Math.round(performance.now()-t0);',
    '    rtm.textContent=ms+"ms";',
    '    rst.textContent=res.status+" "+res.statusText;',
    '    rst.style.color=res.ok?"#34d399":"#f87171";',
    '    var ct=res.headers.get("content-type")||"";',
    '    if(ct.indexOf("json")>-1){',
    '      res.json().then(function(d){',
    '        pre.className=res.ok?"ok":"er";',
    '        pre.innerHTML=hlJson(JSON.stringify(d,null,2));',
    '      }).catch(function(){',
    '        pre.className="er"; pre.textContent="// Failed to parse JSON";',
    '      });',
    '    } else {',
    '      res.text().then(function(t){',
    '        pre.className=res.ok?"ok":"er";',
    '        pre.innerHTML=hlJson(JSON.stringify({content_type:ct,preview:t.substring(0,600)},null,2));',
    '      });',
    '    }',
    '  }).catch(function(e){',
    '    rst.textContent="NETWORK ERROR"; rst.style.color="#f87171";',
    '    rtm.textContent=Math.round(performance.now()-t0)+"ms";',
    '    pre.className="er"; pre.textContent="// Error: "+e.message;',
    '  }).finally(function(){',
    '    btn.classList.remove("loading"); btn.disabled=false;',
    '    btn.querySelector(".slbl").textContent="Send Request \u26A1";',
    '  });',
    '}',

    // ── COPY ─────────────────────────────────────────────────────────────
    'function doCopyUrl(pid,eid){',
    '  navigator.clipboard.writeText(buildUrl(pid,eid));',
    '  var btn=document.getElementById("cu_"+pid+"_"+eid);',
    '  if(btn){btn.textContent="Copied!";setTimeout(function(){btn.textContent="Copy";},1200);}',
    '}',
    'function doCopyRes(pid,eid){',
    '  var pre=document.getElementById("rp_"+pid+"_"+eid);',
    '  if(!pre)return;',
    '  navigator.clipboard.writeText(pre.innerText);',
    '  var btn=document.getElementById("cr_"+pid+"_"+eid);',
    '  if(btn){btn.textContent="Copied!";setTimeout(function(){btn.textContent="Copy";},1200);}',
    '}',

    // ── RENDER ────────────────────────────────────────────────────────────
    'function renderField(p,ep,f){',
    '  var key=p.id+"_"+ep.id;',
    '  var inputId="f_"+p.id+"_"+ep.id+"_"+f.n;',
    '  var onip="refreshUrl(\\\'"+p.id+"\\\',\\\'"+ep.id+"\\\')";',
    '  return \'<div class="prow"><div class="piw">\'',
    '    +\'<span class="pn">\'+f.l+"</span>"',
    '    +(f.r?\'<span class="req">REQ</span>\':\'<span class="opt">OPT</span>\')',
    '    +\'<span class="pty">\'+( f.t||"string" )+"</span>"',
    '    +\'<input class="pfield" id="\'+inputId+\'" type="\'+( f.t||"text" )+\'" value="\'+( f.v||"" )+\'" oninput="\'+onip+\'"\'',
    '    +"></div></div>";',
    '}',

    'function renderEp(p,ep){',
    '  var k=p.id+"_"+ep.id;',
    '  var pd=ep.pp?ep.path+"/{id}":ep.path;',
    '  var sbColor=\'style="background:\'+p.cl+\'"\';',
    '  var h=\'<div class="ep">\'',
    '    +\'<div class="eph" onclick="togEp(\\\'\' + k + \'\\\')">\'',
    '    +\'<span class="mth">GET</span><span class="epath">\'+pd+\'</span><span class="ename">\'+ep.ds+"</span>"',
    '    +\'<span class="echev" id="ec_\'+k+\'">&#x25BC;</span></div>\'',
    '    +\'<div class="epbody" id="eb_\'+k+\'">\'',
    '    +\'<div class="epparams"><div class="plbl">Parameters</div>\'',
    '    +(ep.f.length===0?\'<div class="noparam">Tidak ada parameter</div>\':ep.f.map(function(f){return renderField(p,ep,f);}).join(""))',
    '    +(ep.pp?\'<div class="note"><em>&#x26A0;</em> id sebagai path param</div>\':"")',
    '    +"</div>"',
    '    +\'<div class="epurl"><div class="ulbl">Request URL</div>\'',
    '    +\'<div class="uprev"><div class="utext" id="uprev_\'+k+\'"><span class="b">\'+BASE+\'</span><span class="p">\'+ep.path+"</span></div>"',
    '    +\'<button class="cpurl" id="cu_\'+k+\'" onclick="doCopyUrl(\\\'\' +p.id+\'\\\',\\\'\' +ep.id+\'\\\')">Copy</button></div></div>\'',
    '    +\'<div class="epsend"><button class="sendbtn" id="sb_\'+k+\'" \'+sbColor+\' onclick="doSend(\\\'\' +p.id+\'\\\',\\\'\' +ep.id+\'\\\')">\'',
    '    +\'<div class="spin"></div><span class="slbl">Send Request \u26A1</span></button></div>\'',
    '    +\'<div class="epresp" id="rb_\'+k+\'">\'',
    '    +\'<div class="rbar"><span class="rstat" id="rs_\'+k+\'">READY</span>\'',
    '    +\'<span class="rtime" id="rt_\'+k+\'"></span>\'',
    '    +\'<button class="cpres" id="cr_\'+k+\'" onclick="doCopyRes(\\\'\' +p.id+\'\\\',\\\'\' +ep.id+\'\\\')">Copy</button></div>\'',
    '    +\'<div class="rbody"><pre id="rp_\'+k+\'" class="wn">// Klik Send Request untuk mengirim...</pre></div>\'',
    '    +"</div></div></div>";',
    '  return h;',
    '}',

    'function renderProv(p){',
    '  var epHTML=p.ep.map(function(ep){return renderEp(p,ep);}).join("");',
    '  var basePath=BASE+p.ep[0].path.split("/").slice(0,2).join("/")+"/...";',
    '  return \'<div class="pcard" data-ct="\'+p.ct+\'">\'',
    '    +\'<div class="ph" onclick="togProv(\\\'\' +p.id+\'\\\')">\'',
    '    +\'<div class="phl"><div>\'',
    '    +\'<div class="pname" style="color:\'+p.cl+\'">\'+p.nm+"</div>"',
    '    +\'<div class="bpath">\'+basePath+"</div>"',
    '    +"</div>"',
    '    +\'<span class="bdg" style="background:\'+p.cl+\'20;color:\'+p.cl+\';border:1px solid \'+p.cl+\'33">\'+p.bd+"</span>"',
    '    +\'<span class="epc">\'+p.ep.length+\' endpoints</span>\'',
    '    +"</div>"',
    '    +\'<span class="chev" id="cv_\'+p.id+\'">&#x25BC;</span>\'',
    '    +"</div>"',
    '    +\'<div class="epgrid" id="eg_\'+p.id+\'">\'+epHTML+"</div>"',
    '    +"</div>";',
    '}',

    'function build(){',
    '  var html="";',
    '  CATS.forEach(function(cat){',
    '    var grp=PV.filter(function(p){return p.ct===cat.id;});',
    '    if(!grp.length)return;',
    '    html+=\'<div class="catsec" data-ct="\'+cat.id+\'">\'',
    '      +\'<div class="cattitle">\'+cat.ico+" "+cat.lbl+"</div>"',
    '      +grp.map(renderProv).join("")',
    '      +"</div>";',
    '  });',
    '  document.getElementById("app").innerHTML=html;',
    '  PV.forEach(function(p){p.ep.forEach(function(ep){refreshUrl(p.id,ep.id);});});',
    '}',

    // ── TOGGLE / FILTER ───────────────────────────────────────────────────
    'function togProv(id){',
    '  document.getElementById("eg_"+id).classList.toggle("open");',
    '  document.getElementById("cv_"+id).classList.toggle("open");',
    '}',
    'function togEp(k){',
    '  var b=document.getElementById("eb_"+k); if(b) b.classList.toggle("open");',
    '  var c=document.getElementById("ec_"+k); if(c) c.classList.toggle("open");',
    '}',
    'function xpandAll(){',
    '  xAll=!xAll;',
    '  document.querySelectorAll(".epgrid, .epbody").forEach(function(g){g.classList.toggle("open",xAll);});',
    '  document.querySelectorAll(".chev, .echev").forEach(function(c){c.classList.toggle("open",xAll);});',
    '  document.querySelector(".xpand").textContent=xAll?"\\u25B2 Collapse All":"\\u25BC Expand All";',
    '}',
    'function setCat(btn){',
    '  curCat=btn.dataset.cat;',
    '  document.querySelectorAll(".fb").forEach(function(b){b.classList.remove("on");});',
    '  btn.classList.add("on");',
    '  doFilter();',
    '}',
    'function doFilter(){',
    '  var q=document.getElementById("srch").value.toLowerCase();',
    '  document.querySelectorAll(".catsec").forEach(function(sec){',
    '    var ok=curCat==="all"||sec.dataset.ct===curCat;',
    '    if(!ok){sec.classList.add("gone");return;}',
    '    sec.classList.remove("gone");',
    '    if(!q){sec.querySelectorAll(".pcard").forEach(function(c){c.classList.remove("gone");});return;}',
    '    sec.querySelectorAll(".pcard").forEach(function(c){c.classList.toggle("gone",c.innerText.toLowerCase().indexOf(q)===-1);});',
    '  });',
    '}',

    'build();',
    '</script>',
    '</body>',
    '</html>',
  ].join('\n');
}

// ─── Main Fetch Handler ───────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Serve Explorer di root
    if (path === "/" || path === "") {
      return new Response(getHTML(), {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    // Health check
    if (path === "/health") {
      return jsonRes({ status: "ok", worker: "Api Explorer", target: TARGET_BASE, ts: new Date().toISOString() });
    }

    // Rate limit
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (!checkRate(ip)) {
      return jsonRes({ error: "Rate limit exceeded. Coba lagi dalam 60 detik." }, 429);
    }

    // Validasi path
    if (!ALLOWED.some(p => path.startsWith(p))) {
      return jsonRes({ error: "Endpoint tidak ditemukan", path, available: ALLOWED }, 404);
    }

    // Proxy ke upstream
    let target = TARGET_BASE + path + url.search;
    
    // Rute Khusus untuk MissAV (Dibelokkan ke server Render buatanmu)
    if (path.startsWith("/missav")) {
  const renderUrl = "https://missav-backend.onrender.com";
  target = renderUrl + path.replace("/missav", "") + url.search;
}

    try {
      const t0 = Date.now();
      const up = await fetch(new Request(target, {
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
      const ct = up.headers.get("content-type") || "application/json";
      const body = await up.arrayBuffer();
      const headers = new Headers(CORS);
      headers.set("Content-Type", ct);
      headers.set("X-Proxy-By", "api-proxy-falcon.fajarlsmn2k21.workers.dev");
      headers.set("X-Response-Time", elapsed + "ms");
      headers.set("Cache-Control", "public, max-age=30");
      return new Response(body, { status: up.status, statusText: up.statusText, headers });
    } catch (err) {
      return jsonRes({ error: "Upstream gagal", message: err.message, target }, 502);
    }
  },
};
