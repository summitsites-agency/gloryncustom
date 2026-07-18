// Fetches the latest Instagram posts via the Behold.so JSON feed, caches their images
// into assets/img/instagram/, and writes assets/data/instagram.json. Run weekly by GitHub
// Actions (see .github/workflows/instagram.yml) or locally with BEHOLD_FEED_URL set.
//
// No Instagram/Meta token is needed — the Behold feed URL is public and safe to expose.
// Caching images into the repo keeps the site fast and self-contained, and means visitor
// traffic never counts against Behold's free monthly view cap — only the weekly fetch does.
//
// This is a plain static site (no build step), so the script is self-contained.

import { writeFile, mkdir, readdir, unlink } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const IMAGE_DIR = join(ROOT, 'assets', 'img', 'instagram')
const DATA_FILE = join(ROOT, 'assets', 'data', 'instagram.json')
const LIMIT = 4

const feedUrl = process.env.BEHOLD_FEED_URL
if (!feedUrl) {
  console.error('BEHOLD_FEED_URL is not set. See docs/instagram-setup.md.')
  process.exit(1)
}

// ---- pure helpers (shape Behold posts into the tiny record the site renders) ----
const SIZE_PREFERENCE = ['large', 'medium', 'full', 'small']

function urlFromSizes(sizes) {
  if (!sizes) return null
  for (const key of SIZE_PREFERENCE) {
    if (sizes[key] && sizes[key].mediaUrl) return sizes[key].mediaUrl
  }
  return null
}

// Best still-image URL for a post; carousels fall back to their first child.
function pickImageUrl(post) {
  const direct = urlFromSizes(post.sizes)
  if (direct) return direct
  const child = Array.isArray(post.children) && post.children[0]
  if (child) return urlFromSizes(child.sizes) || child.mediaUrl || null
  return null
}

// Trim a caption on a word boundary (counts Unicode code points so emoji never split).
function trimCaption(caption, maxLen = 120) {
  if (!caption) return ''
  const clean = caption.trim()
  const chars = [...clean]
  if (chars.length <= maxLen) return clean
  const slice = chars.slice(0, maxLen).join('')
  const lastSpace = slice.lastIndexOf(' ')
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trimEnd() + '…'
}

function transformMedia(post, imagePath) {
  const item = {
    id: post.id,
    type: post.mediaType === 'CAROUSEL_ALBUM' ? 'CAROUSEL' : post.mediaType,
    image: imagePath,
    caption: trimCaption(post.prunedCaption || post.caption),
    permalink: post.permalink,
    timestamp: post.timestamp,
  }
  if (Number.isInteger(post.likeCount)) item.likes = post.likeCount
  if (Number.isInteger(post.commentsCount)) item.comments = post.commentsCount
  return item
}

// ---- fetch + cache ----
async function fetchFeed(url) {
  const res = await fetch(url)
  if (!res.ok) {
    const body = (await res.text()).slice(0, 500)
    throw new Error(`Behold feed fetch failed: HTTP ${res.status} — ${body}`)
  }
  const json = await res.json()
  return Array.isArray(json.posts) ? json.posts : []
}

const EXT_BY_TYPE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

async function downloadImage(imageUrl, id) {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Image download failed: HTTP ${res.status}`)
  const type = (res.headers.get('content-type') || '').split(';')[0].trim()
  const filename = `${id}.${EXT_BY_TYPE[type] || 'jpg'}`
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(join(IMAGE_DIR, filename), buf)
  return filename
}

async function pruneImages(keepFilenames) {
  const existing = await readdir(IMAGE_DIR)
  for (const name of existing) {
    if (name === '.gitkeep') continue
    if (!keepFilenames.has(name)) await unlink(join(IMAGE_DIR, name))
  }
}

async function main() {
  await mkdir(IMAGE_DIR, { recursive: true })

  const posts = await fetchFeed(feedUrl)
  const latest = posts.filter(p => pickImageUrl(p) !== null).slice(0, LIMIT)

  // Guard: never wipe a good feed if the fetch transiently returns no imageable posts.
  if (latest.length === 0) {
    console.log('::warning::Behold feed returned no posts with a usable image; keeping existing feed data.')
    return
  }

  const items = []
  const keep = new Set(['.gitkeep'])
  for (const post of latest) {
    const filename = await downloadImage(pickImageUrl(post), post.id)
    keep.add(filename)
    items.push(transformMedia(post, `assets/img/instagram/${filename}`))
  }

  await pruneImages(keep)
  await writeFile(DATA_FILE, JSON.stringify(items, null, 2) + '\n')
  console.log(`Wrote ${items.length} posts to assets/data/instagram.json`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
