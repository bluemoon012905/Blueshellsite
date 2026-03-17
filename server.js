const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const rootDir = __dirname;
const contentPath = path.join(rootDir, "data", "content.json");
const port = process.env.PORT || 4321;
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname === "/api/content" && request.method === "GET") {
    return sendFile(contentPath, response);
  }

  if (requestUrl.pathname === "/api/content" && request.method === "POST") {
    return saveContent(request, response);
  }

  const staticPath = resolvePath(requestUrl.pathname);
  if (!staticPath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (fs.existsSync(staticPath) && fs.statSync(staticPath).isDirectory()) {
    const indexPath = path.join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      return sendFile(indexPath, response);
    }
  }

  if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
    return sendFile(staticPath, response);
  }

  const fallback = path.join(rootDir, "index.html");
  if (fs.existsSync(fallback)) {
    return sendFile(fallback, response);
  }

  response.writeHead(404);
  response.end("Not found");
});

server.listen(port, host, () => {
  console.log(`Blue Shell Almanac running at http://${host}:${port}`);
});

function resolvePath(requestPath) {
  const decodedPath = decodeURIComponent(requestPath === "/" ? "/index.html" : requestPath);
  const fullPath = path.join(rootDir, decodedPath);
  if (!fullPath.startsWith(rootDir)) {
    return null;
  }
  return fullPath;
}

function sendFile(filePath, response) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || "application/octet-stream";
  response.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(response);
}

async function saveContent(request, response) {
  try {
    const rawBody = await readBody(request);
    const parsedBody = JSON.parse(rawBody);
    validateContent(parsedBody);
    fs.writeFileSync(contentPath, `${JSON.stringify(parsedBody, null, 2)}\n`);
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
  } catch (error) {
    response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: false, error: error.message }));
  }
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
    });
    request.on("end", () => resolve(data));
    request.on("error", reject);
  });
}

function validateContent(content) {
  if (!content || typeof content !== "object") {
    throw new Error("Content payload must be an object.");
  }

  if (!content.site || !Array.isArray(content.categories) || !Array.isArray(content.posts)) {
    throw new Error("Content must include site, categories, and posts.");
  }
}
