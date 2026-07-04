export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    var path = url.pathname;
    
    if (path === "/_ping") {
      return new Response(JSON.stringify({ status: "ok", path: path }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response("Not found: " + path, { status: 404 });
  }
};
