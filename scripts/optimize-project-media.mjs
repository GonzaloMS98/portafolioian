import {spawn} from 'node:child_process'
import {mkdir, readdir, writeFile} from 'node:fs/promises'
import {dirname, join, relative} from 'node:path'

const sourceRoot = process.argv[2]
const outputRoot = process.argv[3] || join(sourceRoot || '', 'optimized-for-sanity')
const ffmpeg = join(process.cwd(), 'node_modules/ffmpeg-static/ffmpeg')
const ffprobe = join(process.cwd(), 'node_modules/ffprobe-static/bin/linux/x64/ffprobe')

if (!sourceRoot) throw new Error('Usage: node scripts/optimize-project-media.mjs <source-folder> [output-folder]')

async function walk(directory) {
  const entries = await readdir(directory, {withFileTypes: true})
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  }))
  return nested.flat()
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: ['ignore', 'ignore', 'pipe']})
    let stderr = ''
    child.stderr.on('data', (chunk) => {
      stderr += chunk
      const progress = chunk.toString().match(/time=\s*([^\s]+)/)?.[1]
      if (progress) process.stdout.write(`\r  ${progress}   `)
    })
    child.on('error', reject)
    child.on('close', (code) => {
      process.stdout.write('\n')
      code === 0 ? resolve() : reject(new Error(stderr.slice(-3000)))
    })
  })
}

async function probe(path) {
  let stdout = ''
  await new Promise((resolve, reject) => {
    const child = spawn(ffprobe, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height,avg_frame_rate,pix_fmt', '-show_entries', 'format=duration,size', '-of', 'json', path])
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', () => {})
    child.on('error', reject)
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`ffprobe failed for ${path}`)))
  })
  const data = JSON.parse(stdout)
  const stream = data.streams[0]
  const [numerator, denominator] = stream.avg_frame_rate.split('/').map(Number)
  return {
    width: stream.width,
    height: stream.height,
    fps: Math.round((numerator / denominator) * 100) / 100,
    codec: stream.codec_name,
    pixelFormat: stream.pix_fmt,
    duration: Math.round(Number(data.format.duration) * 100) / 100,
    bytes: Number(data.format.size),
  }
}

async function optimize(input, output) {
  await mkdir(dirname(output), {recursive: true})
  await run(ffmpeg, [
    '-hide_banner', '-y', '-i', input,
    '-map', '0:v:0', '-map', '0:a?',
    '-c', 'copy', '-movflags', '+faststart',
    output,
  ])
}

async function poster(video, output, duration) {
  await mkdir(dirname(output), {recursive: true})
  const seek = Math.max(0.5, Math.min(10, duration * 0.2))
  await run(ffmpeg, [
    '-hide_banner', '-y', '-ss', String(seek), '-i', video,
    '-frames:v', '1', '-vf', "scale='min(1600,iw)':-2",
    '-c:v', 'libwebp', '-quality', '82', output,
  ])
}

const files = await walk(sourceRoot)
const videos = files.filter((path) => path.toLowerCase().endsWith('.mp4'))
const images = files.filter((path) => /\.(jpe?g|png|webp)$/i.test(path))
const byPath = (fragment) => videos.find((path) => path.includes(fragment))
const allIn = (fragment) => videos.filter((path) => path.includes(fragment)).sort((a, b) => a.localeCompare(b))
const imagesIn = (fragment) => images.filter((path) => path.includes(fragment)).sort((a, b) => a.localeCompare(b))

const alcinosReels = allIn('/Alcinos/reels/')
const m3Bts = allIn('/M3/BTS y Stills/')
const projects = [
  {
    id: 'las-riberas', section: 'commercial', title: 'Las Riberas', type: 'Commercial film', year: '',
    main: byPath('/Comercial/Las riberas/'), gallery: [], images: [],
  },
  {
    id: 'gemso-90', section: 'corporate', title: 'GEMSO — 90 Years', type: 'Documentary', year: '',
    main: byPath('/Corporate /GEMSO/'), gallery: [], images: [],
  },
  {
    id: 'casc-alerce', section: 'corporate', title: 'CASC / Alerce', type: 'Corporate films', year: '2024',
    main: videos.find((path) => path.includes('/casc y alerce/casc_')), gallery: videos.filter((path) => path.includes('/casc y alerce/alerce_')), images: [],
  },
  {
    id: 'alcinos', section: 'corporate', title: 'Stories Without Limits — Alcinos', type: 'Campaign', year: '',
    main: alcinosReels[0], gallery: alcinosReels.slice(1), images: imagesIn('/Alcinos/Stills y bts/'),
  },
  {
    id: 'm3-traces-of-trust', section: 'corporate', title: 'Traces of Trust — M3', type: 'Anniversary film', year: '2025',
    main: videos.find((path) => path.includes('/M3/') && !path.includes('/BTS y Stills/')), gallery: m3Bts, images: imagesIn('/M3/BTS y Stills/'),
  },
]

for (const project of projects) {
  if (!project.main) throw new Error(`No main video found for ${project.title}`)
}

const jobs = projects.flatMap((project) => [project.main, ...project.gallery].map((input, index) => ({
  project,
  input,
  role: index === 0 ? 'main' : `gallery-${String(index).padStart(2, '0')}`,
  output: join(outputRoot, project.section, project.id, `${project.id}-${index === 0 ? 'main' : `gallery-${String(index).padStart(2, '0')}`}.mp4`),
})))

const report = []
let cursor = 0
async function worker() {
  while (cursor < jobs.length) {
    const job = jobs[cursor++]
    console.log(`[${cursor}/${jobs.length}] ${job.project.title} — ${job.role}`)
    const before = await probe(job.input)
    await optimize(job.input, job.output)
    const after = await probe(job.output)
    report.push({...job, before, after})
  }
}

await mkdir(outputRoot, {recursive: true})
await Promise.all([worker(), worker()])

for (const project of projects) {
  const main = report.find((item) => item.project.id === project.id && item.role === 'main')
  project.poster = join(outputRoot, project.section, project.id, `${project.id}-poster.webp`)
  await poster(main.output, project.poster, main.after.duration)
}

const manifest = {
  generatedAt: new Date().toISOString(),
  sourceRoot,
  outputRoot,
  projects: projects.map((project) => ({
    id: project.id,
    section: project.section,
    title: project.title,
    type: project.type,
    year: project.year,
    poster: project.poster,
    mainVideo: report.find((item) => item.project.id === project.id && item.role === 'main').output,
    galleryVideos: report.filter((item) => item.project.id === project.id && item.role !== 'main').sort((a, b) => a.role.localeCompare(b.role)).map((item) => item.output),
    images: project.images,
  })),
  videos: report.map(({project, input, output, role, before, after}) => ({project: project.id, role, input: relative(sourceRoot, input), output: relative(outputRoot, output), before, after})),
}

await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Finished. Manifest: ${join(outputRoot, 'manifest.json')}`)
