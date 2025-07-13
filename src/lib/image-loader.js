export default function imageLoader({ src, width, quality }) {
  // For local development, just return the src without optimization
  if (process.env.NODE_ENV === 'development') {
    return src
  }
  
  // For production, use Next.js default optimization
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`
}