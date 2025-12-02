# Subdomain Configuration Guide

## Development Environment

### 1. Local Hosts File Configuration

**Windows (Administrator required):**
```
# Edit C:\Windows\System32\drivers\etc\hosts
127.0.0.1 smartdryers.itedasolutions.local
127.0.0.1 api.smartdryers.itedasolutions.local
127.0.0.1 admin.smartdryers.itedasolutions.local
```

**macOS/Linux:**
```bash
# Edit /etc/hosts
sudo nano /etc/hosts

# Add these lines:
127.0.0.1 smartdryers.itedasolutions.local
127.0.0.1 api.smartdryers.itedasolutions.local
127.0.0.1 admin.smartdryers.itedasolutions.local
```

### 2. Next.js Configuration for Subdomains

Create `next.config.js` with subdomain support:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // API subdomain routing
      {
        source: '/api/:path*',
        destination: '/api/:path*',
        has: [
          {
            type: 'host',
            value: 'api.smartdryers.itedasolutions.local',
          },
        ],
      },
      // Admin subdomain routing
      {
        source: '/:path*',
        destination: '/admin/:path*',
        has: [
          {
            type: 'host',
            value: 'admin.smartdryers.itedasolutions.local',
          },
        ],
      },
    ];
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 3. Development SSL with mkcert

Install mkcert for local SSL:

```bash
# Install mkcert
# Windows (using Chocolatey)
choco install mkcert

# macOS
brew install mkcert

# Ubuntu/Debian
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/

# Create local CA
mkcert -install

# Generate certificates
mkcert "*.itedasolutions.local" "itedasolutions.local"
```

### 4. Custom Development Server

Create `server.js` for HTTPS development:

```javascript
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'smartdryers.itedasolutions.local';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('./_wildcard.itedasolutions.local-key.pem'),
  cert: fs.readFileSync('./_wildcard.itedasolutions.local.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on https://${hostname}:${port}`);
  });
});
```

## Production Environment

### 1. DNS Configuration

Configure DNS records with your domain provider:

```
# A Records
smartdryers.itedasolutions.com    A    YOUR_SERVER_IP
api.smartdryers.itedasolutions.com A    YOUR_SERVER_IP
admin.smartdryers.itedasolutions.com A  YOUR_SERVER_IP

# Or CNAME Records (if using CDN)
smartdryers.itedasolutions.com    CNAME  your-app.vercel.app
api.smartdryers.itedasolutions.com CNAME your-api.vercel.app
```

### 2. Nginx Configuration

Create `/etc/nginx/sites-available/smartdryers.itedasolutions.com`:

```nginx
# Main application
server {
    listen 80;
    server_name smartdryers.itedasolutions.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name smartdryers.itedasolutions.com;

    ssl_certificate /etc/letsencrypt/live/smartdryers.itedasolutions.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smartdryers.itedasolutions.com/privkey.pem;
    
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# API subdomain
server {
    listen 80;
    server_name api.smartdryers.itedasolutions.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.smartdryers.itedasolutions.com;

    ssl_certificate /etc/letsencrypt/live/api.smartdryers.itedasolutions.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.smartdryers.itedasolutions.com/privkey.pem;
    
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d smartdryers.itedasolutions.com
sudo certbot --nginx -d api.smartdryers.itedasolutions.com
sudo certbot --nginx -d admin.smartdryers.itedasolutions.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. Environment Variables

Create production environment file:

```env
# Production .env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://smartdryers.itedasolutions.com
NEXT_PUBLIC_API_URL=https://api.smartdryers.itedasolutions.com
DATABASE_URL=postgresql://user:password@localhost:5432/iteda_production
JWT_SECRET=your-super-secure-jwt-secret-here
SSL_CERT_PATH=/etc/letsencrypt/live/smartdryers.itedasolutions.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/smartdryers.itedasolutions.com/privkey.pem
```

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure custom domains in Vercel dashboard:
# - smartdryers.itedasolutions.com
# - api.smartdryers.itedasolutions.com
```

### Option 2: Docker with SSL

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - app
```

### Option 3: PM2 with Nginx

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'iteda-platform',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};

# Deploy
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Security Considerations

### 1. CORS Configuration

```javascript
// In your API routes
const allowedOrigins = [
  'https://smartdryers.itedasolutions.com',
  'https://api.smartdryers.itedasolutions.com',
  'https://admin.smartdryers.itedasolutions.com'
];

export default function handler(req, res) {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // ... rest of your API logic
}
```

### 2. Content Security Policy

```javascript
// In next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.smartdryers.itedasolutions.com;
`;

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  }
];
```

## Testing

### Development Testing
```bash
# Test local HTTPS
curl -k https://smartdryers.itedasolutions.local:3000

# Test API subdomain
curl -k https://api.smartdryers.itedasolutions.local:3000/api/health
```

### Production Testing
```bash
# Test SSL certificate
openssl s_client -connect smartdryers.itedasolutions.com:443

# Test subdomain routing
curl -I https://api.smartdryers.itedasolutions.com
```

## Monitoring

### SSL Certificate Monitoring
```bash
# Check certificate expiry
echo | openssl s_client -servername smartdryers.itedasolutions.com -connect smartdryers.itedasolutions.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Health Checks
```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    subdomain: req.headers.host
  });
}
```
