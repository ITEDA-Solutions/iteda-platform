/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['smartdryers.itedasolutions.com', 'api.smartdryers.itedasolutions.com'],
  },
  
  // Subdomain routing configuration
  async rewrites() {
    return [
      // API subdomain routing
      {
        source: '/api/:path*',
        destination: '/api/:path*',
        has: [
          {
            type: 'host',
            value: 'api.smartdryers.itedasolutions.com',
          },
        ],
      },
      {
        source: '/:path*',
        destination: '/api/:path*',
        has: [
          {
            type: 'host',
            value: 'api.smartdryers.itedasolutions.com',
          },
        ],
      },
      // Development API subdomain
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
      {
        source: '/:path*',
        destination: '/api/:path*',
        has: [
          {
            type: 'host',
            value: 'api.smartdryers.itedasolutions.local',
          },
        ],
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    // Exclude server-only packages from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
