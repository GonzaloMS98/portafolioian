import ProjectPage from '@/components/project-page'
import {fetchSiteContent} from '@/lib/sanity/content'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return <ProjectPage initialContent={await fetchSiteContent()} />
}
