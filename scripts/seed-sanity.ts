import {createReadStream} from 'node:fs'
import {basename, resolve} from 'node:path'
import {getCliClient} from 'sanity/cli'
import {fallbackContent} from '../lib/content'

const client = getCliClient({apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-10-14'})
const assetCache = new Map<string, string>()

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-|-$/g, '')
}

async function existingAsset(filename: string, assetType: 'image' | 'file') {
  const documentType = assetType === 'image' ? 'sanity.imageAsset' : 'sanity.fileAsset'
  return client.fetch<string | null>(`*[_type == $documentType && originalFilename == $filename][0]._id`, {
    documentType,
    filename,
  })
}

async function uploadAsset(source: string, assetType: 'image' | 'file', filename: string) {
  const cached = assetCache.get(source)
  if (cached) return cached

  const found = await existingAsset(filename, assetType)
  if (found) {
    assetCache.set(source, found)
    return found
  }

  let input: Buffer | ReturnType<typeof createReadStream>
  if (source.startsWith('http')) {
    const response = await fetch(source)
    if (!response.ok) throw new Error(`Could not download ${source}: ${response.status}`)
    input = Buffer.from(new Uint8Array(await response.arrayBuffer()))
  } else {
    input = createReadStream(resolve(process.cwd(), 'public', source.replace(/^\//, '')))
  }

  const asset = await client.assets.upload(assetType, input, {filename})
  assetCache.set(source, asset._id)
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

async function seed() {
  console.log('Uploading global media…')
  const heroPoster = await uploadAsset(fallbackContent.hero.poster, 'image', basename(fallbackContent.hero.poster))
  const heroDesktopVideo = await uploadAsset(fallbackContent.hero.desktopVideo, 'file', basename(fallbackContent.hero.desktopVideo))
  const heroMobileVideo = await uploadAsset(fallbackContent.hero.mobileVideo, 'file', basename(fallbackContent.hero.mobileVideo))

  await client.createOrReplace({
    _id: 'siteSettings',
    _type: 'siteSettings',
    brandName: fallbackContent.brand.name,
    brandTag: fallbackContent.brand.tag,
    aboutLabel: fallbackContent.brand.aboutLabel,
    emailLabel: fallbackContent.footer.emailLabel,
    instagramLabel: fallbackContent.footer.instagramLabel,
    btsLabel: fallbackContent.footer.btsLabel,
    viewFilmLabel: fallbackContent.footer.viewFilmLabel,
    viewImageLabel: fallbackContent.footer.viewImageLabel,
    heroPoster: {_type: 'image', asset: {_type: 'reference', _ref: heroPoster}},
    heroDesktopVideo: {_type: 'file', asset: {_type: 'reference', _ref: heroDesktopVideo}},
    heroMobileVideo: {_type: 'file', asset: {_type: 'reference', _ref: heroMobileVideo}},
    heroAriaLabel: fallbackContent.hero.ariaLabel,
    contactEyebrow: fallbackContent.contact.eyebrow,
    contactRole: fallbackContent.contact.role,
    contactName: fallbackContent.contact.name,
    contactEmail: fallbackContent.contact.email,
    instagramHandle: fallbackContent.contact.instagramHandle,
    instagramUrl: fallbackContent.contact.instagramUrl,
    copyright: fallbackContent.contact.copyright,
    availability: fallbackContent.contact.availability,
    seoTitle: fallbackContent.seo.title,
    seoDescription: fallbackContent.seo.description,
  })

  for (const [sectionIndex, section] of fallbackContent.sections.entries()) {
    console.log(`Creating ${section.label}…`)
    const sectionId = `section-${section.id}`
    await client.createOrReplace({
      _id: sectionId,
      _type: 'workSection',
      label: section.label,
      slug: {_type: 'slug', current: section.id},
      intro: section.intro,
      order: sectionIndex,
    })

    for (const [projectIndex, project] of section.projects.entries()) {
      const coverAsset = await uploadAsset(project.image, 'image', `${safeFilename(project.id)}-cover.jpg`)
      const btsAssets = await Promise.all(
        project.btsImages.map((image, imageIndex) =>
          uploadAsset(image, 'image', `${safeFilename(section.id)}-bts-${imageIndex + 1}.jpg`),
        ),
      )

      await client.createOrReplace({
        _id: `project-${project.id}`,
        _type: 'project',
        title: project.title,
        slug: {_type: 'slug', current: project.id},
        section: {_type: 'reference', _ref: sectionId},
        order: projectIndex,
        type: project.type,
        year: project.year,
        body: portableText(project.body, project.id),
        coverImage: {_type: 'image', asset: {_type: 'reference', _ref: coverAsset}},
        externalVideoUrl: project.videoUrl,
        btsImages: btsAssets.map((assetId, imageIndex) => ({
          _type: 'image',
          _key: `${project.id}-bts-${imageIndex}`,
          asset: {_type: 'reference', _ref: assetId},
        })),
      })
    }
  }

  console.log('Sanity content seeded successfully.')
}

seed().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
