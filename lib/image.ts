/** Sanity image CDN helpers: request images at the size they are displayed, in WebP/AVIF, instead of the original upload. */
const isSanityImage = (url?: string) => Boolean(url && url.includes('cdn.sanity.io/images/'))

export function imageUrl(url: string, width: number, quality?: number): string
export function imageUrl(url: string | undefined, width: number, quality?: number): string | undefined
export function imageUrl(url: string | undefined, width: number, quality = 75) {
  if (!url || !isSanityImage(url)) return url
  const next = new URL(url)
  next.searchParams.set('w', String(width))
  next.searchParams.set('fit', 'max')
  next.searchParams.set('auto', 'format')
  next.searchParams.set('q', String(quality))
  return next.toString()
}

export function imageSrcSet(url: string | undefined, widths: number[]) {
  if (!url || !isSanityImage(url)) return undefined
  return widths.map((width) => `${imageUrl(url, width)} ${width}w`).join(', ')
}

export const WIDE_WIDTHS = [640, 960, 1280, 1920, 2560]
