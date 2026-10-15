export type ProjectContent = {
  id: string
  title: string
  type: string
  year: string
  image: string
  videoUrl: string
  body: string[]
  btsImages: string[]
  galleryVideos: string[]
}

export type WorkSectionContent = {
  id: string
  label: string
  intro: string
  projects: ProjectContent[]
}

export type SiteContent = {
  seo: {
    title: string
    description: string
  }
  brand: {
    name: string
    tag: string
    aboutLabel: string
  }
  hero: {
    poster: string
    desktopVideo: string
    mobileVideo: string
    ariaLabel: string
  }
  contact: {
    eyebrow: string
    role: string
    name: string
    email: string
    instagramHandle: string
    instagramUrl: string
    copyright: string
    availability: string
  }
  footer: {
    emailLabel: string
    instagramLabel: string
    btsLabel: string
    viewFilmLabel: string
    viewImageLabel: string
  }
  sections: WorkSectionContent[]
}

const demoVideo = 'https://cdn.coverr.co/videos/coverr-a-woman-walking-in-a-field-1572/1080p.mp4'
const referenceImage = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-nqv4J8km8ikaUZObsGArNipxCdwU5b.png'

const sectionSeed = [
  {
    id: 'commercial',
    label: 'COMMERCIAL',
    intro: 'Visual stories built to move people and brands forward.',
    projects: [
      ['open-water', 'Open Water', 'Campaign', '2025', 'https://images.unsplash.com/photo-1530053969600-caed2596d242?auto=format&fit=crop&w=1200&q=85'],
      ['new-rituals', 'New Rituals', 'Product film', '2024', 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=85'],
      ['soft-power', 'Soft Power', 'Fashion film', '2024', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85'],
      ['in-motion', 'In Motion', 'Brand film', '2023', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85'],
    ],
  },
  {
    id: 'narrative',
    label: 'NARRATIVE',
    intro: 'Characters, tension, and the quiet moments between the lines.',
    projects: [
      ['field-notes', 'Field Notes', 'Short film', '2025', referenceImage],
      ['after-hours', 'After Hours', 'Music film', '2024', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85'],
      ['low-tide', 'Low Tide', 'Short film', '2024', 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85'],
      ['the-long-way', 'The Long Way', 'Documentary', '2023', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85'],
    ],
  },
  {
    id: 'corporate',
    label: 'CORPORATE',
    intro: 'Human stories for teams with something meaningful to say.',
    projects: [
      ['future-now', 'Future / Now', 'Culture film', '2025', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85'],
      ['common-ground', 'Common Ground', 'Manifesto', '2024', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85'],
      ['built-together', 'Built Together', 'Case study', '2024', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85'],
      ['the-practice', 'The Practice', 'Interview series', '2023', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85'],
    ],
  },
] as const

export const fallbackContent: SiteContent = {
  seo: {
    title: 'Ian Montaño — Videographer & DOP',
    description: 'Cinematic work by Ian Montaño across commercial, narrative, and corporate films.',
  },
  brand: {name: 'Ian Montaño', tag: 'DOP', aboutLabel: 'ABOUT'},
  hero: {
    poster: '/videos/demoreel-hero-poster.webp',
    desktopVideo: '/videos/demoreel-hero-desktop.mp4',
    mobileVideo: '/videos/demoreel-hero-mobile.mp4',
    ariaLabel: 'Ian Montaño demoreel',
  },
  contact: {
    eyebrow: 'ABOUT / CONTACT',
    role: 'VIDEOGRAPHER · DOP',
    name: 'Ian Montaño',
    email: 'iansanchez98@hotmail.com',
    instagramHandle: '@kan_kyo_o',
    instagramUrl: 'https://instagram.com/kan_kyo_o',
    copyright: '© 2026 Ian Montaño',
    availability: 'Available for projects',
  },
  footer: {
    emailLabel: 'E-MAIL',
    instagramLabel: 'INSTAGRAM',
    btsLabel: 'Behind the scenes',
    viewFilmLabel: 'View film',
    viewImageLabel: 'View image',
  },
  sections: sectionSeed.map((section) => {
    const images = section.projects.map((project) => project[4])
    return {
      id: section.id,
      label: section.label,
      intro: section.intro,
      projects: section.projects.map(([id, title, type, year, image]) => ({
        id,
        title,
        type,
        year,
        image,
        videoUrl: demoVideo,
        body: [
          `${title} is a visual story developed through observation, movement, and natural light. The film focuses on honest moments and a restrained cinematic language, allowing each frame to feel immediate and lived-in.`,
          'From early references through the final edit, the project was shaped as one continuous atmosphere. These images document the process behind the film—from location and lighting tests to the details found between takes.',
        ],
        btsImages: [...images],
        galleryVideos: [],
      })),
    }
  }),
}
