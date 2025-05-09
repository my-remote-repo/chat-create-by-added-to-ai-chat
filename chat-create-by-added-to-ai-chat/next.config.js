/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Фіксація для node:crypto і node:* протоколів
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
      };
    }

    // Виключення middleware з цього правила
    if (config.name === 'middleware') {
      return config;
    }

    return config;
  },
  // Налаштування для middleware
  experimental: {
    instrumentationHook: true, // Якщо використовуєте Next.js 13+
  },
  // Додавання правил переадресації для Socket.io
  async rewrites() {
    return [
      {
        source: '/api/socketio/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:3001/socket.io/:path*'
            : '/api/socketio/:path*',
      },
    ];
  },
  // Додавання заголовків для підтримки WebSockets
  async headers() {
    return [
      {
        source: '/api/socketio/:path*',
        headers: [
          { key: 'Connection', value: 'Upgrade' },
          { key: 'Upgrade', value: 'websocket' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
