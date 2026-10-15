import {createReadStream} from 'node:fs'
import {readFile} from 'node:fs/promises'
import {basename, join} from 'node:path'
import {getCliClient} from 'sanity/cli'

type MediaInfo = {
  sourceRoot: string
  videos: Array<{
    project: string
    role: string
    input: string
  }>
  projects: Array<{
    id: string
    section: string
    title: string
    type: string
    year: string
    poster: string
    mainVideo: string
    galleryVideos: string[]
    images: string[]
  }>
}

const manifestPath = process.argv[2]
if (!manifestPath) throw new Error('Pass the optimized manifest path after --')
const useOriginalVideos = process.argv.includes('--original')

const client = getCliClient({apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-10-14'})

const copy: Record<string, string[]> = {
  'las-riberas': [
    'A residential development presented through its modern infrastructure, long-term vision, and relationship with the surrounding landscape.',
  ],
  'gemso-90': [
    'A documentary created for GEMSO’s 90th anniversary, tracing the people, decisions, and shared history behind its legacy.',
  ],
  'casc-alerce': [
    'Two corporate films developed for CASC and Alerce, shaped around place, growth, and a forward-looking vision.',
  ],
  alcinos: [
    'Stories Without Limits is a campaign for Alcinos Residencial built around the space to imagine, grow, and create a life of your own.',
    'The gallery brings together the campaign reels, production stills, and moments from behind the scenes.',
  ],
  'm3-traces-of-trust': [
    'Traces of Trust was developed for M3’s 40th anniversary. The film centers on the people and relationships that have shaped four decades of work.',
    'The accompanying gallery documents the process behind the film through production stills and BTS clips.',
  ],
}

const legacyProjectIds = [
  'project-open-water', 'project-new-rituals', 'project-soft-power', 'project-in-motion',
  'project-field-notes', 'project-after-hours', 'project-low-tide', 'project-the-long-way',
  'project-future-now', 'project-common-ground', 'project-built-together', 'project-the-practice',
]

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-|-$/g, '')
}

async function upload(path: string, assetType: 'image' | 'file', filename: string) {
  const documentType = assetType === 'image' ? 'sanity.imageAsset' : 'sanity.fileAsset'
  const existing = await client.fetch<string | null>(
    `*[_type == $documentType && originalFilename == $filename][0]._id`,
    {documentType, filename},
  )
  if (existing) return existing
  const asset = await client.assets.upload(assetType, createReadStream(path), {filename})
  return asset._id
}

function portableText(paragraphs: string[], prefix: string) {
  return paragraphs.map((text, index) => ({
    _type: 'block',
    _key: `${prefix}-block-${index}`,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: `${prefix}-span-${index}`, text, marks: []}],
  }))
}

async function main() {
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as MediaInfo

for (const [order, project] of manifest.projects.entries()) {
  console.log(`Uploading ${project.title}${useOriginalVideos ? ' — original files' : ''}…`)
  const sourceVideos = manifest.videos.filter((video) => video.project === project.id)
  const mainVideoPath = useOriginalVideos
    ? join(manifest.sourceRoot, sourceVideos.find((video) => video.role === 'main')!.input)
    : project.mainVideo
  const galleryVideoPaths = useOriginalVideos
    ? sourceVideos
        .filter((video) => video.role !== 'main')
        .sort((a, b) => a.role.localeCompare(b.role))
        .map((video) => join(manifest.sourceRoot, video.input))
    : project.galleryVideos
  const poster = await upload(project.poster, 'image', `${project.id}-poster.webp`)
  const mainVideo = await upload(mainVideoPath, 'file', useOriginalVideos ? `${project.id}-main-original.mp4` : basename(mainVideoPath))
  const galleryVideos = await Promise.all(galleryVideoPaths.map((path, index) => upload(path, 'file', useOriginalVideos ? `${project.id}-gallery-${String(index + 1).padStart(2, '0')}-original.mp4` : basename(path))))
  const btsImages = await Promise.all(project.images.map((path, index) => upload(path, 'image', `${project.id}-bts-${String(index + 1).padStart(2, '0')}-${safeFilename(basename(path))}`)))

  await client.createOrReplace({
    _id: `project-${project.id}`,
    _type: 'project',
    title: project.title,
    slug: {_type: 'slug', current: project.id},
    section: {_type: 'reference', _ref: `section-${project.section}`},
    order,
    type: project.type,
    year: project.year,
    body: portableText(copy[project.id] || [], project.id),
    coverImage: {_type: 'image', asset: {_type: 'reference', _ref: poster}},
    videoFile: {_type: 'file', asset: {_type: 'reference', _ref: mainVideo}},
    btsImages: btsImages.map((assetId, index) => ({
      _type: 'image',
      _key: `${project.id}-image-${index}`,
      asset: {_type: 'reference', _ref: assetId},
    })),
    galleryVideos: galleryVideos.map((assetId, index) => ({
      _type: 'file',
      _key: `${project.id}-video-${index}`,
      asset: {_type: 'reference', _ref: assetId},
    })),
  })
}

const existingLegacyIds = await client.fetch<string[]>(`*[_id in $ids]._id`, {ids: legacyProjectIds})
if (existingLegacyIds.length) {
  let transaction = client.transaction()
  for (const id of existingLegacyIds) transaction = transaction.delete(id)
  await transaction.commit()
  console.log(`Removed ${existingLegacyIds.length} placeholder projects.`)
}

console.log(`Imported ${manifest.projects.length} projects successfully.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
