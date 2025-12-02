const { createServer } = require('https');
const { createServer: createHttpServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;

// Initialize Next.js app
const app = next({ dev });
const handle = app.getRequestHandler();

// SSL certificate paths
const sslKeyPath = process.env.SSL_KEY_PATH || './_wildcard.itedasolutions.local-key.pem';
const sslCertPath = process.env.SSL_CERT_PATH || './_wildcard.itedasolutions.local.pem';

// Check if SSL certificates exist
const hasSSL = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

let httpsOptions = {};
if (hasSSL) {
  try {
    httpsOptions = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath),
    };
    console.log('✅ SSL certificates loaded successfully');
  } catch (error) {
    console.warn('⚠️  SSL certificates found but could not be loaded:', error.message);
    console.log('🔄 Falling back to HTTP server');
  }
}

// Subdomain routing middleware
const handleSubdomain = (req, res, parsedUrl) => {
  const host = req.headers.host;
  
  if (!host) {
    return handle(req, res, parsedUrl);
  }

  // Extract subdomain
  const subdomain = host.split('.')[0];
  
  // Log subdomain for debugging
  if (dev) {
    console.log(`📡 Request to: ${host} (subdomain: ${subdomain})`);
  }

  // Handle API subdomain
  if (subdomain === 'api') {
    // Rewrite path to include /api prefix if not already present
    if (!parsedUrl.pathname.startsWith('/api')) {
      parsedUrl.pathname = `/api${parsedUrl.pathname}`;
    }
  }

  return handle(req, res, parsedUrl);
};

app.prepare().then(() => {
  const requestHandler = async (req, res) => {
    try {
      // Add security headers
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'origin-when-cross-origin');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // CORS headers for API subdomain
      const origin = req.headers.origin;
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      
      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }

      const parsedUrl = parse(req.url, true);
      await handleSubdomain(req, res, parsedUrl);
    } catch (err) {
      console.error('❌ Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  };

  // Create server based on SSL availability
  if (hasSSL && Object.keys(httpsOptions).length > 0) {
    // HTTPS Server
    createServer(httpsOptions, requestHandler).listen(port, (err) => {
      if (err) throw err;
      console.log(`🚀 HTTPS Server ready on https://smartdryers.itedasolutions.local:${port}`);
      console.log(`🔗 API available on https://api.smartdryers.itedasolutions.local:${port}`);
      console.log('📋 Make sure to add these domains to your hosts file:');
      console.log('   127.0.0.1 smartdryers.itedasolutions.local');
      console.log('   127.0.0.1 api.smartdryers.itedasolutions.local');
    });
  } else {
    // HTTP Server (fallback)
    createHttpServer(requestHandler).listen(port, (err) => {
      if (err) throw err;
      console.log(`🚀 HTTP Server ready on http://localhost:${port}`);
      console.log('⚠️  Running without SSL - use HTTPS in production');
      console.log('💡 To enable HTTPS in development, generate SSL certificates with mkcert');
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});
