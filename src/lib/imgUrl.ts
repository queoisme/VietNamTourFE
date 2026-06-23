// Append Unsplash CDN sizing params so we don't decode multi-MB originals on the main thread.
export function optimizeImg(url?: string | null, w = 800): string | undefined {
  if (!url) return undefined
  if (!url.includes('images.unsplash.com')) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}w=${w}&q=75&auto=format&fit=crop`
}
