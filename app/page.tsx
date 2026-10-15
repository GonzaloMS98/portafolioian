'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import {fallbackContent, type ProjectContent, type WorkSectionContent} from '@/lib/content'
import {fetchSiteContent} from '@/lib/sanity/content'

type LightboxMedia = { kind: 'image'; src: string; alt: string } | { kind: 'video'; src: string; poster: string; alt: string }

export default function Page() {
  const [content, setContent] = useState(fallbackContent)
  const [view, setView] = useState('home')
  const [selectedProject, setSelectedProject] = useState<{ project: ProjectContent; section: string } | null>(null)
  const [lightboxMedia, setLightboxMedia] = useState<LightboxMedia | null>(null)
  const [heroVideoSrc, setHeroVideoSrc] = useState<string | null>(null)
  const [heroPlaybackFailed, setHeroPlaybackFailed] = useState(false)
  const heroVideoRef = useRef<HTMLVideoElement>(null)
  const workViews = content.sections.map((section) => section.id)
  const workSections = Object.fromEntries(content.sections.map((section) => [section.id, section])) as Record<string, WorkSectionContent>

  useEffect(() => {
    let active = true
    fetchSiteContent().then((nextContent) => {
      if (active) setContent(nextContent)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 700px)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const selectHeroVideo = () => {
      setHeroVideoSrc(motionQuery.matches ? null : mobileQuery.matches ? content.hero.mobileVideo : content.hero.desktopVideo)
    }
    selectHeroVideo()
    mobileQuery.addEventListener('change', selectHeroVideo)
    motionQuery.addEventListener('change', selectHeroVideo)
    return () => {
      mobileQuery.removeEventListener('change', selectHeroVideo)
      motionQuery.removeEventListener('change', selectHeroVideo)
    }
  }, [content.hero.desktopVideo, content.hero.mobileVideo])

  useEffect(() => {
    const video = heroVideoRef.current
    if (!video) return
    if (view !== 'home' || !heroVideoSrc) {
      video.pause()
      return
    }
    setHeroPlaybackFailed(false)
    video.play().catch(() => setHeroPlaybackFailed(true))
  }, [view, heroVideoSrc])

  useEffect(() => {
    if (!selectedProject && !lightboxMedia) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (lightboxMedia) setLightboxMedia(null)
      else setSelectedProject(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [selectedProject, lightboxMedia])

  const openSection = (section: string) => {
    setView(section)
  }

  return (
    <main className="site-shell theme-sage">
      <div className="view-stage">
        <header className={`site-nav ${view !== 'home' && view !== 'contact' ? 'on-light' : ''}`}>
          <div className="brand-mark" onClick={() => setView('home')}>
            <span className="brand-main">{content.brand.name}</span>
            <span className="brand-mark-tag">{content.brand.tag}</span>
          </div>
          <nav aria-label="Main navigation">
            <button className={`nav-link ${view === 'contact' ? 'is-active' : ''}`} type="button" onClick={() => setView('contact')}>{content.brand.aboutLabel}</button>
          </nav>
        </header>

        <section className={`works-menu ${view === 'home' ? 'is-open' : ''}`} aria-label="Video sections" aria-hidden={view !== 'home'}>
          <div className="works-menu-grid">
            {workViews.map((section) => {
              const data = workSections[section]
              return (
                <div className="works-menu-column" key={section}>
                  <button className="works-menu-heading" type="button" onClick={() => openSection(section)}>{data.label}</button>
                </div>
              )
            })}
          </div>
        </section>

        <section className={`view-panel ${view === 'home' ? 'is-visible' : ''}`} aria-hidden={view !== 'home'}>
          <div className="hero"><div className="hero-media"><img className="hero-poster" src={content.hero.poster} alt="" /><video ref={heroVideoRef} className={heroPlaybackFailed ? 'playback-failed' : ''} src={view === 'home' ? heroVideoSrc ?? undefined : undefined} autoPlay muted loop playsInline preload="metadata" poster={content.hero.poster} aria-label={content.hero.ariaLabel} onError={() => setHeroPlaybackFailed(true)} /><div className="media-wash" /><div className="media-grain" /></div></div>
        </section>

        {workViews.map((section) => {
          const data = workSections[section]
          const sectionIndex = workViews.indexOf(section)
          const previousSection = workViews[(sectionIndex - 1 + workViews.length) % workViews.length]
          const nextSection = workViews[(sectionIndex + 1) % workViews.length]
          const sectionMenu = workViews.length > 2 ? [previousSection, section, nextSection] : workViews
          return (
            <section key={section} className={`view-panel collection-panel ${view === section ? 'is-visible' : ''}`} aria-labelledby={`${section}-title`} aria-hidden={view !== section}>
              <nav className="section-switcher" aria-label="Video sections">
                {sectionMenu.map((menuSection) => (
                  <button id={menuSection === section ? `${section}-title` : undefined} className={menuSection === section ? 'is-active' : ''} type="button" onClick={() => openSection(menuSection)} key={menuSection}>{workSections[menuSection].label}</button>
                ))}
              </nav>
              <div className="masonry-gallery">
                {data.projects.map((project) => (
                  <button className="masonry-card" type="button" onClick={() => setSelectedProject({ project, section })} key={project.title} aria-label={`Open ${project.title} project`}>
                    <img src={project.image} alt={`${project.title} project still`} />
                    <h3>{project.title}</h3>
                  </button>
                ))}
              </div>
            </section>
          )
        })}

        {selectedProject && (
          <div className="project-modal" role="dialog" aria-modal="true" aria-label={`${selectedProject.project.title} project`} onClick={() => setSelectedProject(null)}>
            <article className="project-story" onClick={(event) => event.stopPropagation()}>
              <button className="project-close" type="button" aria-label="Close project" onClick={() => setSelectedProject(null)}><X /></button>
              {selectedProject.project.videoUrl ? <button className="project-film" type="button" onClick={() => setLightboxMedia({ kind: 'video', src: selectedProject.project.videoUrl, poster: selectedProject.project.image, alt: selectedProject.project.title })} aria-label={`Watch ${selectedProject.project.title} fullscreen`}><video muted loop playsInline autoPlay preload="metadata" poster={selectedProject.project.image}><source src={selectedProject.project.videoUrl} type="video/mp4" /></video><span>{content.footer.viewFilmLabel}</span></button> : <button className="project-film project-cover" type="button" onClick={() => setLightboxMedia({kind: 'image', src: selectedProject.project.image, alt: selectedProject.project.title})} aria-label={`View ${selectedProject.project.title} fullscreen`}><img src={selectedProject.project.image} alt={selectedProject.project.title} /><span>{content.footer.viewImageLabel}</span></button>}
              <div className="project-copy">
                <h2>{selectedProject.project.title}</h2>
                {selectedProject.project.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              <section className="bts-section" aria-label="Behind the scenes">
                <h3>{content.footer.btsLabel}</h3>
                <div className="bts-grid">
                  {(selectedProject.project.btsImages.length ? selectedProject.project.btsImages : [selectedProject.project.image]).map((image, index) => (
                    <button type="button" onClick={() => setLightboxMedia({ kind: 'image', src: image, alt: `${selectedProject.project.title} behind the scenes ${index + 1}` })} key={`${image}-${index}`}>
                      <img src={image} alt={`${selectedProject.project.title} behind the scenes ${index + 1}`} />
                    </button>
                  ))}
                  {selectedProject.project.galleryVideos.map((video, index) => (
                    <button type="button" onClick={() => setLightboxMedia({kind: 'video', src: video, poster: selectedProject.project.image, alt: `${selectedProject.project.title} video ${index + 1}`})} key={`${video}-${index}`}>
                      <video src={video} muted playsInline preload="metadata" aria-label={`${selectedProject.project.title} video ${index + 1}`} />
                    </button>
                  ))}
                </div>
              </section>
            </article>
          </div>
        )}

        {lightboxMedia && (
          <div className="media-lightbox" role="dialog" aria-modal="true" aria-label={`${lightboxMedia.alt} fullscreen`} onClick={() => setLightboxMedia(null)}>
            <button className="lightbox-close" type="button" aria-label="Close fullscreen media" onClick={() => setLightboxMedia(null)}><X /></button>
            {lightboxMedia.kind === 'image' ? <img src={lightboxMedia.src} alt={lightboxMedia.alt} onClick={(event) => event.stopPropagation()} /> : <video controls autoPlay playsInline poster={lightboxMedia.poster} onClick={(event) => event.stopPropagation()}><source src={lightboxMedia.src} type="video/mp4" /></video>}
          </div>
        )}

        <section className={`view-panel contact-panel ${view === 'contact' ? 'is-visible' : ''}`} aria-labelledby="contact-title" aria-hidden={view !== 'contact'}><div className="contact-topline"><span>{content.contact.eyebrow}</span><span>{content.contact.role}</span></div><div className="contact-content"><h2 id="contact-title">{content.contact.name}</h2><div className="contact-links"><a className="contact-link" href={`mailto:${content.contact.email}`}>{content.contact.email} <ArrowUpRight /></a><a className="contact-link" href={content.contact.instagramUrl} target="_blank" rel="noreferrer">{content.contact.instagramHandle} <ArrowUpRight /></a></div></div><div className="contact-footer"><span>{content.contact.copyright}</span><span>{content.contact.availability}</span></div></section>

        <footer className={`corner-footer ${view !== 'home' ? 'is-hidden' : ''}`}>
          <div className="corner-footer-item corner-email">
            <span>{content.footer.emailLabel}</span>
            <a href={`mailto:${content.contact.email}`}>{content.contact.email}</a>
          </div>
          <div className="corner-footer-item corner-instagram">
            <span>{content.footer.instagramLabel}</span>
            <a href={content.contact.instagramUrl} target="_blank" rel="noreferrer">{content.contact.instagramHandle}</a>
          </div>
        </footer>
      </div>
    </main>
  )
}
