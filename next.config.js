/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http', 
        hostname: 'localhost',
        port: '3000'
      }
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Temporarily disable optimization for development
    unoptimized: process.env.NODE_ENV === 'development',
    
    // Add loader for local images
    loader: process.env.NODE_ENV === 'development' ? 'custom' : 'default',
    loaderFile: process.env.NODE_ENV === 'development' ? './src/lib/image-loader.js' : undefined,
  },
  experimental: {
    serverActions: true,
  },
  
  // Add rewrites to handle upload paths
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ]
  },
}

module.exports = nextConfig