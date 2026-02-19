/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "img0.doubanio.com" },
      { protocol: "https", hostname: "img1.doubanio.com" },
      { protocol: "https", hostname: "img2.doubanio.com" },
      { protocol: "https", hostname: "img3.doubanio.com" },
      { protocol: "https", hostname: "img4.doubanio.com" },
      { protocol: "https", hostname: "img5.doubanio.com" },
      { protocol: "https", hostname: "img6.doubanio.com" },
      { protocol: "https", hostname: "img7.doubanio.com" },
      { protocol: "https", hostname: "img8.doubanio.com" },
      { protocol: "https", hostname: "img9.doubanio.com" },
      { protocol: "http", hostname: "img0.doubanio.com" },
      { protocol: "http", hostname: "img1.doubanio.com" },
      { protocol: "http", hostname: "img2.doubanio.com" },
      { protocol: "http", hostname: "img3.doubanio.com" },
      { protocol: "http", hostname: "img4.doubanio.com" },
      { protocol: "http", hostname: "img5.doubanio.com" },
      { protocol: "http", hostname: "img6.doubanio.com" },
      { protocol: "http", hostname: "img7.doubanio.com" },
      { protocol: "http", hostname: "img8.doubanio.com" },
      { protocol: "http", hostname: "img9.doubanio.com" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // 忽略 eslint 检查
  },
  typescript: {
    // 忽略 TypeScript 构建错误
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
