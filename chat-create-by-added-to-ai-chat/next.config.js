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
};

module.exports = nextConfig;
