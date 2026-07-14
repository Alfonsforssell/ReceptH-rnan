import { serveDir, serveFile } from "jsr:@std/http/file-server";

async function handler(request) {
    let url = new URL(request.url);
    if (url.pathname == "/") {
        return serveFile(request, "public/index.html");
    }
    return serveDir(request, {
        fsRoot: "public",
        urlRoot: "public",
        showIndex: true,
    });
}

Deno.serve({ port: 3000 }, handler);