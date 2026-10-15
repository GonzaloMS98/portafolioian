import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import {fetchSiteContent} from '@/lib/sanity/content'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const content = await fetchSiteContent()
  return {
    title: content.seo.title,
    description: content.seo.description,
    icons: {
      icon: [
        {url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)'},
        {url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)'},
        {url: '/icon.svg', type: 'image/svg+xml'},
      ],
      apple: '/apple-icon.png',
    },
  }
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
