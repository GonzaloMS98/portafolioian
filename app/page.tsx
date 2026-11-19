import HomePage from '@/components/home-page'
import {fetchSiteContent} from '@/lib/sanity/content'

// Render per request so Sanity edits show without a redeploy and visitors never depend on reaching Sanity from their browser.
export const dynamic = 'force-dynamic'

export default async function Page() {
  return <HomePage initialContent={await fetchSiteContent()} />
}
