'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {ArrowUpRight} from 'lucide-react'
import type {ProjectContent, WorkSectionContent} from '@/lib/content'

export type SectionVideo = {
  key: string
  src: string
  poster?: string
  project: ProjectContent
  index: number
}

export function collectSectionVideos(section: WorkSectionContent): SectionVideo[] {
  return section.projects.flatMap((project) => {
    const sources = [project.videoUrl, ...project.galleryVideos].filter(Boolean)
    return sources.map((src, index) => ({
      key: `${project.id}-${index}-${src}`,
      src,
      poster: index === 0 && project.videoUrl ? project.image : undefined,
      project,
      index,
    }))
  })
}

type AutoVideoProps = {
  src: string
  poster?: string
  active: boolean
  defaultRatio: number
  label: string
  className?: string
  onOpen: () => void
  children?: React.ReactNode
}

/** Muted looping video that plays only while it is on screen and its section is active. Keeps the native aspect ratio (never crops). */
function AutoVideo({src, poster, active, defaultRatio, label, className, onOpen, children}: AutoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ratio, setRatio] = useState(defaultRatio)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.5), {threshold: [0, 0.5, 1]})
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (active && inView) video.play().catch(() => {})
    else video.pause()
  }, [active, inView])

  return (
    <div className={`auto-video-wrap ${className ?? ''}`} style={{'--ratio': ratio} as React.CSSProperties}>
    <button className="auto-video" type="button" onClick={onOpen} aria-label={`Watch ${label} fullscreen`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedMetadata={(event) => {
          const {videoWidth, videoHeight} = event.currentTarget
          if (videoWidth && videoHeight) setRatio(videoWidth / videoHeight)
        }}
      />
    </button>
    {children}
    </div>
  )
}

type LayoutProps = {
  videos: SectionVideo[]
  active: boolean
  onOpenVideo: (video: SectionVideo) => void
}

function videoLabel(video: SectionVideo) {
  return video.index === 0 ? video.project.title : `${video.project.title} ${video.index + 1}`
}

/** Project page: one video after another, as wide as possible without exceeding the viewport height. */
export function WideVideoList({videos, active, onOpenVideo}: LayoutProps) {
  return (
    <div className="wide-list">
      {videos.map((video) => (
        <AutoVideo key={video.key} src={video.src} poster={video.poster} active={active} defaultRatio={16 / 9} label={videoLabel(video)} className="wide-video" onOpen={() => onOpenVideo(video)} />
      ))}
    </div>
  )
}

/** Section wide layout: grouped by project — header per project, then its videos one by one at full width. Clicking opens the project page. */
export function WideProjectList({section, active}: {section: WorkSectionContent; active: boolean}) {
  const router = useRouter()
  return (
    <div className="wide-projects">
      {section.projects.map((project) => {
        const href = `/work/${section.id}/${project.id}`
        const videos = collectSectionVideos({...section, projects: [project]})
        const meta = [project.type, project.year].filter(Boolean).join(' · ')
        return (
          <article className="wide-project" key={project.id}>
            <header className="wide-project-header">
              <Link href={href} className="wide-project-title"><h3>{project.title}</h3></Link>
              {meta && <span className="wide-project-meta">{meta}</span>}
              <Link href={href} className="wide-project-link">View project <ArrowUpRight /></Link>
            </header>
            {videos.length ? (
              <div className="wide-list">
                {videos.map((video) => (
                  <AutoVideo key={video.key} src={video.src} poster={video.poster} active={active} defaultRatio={16 / 9} label={videoLabel(video)} className="wide-video" onOpen={() => router.push(href)} />
                ))}
              </div>
            ) : (
              <Link href={href} className="wide-cover" aria-label={`Open ${project.title} project`}>
                <img src={project.image} alt={`${project.title} project still`} />
              </Link>
            )}
          </article>
        )
      })}
    </div>
  )
}

export function VerticalFeed({section, videos, active, onOpenVideo}: LayoutProps & {section: WorkSectionContent}) {
  const [filter, setFilter] = useState<string>('all')
  const gridRef = useRef<HTMLDivElement>(null)
  const projects = useMemo(() => section.projects.filter((project) => videos.some((video) => video.project.id === project.id)), [section.projects, videos])
  const visible = filter === 'all' ? videos : videos.filter((video) => video.project.id === filter)

  const changeFilter = (next: string) => {
    if (next === filter) return
    setFilter(next)
    const grid = gridRef.current
    const panel = grid?.closest('.collection-panel')
    if (grid && panel && grid.getBoundingClientRect().top < 0) panel.scrollTo({top: grid.offsetTop - 24, behavior: 'smooth'})
  }

  return (
    <div className="feed-wrap">
      <div className="feed-grid" ref={gridRef}>
        {visible.map((video, position) => (
          <div className="feed-item" key={`${filter}-${video.key}`} style={{'--i': Math.min(position, 12)} as React.CSSProperties}>
            <AutoVideo src={video.src} poster={video.poster} active={active} defaultRatio={9 / 16} label={videoLabel(video)} onOpen={() => onOpenVideo(video)} />
          </div>
        ))}
      </div>
      {projects.length > 1 && (
        <nav className="feed-filter" aria-label="Filter by project">
          <div className="feed-filter-track">
            <button type="button" className={filter === 'all' ? 'is-active' : ''} aria-pressed={filter === 'all'} onClick={() => changeFilter('all')}>All</button>
            {projects.map((project) => (
              <button type="button" key={project.id} className={filter === project.id ? 'is-active' : ''} aria-pressed={filter === project.id} onClick={() => changeFilter(project.id)}>{project.title}</button>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
