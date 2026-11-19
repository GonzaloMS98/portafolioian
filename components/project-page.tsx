'use client'

import {useEffect, useState} from 'react'
import Link from 'next/link'
import {useParams} from 'next/navigation'
import {ArrowLeft, ArrowRight, X} from 'lucide-react'
import {slugMatches, slugPath, type SiteContent} from '@/lib/content'
import {fetchSiteContentOrNull} from '@/lib/sanity/content'
import {collectSectionVideos, WideVideoList} from '@/components/section-videos'

type LightboxMedia = {kind: 'image'; src: string; alt: string} | {kind: 'video'; src: string; poster: string; alt: string}

export default function ProjectPage({initialContent}: {initialContent: SiteContent}) {
  const params = useParams<{section: string; project: string}>()
  const [content, setContent] = useState(initialContent)
  const [lightboxMedia, setLightboxMedia] = useState<LightboxMedia | null>(null)

  useEffect(() => {
    let active = true
    fetchSiteContentOrNull().then((nextContent) => {
      if (active && nextContent) setContent(nextContent)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!lightboxMedia) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxMedia(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [lightboxMedia])

  const section = content.sections.find((item) => slugMatches(params.section, item.id))
  const projectIndex = section ? section.projects.findIndex((item) => slugMatches(params.project, item.id)) : -1
  const project = section && projectIndex >= 0 ? section.projects[projectIndex] : undefined

  useEffect(() => {
    if (project) document.title = `${project.title} — ${content.brand.name}`
  }, [project, content.brand.name])

  const header = (
    <header className="site-nav on-light project-nav">
      <Link className="brand-mark" href="/">
        <span className="brand-main">{content.brand.name}</span>
        <span className="brand-mark-tag">{content.brand.tag}</span>
      </Link>
      <nav aria-label="Main navigation">
        {section && <Link className="nav-link nav-back" href={`/#${slugPath(section.id)}`}><ArrowLeft /> {section.label}</Link>}
        <Link className="nav-link" href="/#contact">{content.brand.aboutLabel}</Link>
      </nav>
    </header>
  )

  if (!project || !section) {
    return (
      <main className="project-page">
        {header}
        <div className="project-missing"><p>Project not found.</p><Link href="/">Back home</Link></div>
      </main>
    )
  }

  const videos = collectSectionVideos({...section, projects: [project]})
  const previous = section.projects[(projectIndex - 1 + section.projects.length) % section.projects.length]
  const next = section.projects[(projectIndex + 1) % section.projects.length]
  const meta = [section.label, project.type, project.year].filter(Boolean)

  return (
    <main className="project-page">
      {header}
      <article className="project-article" key={project.id}>
        <div className="project-heading">
          <p className="project-kicker">{meta.join(' · ')}</p>
          <h1>{project.title}</h1>
        </div>

        {videos.length ? (
          <WideVideoList
            videos={videos}
            active={!lightboxMedia}
            onOpenVideo={(video) => setLightboxMedia({kind: 'video', src: video.src, poster: video.poster ?? '', alt: project.title})}
          />
        ) : (
          <button className="project-page-cover" type="button" onClick={() => setLightboxMedia({kind: 'image', src: project.image, alt: project.title})} aria-label={`View ${project.title} fullscreen`}>
            <img src={project.image} alt={project.title} />
          </button>
        )}

        {project.body.length > 0 && (
          <div className="project-copy">
            {project.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        )}

        {project.btsImages.length > 0 && (
          <section className="bts-section" aria-label="Behind the scenes">
            <h3>{content.footer.btsLabel}</h3>
            <div className="bts-grid">
              {project.btsImages.map((image, index) => (
                <button type="button" onClick={() => setLightboxMedia({kind: 'image', src: image, alt: `${project.title} behind the scenes ${index + 1}`})} key={`${image}-${index}`}>
                  <img src={image} alt={`${project.title} behind the scenes ${index + 1}`} />
                </button>
              ))}
            </div>
          </section>
        )}

        {section.projects.length > 1 && (
          <nav className="project-pager" aria-label="More projects">
            <Link href={`/work/${slugPath(section.id)}/${slugPath(previous.id)}`}><ArrowLeft /><span>{previous.title}</span></Link>
            <Link href={`/#${slugPath(section.id)}`} className="project-pager-all">{section.label}</Link>
            <Link href={`/work/${slugPath(section.id)}/${slugPath(next.id)}`}><span>{next.title}</span><ArrowRight /></Link>
          </nav>
        )}
      </article>

      {lightboxMedia && (
        <div className="media-lightbox" role="dialog" aria-modal="true" aria-label={`${lightboxMedia.alt} fullscreen`} onClick={() => setLightboxMedia(null)}>
          <button className="lightbox-close" type="button" aria-label="Close fullscreen media" onClick={() => setLightboxMedia(null)}><X /></button>
          {lightboxMedia.kind === 'image' ? <img src={lightboxMedia.src} alt={lightboxMedia.alt} onClick={(event) => event.stopPropagation()} /> : <video controls autoPlay playsInline poster={lightboxMedia.poster || undefined} onClick={(event) => event.stopPropagation()}><source src={lightboxMedia.src} type="video/mp4" /></video>}
        </div>
      )}
    </main>
  )
}
