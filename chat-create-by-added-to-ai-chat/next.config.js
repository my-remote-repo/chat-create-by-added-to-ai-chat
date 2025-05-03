/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: [
        'localhost',
        'avatars.githubusercontent.com',
        // Додайте домени для S3 та інших сервісів, які ви плануєте використовувати
        `${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`
      ],
    },
    webpack: (config) => {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
      return config;
    },
  };
  
  module.exports = nextConfig;