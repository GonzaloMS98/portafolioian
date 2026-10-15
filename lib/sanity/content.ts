import {fallbackContent, type SiteContent} from '@/lib/content'
import {sanityClient} from './client'

const siteContentQuery = `{
  "settings": *[_type == "siteSettings"][0]{
    seoTitle,
    seoDescription,
    brandName,
    brandTag,
    aboutLabel,
    "heroPoster": heroPoster.asset->url,
    "heroDesktopVideo": heroDesktopVideo.asset->url,
    "heroMobileVideo": heroMobileVideo.asset->url,
    heroAriaLabel,
    contactEyebrow,
    contactRole,
    contactName,
    contactEmail,
    instagramHandle,
    instagramUrl,
    copyright,
    availability,
    emailLabel,
    instagramLabel,
    btsLabel,
    viewFilmLabel,
    viewImageLabel
  },
  "sections": *[_type == "workSection"] | order(order asc){
    "id": slug.current,
    label,
    intro,
    "projects": *[_type == "project" && references(^._id)] | order(order asc){
      "id": slug.current,
      title,
      type,
      year,
      "image": coverImage.asset->url,
      "videoUrl": coalesce(videoFile.asset->url, externalVideoUrl),
      "bodyText": pt::text(body),
      "btsImages": btsImages[].asset->url,
      "galleryVideos": galleryVideos[].asset->url
    }
  }
}`

type SanityResult = {
  settings?: Record<string, string | undefined>
  sections?: Array<{
    id?: string
    label?: string
    intro?: string
    projects?: Array<{
      id?: string
      title?: string
      type?: string
      year?: string
      image?: string
      videoUrl?: string
      bodyText?: string
      btsImages?: string[]
      galleryVideos?: string[]
    }>
  }>
}

export async function fetchSiteContent(): Promise<SiteContent> {
  if (!sanityClient) return fallbackContent

  try {
    const result = await sanityClient.fetch<SanityResult>(siteContentQuery)
    const settings = result.settings || {}
    const sections = (result.sections || [])
      .filter((section) => section.id && section.label)
      .map((section) => ({
        id: section.id!,
        label: section.label!,
        intro: section.intro || '',
        projects: (section.projects || [])
          .filter((project) => project.id && project.title && project.image)
          .map((project) => ({
            id: project.id!,
            title: project.title!,
            type: project.type || '',
            year: project.year || '',
            image: project.image!,
            videoUrl: project.videoUrl || '',
            body: project.bodyText?.split(/\n{2,}/).filter(Boolean) || [],
            btsImages: project.btsImages?.filter(Boolean) || [],
            galleryVideos: project.galleryVideos?.filter(Boolean) || [],
          })),
      }))

    return {
      seo: {
        title: settings.seoTitle || fallbackContent.seo.title,
        description: settings.seoDescription || fallbackContent.seo.description,
      },
      brand: {
        name: settings.brandName || fallbackContent.brand.name,
        tag: settings.brandTag || fallbackContent.brand.tag,
        aboutLabel: settings.aboutLabel || fallbackContent.brand.aboutLabel,
      },
      hero: {
        poster: settings.heroPoster || fallbackContent.hero.poster,
        desktopVideo: settings.heroDesktopVideo || fallbackContent.hero.desktopVideo,
        mobileVideo: settings.heroMobileVideo || fallbackContent.hero.mobileVideo,
        ariaLabel: settings.heroAriaLabel || fallbackContent.hero.ariaLabel,
      },
      contact: {
        eyebrow: settings.contactEyebrow || fallbackContent.contact.eyebrow,
        role: settings.contactRole || fallbackContent.contact.role,
        name: settings.contactName || fallbackContent.contact.name,
        email: settings.contactEmail || fallbackContent.contact.email,
        instagramHandle: settings.instagramHandle || fallbackContent.contact.instagramHandle,
        instagramUrl: settings.instagramUrl || fallbackContent.contact.instagramUrl,
        copyright: settings.copyright || fallbackContent.contact.copyright,
        availability: settings.availability || fallbackContent.contact.availability,
      },
      footer: {
        emailLabel: settings.emailLabel || fallbackContent.footer.emailLabel,
        instagramLabel: settings.instagramLabel || fallbackContent.footer.instagramLabel,
        btsLabel: settings.btsLabel || fallbackContent.footer.btsLabel,
        viewFilmLabel: settings.viewFilmLabel || fallbackContent.footer.viewFilmLabel,
        viewImageLabel: settings.viewImageLabel || fallbackContent.footer.viewImageLabel,
      },
      sections: sections.length ? sections : fallbackContent.sections,
    }
  } catch (error) {
    console.error('Sanity content fetch failed; using local fallback.', error)
    return fallbackContent
  }
}
