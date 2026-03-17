export default {
  async fetch(request) {
    const url = new URL(request.url)

    const target = "https://api.sonzaix.indevs.in" + url.pathname + url.search

    try {
      const res = await fetch(target)

      return new Response(res.body, {
        status: res.status,
        headers: {
          "Content-Type": res.headers.get("content-type") || "text/plain",
          "Access-Control-Allow-Origin": "*"
        }
      })

    } catch (err) {
      return new Response(JSON.stringify({
        error: err.message
      }), {
        status: 500
      })
    }
  }
}
