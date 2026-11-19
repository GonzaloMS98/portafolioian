'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import {type SiteContent, type WorkSectionContent} from '@/lib/content'
import {fetchSiteContentOrNull} from '@/lib/sanity/content'
import {collectSectionVideos, VerticalFeed, WideProjectList} from '@/components/section-videos'

type LightboxMedia = { kind: 'image'; src: string; alt: string } | { kind: 'video'; src: string; poster: string; alt: string }

export default function HomePage({initialContent}: {initialContent: SiteContent}) {
  const [content, setContent] = useState(initialContent)
  const [view, setView] = useState('home')
  const [lightboxMedia, setLightboxMedia] = useState<LightboxMedia | null>(null)
  const [heroVideoSrc, setHeroVideoSrc] = useState<string | null>(null)
  const [heroPlaybackFailed, setHeroPlaybackFailed] = useState(false)
  const heroVideoRef = useRef<HTMLVideoElement>(null)
  const initialHashRef = useRef<string | null>(null)
  const workViews = content.sections.map((section) => section.id)
  const workSections = Object.fromEntries(content.sections.map((section) => [section.id, section])) as Record<string, WorkSectionContent>

  useEffect(() => {
    let active = true
    // Refresh in the browser; if Sanity is blocked or down, keep the server-rendered content.
    fetchSiteContentOrNull().then((nextContent) => {
      if (active && nextContent) setContent(nextContent)
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
    if (!lightboxMedia) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxMedia(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [lightboxMedia])

  // Deep links: /#<section-id> or /#contact opens that view (used by the project pages' nav).
  useEffect(() => {
    if (initialHashRef.current === null) initialHashRef.current = decodeURIComponent(window.location.hash.slice(1))
    const target = initialHashRef.current
    if (target === 'contact' || content.sections.some((section) => section.id === target)) setView(target)
    const onHashChange = () => {
      const next = decodeURIComponent(window.location.hash.slice(1))
      if (next === 'contact' || content.sections.some((section) => section.id === next)) setView(next)
      else if (!next) setView('home')
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [content])

  useEffect(() => {
    if (initialHashRef.current === null) return
    const url = view === 'home' ? window.location.pathname : `#${view}`
    window.history.replaceState(null, '', url)
  }, [view])

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
          <div className="hero"><div className="hero-media"><video ref={heroVideoRef} className={heroPlaybackFailed ? 'playback-failed' : ''} src={view === 'home' ? heroVideoSrc ?? undefined : undefined} autoPlay muted loop playsInline preload="metadata" poster={content.hero.poster} aria-label={content.hero.ariaLabel} onError={() => setHeroPlaybackFailed(true)} /><div className="media-wash" /><div className="media-grain" /></div></div>
        </section>

        {workViews.map((section) => {
          const data = workSections[section]
          const sectionIndex = workViews.indexOf(section)
          const previousSection = workViews[(sectionIndex - 1 + workViews.length) % workViews.length]
          const nextSection = workViews[(sectionIndex + 1) % workViews.length]
          const sectionMenu = workViews.length > 2 ? [previousSection, section, nextSection] : workViews
          const sectionVideos = collectSectionVideos(data)
          const showFeed = data.verticalFeed && sectionVideos.length > 0
          return (
            <section key={section} className={`view-panel collection-panel ${showFeed ? 'layout-feed' : 'layout-wide'} ${view === section ? 'is-visible' : ''}`} aria-labelledby={`${section}-title`} aria-hidden={view !== section}>
              <nav className="section-switcher" aria-label="Video sections">
                {sectionMenu.map((menuSection) => (
                  <button id={menuSection === section ? `${section}-title` : undefined} className={menuSection === section ? 'is-active' : ''} type="button" onClick={() => openSection(menuSection)} key={menuSection}>{workSections[menuSection].label}</button>
                ))}
              </nav>
              {showFeed ? (
                <VerticalFeed
                  section={data}
                  videos={sectionVideos}
                  active={view === section && !lightboxMedia}
                  onOpenVideo={(video) => setLightboxMedia({kind: 'video', src: video.src, poster: video.poster ?? '', alt: video.project.title})}
                />
              ) : (
                <WideProjectList section={data} active={view === section && !lightboxMedia} />
              )}
            </section>
          )
        })}

        {lightboxMedia && (
          <div className="media-lightbox" role="dialog" aria-modal="true" aria-label={`${lightboxMedia.alt} fullscreen`} onClick={() => setLightboxMedia(null)}>
            <button className="lightbox-close" type="button" aria-label="Close fullscreen media" onClick={() => setLightboxMedia(null)}><X /></button>
            {lightboxMedia.kind === 'image' ? <img src={lightboxMedia.src} alt={lightboxMedia.alt} onClick={(event) => event.stopPropagation()} /> : <video controls autoPlay playsInline poster={lightboxMedia.poster} onClick={(event) => event.stopPropagation()}><source src={lightboxMedia.src} type="video/mp4" /></video>}
          </div>
        )}

        <section className={`view-panel contact-panel ${view === 'contact' ? 'is-visible' : ''}`} aria-labelledby="contact-title" aria-hidden={view !== 'contact'}><div className="contact-topline"><span>{content.contact.eyebrow}</span><span>{content.contact.role}</span></div><div className="contact-content"><h2 id="contact-title">{content.contact.name}</h2>{content.contact.bio ? <p className="contact-bio">{content.contact.bio}</p> : null}<div className="contact-links"><a className="contact-link" href={`mailto:${content.contact.email}`}>{content.contact.email} <ArrowUpRight /></a><a className="contact-link" href={content.contact.instagramUrl} target="_blank" rel="noreferrer">{content.contact.instagramHandle} <ArrowUpRight /></a></div></div><div className="contact-footer"><span>{content.contact.copyright}</span><span>{content.contact.availability}</span></div></section>

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
