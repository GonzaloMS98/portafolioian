'use client'

import {NextStudio} from 'next-sanity/studio'
import config from '@/sanity.config'
import {isSanityConfigured} from '@/lib/sanity/env'

export default function StudioPage() {
  if (!isSanityConfigured) {
    return (
      <main style={{minHeight: '100svh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Arial, sans-serif'}}>
        <div style={{maxWidth: 620}}>
          <h1>Connect Sanity</h1>
          <p>Add <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> and <code>NEXT_PUBLIC_SANITY_DATASET</code> to <code>.env.local</code>, then restart the development server.</p>
        </div>
      </main>
    )
  }

  return <NextStudio config={config} />
}
