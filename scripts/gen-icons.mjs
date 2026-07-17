// Generează iconițe în stil "liquid glass" (iOS 26) pornind de la monograma NB.
// Rulează: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const src = join(publicDir, 'logo_ios.png')

const M = 1024          // rezoluția master
const INSET = 120       // margine până la cardul de sticlă
const CARD = M - INSET * 2
const R = 180           // raza colțurilor cardului (squircle)

const themes = {
  light: {
    bg: [
      { o: 0, c: '#e6ccff' },
      { o: 1, c: '#b98cf2' },
    ],
    shadow: '<feFlood flood-color="#3a1d6e" flood-opacity="0.28"/>',
    glowColor: null,
  },
  dark: {
    bg: [
      { o: 0, c: '#2a1a47' },
      { o: 1, c: '#120a22' },
    ],
    shadow: '<feFlood flood-color="#000000" flood-opacity="0.55"/>',
    glowColor: '#a35cf5',
  },
}

function backgroundSvg(t) {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${M}" height="${M}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
          ${t.bg.map(s => `<stop offset="${s.o}" stop-color="${s.c}"/>`).join('')}
        </linearGradient>
        <radialGradient id="glowbg" cx="0.5" cy="0.32" r="0.75">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${M}" height="${M}" fill="url(#bg)"/>
      <rect width="${M}" height="${M}" fill="url(#glowbg)"/>
    </svg>`)
}

function shadowSvg(t) {
  const glow = t.glowColor
    ? `<rect x="${INSET - 6}" y="${INSET + 4}" width="${CARD + 12}" height="${CARD + 12}" rx="${R + 6}"
           fill="${t.glowColor}" filter="url(#soft)" opacity="0.55"/>`
    : ''
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${M}" height="${M}">
      <defs>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="26"/>
        </filter>
      </defs>
      ${glow}
      <rect x="${INSET}" y="${INSET + 12}" width="${CARD}" height="${CARD}" rx="${R}"
            fill="#000000" opacity="0.22" filter="url(#soft)"/>
    </svg>`)
}

function roundMaskSvg() {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${CARD}" height="${CARD}">
      <rect width="${CARD}" height="${CARD}" rx="${R}" fill="#fff"/>
    </svg>`)
}

function overlaySvg() {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${M}" height="${M}">
      <defs>
        <clipPath id="card">
          <rect x="${INSET}" y="${INSET}" width="${CARD}" height="${CARD}" rx="${R}"/>
        </clipPath>
        <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
          <stop offset="0.45" stop-color="#ffffff" stop-opacity="0.10"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <!-- reflexie de sticlă în partea de sus -->
      <g clip-path="url(#card)">
        <ellipse cx="${M / 2}" cy="${INSET - 120}" rx="${CARD * 0.72}" ry="${CARD * 0.55}" fill="url(#sheen)"/>
      </g>
      <!-- margine luminoasă exterioară -->
      <rect x="${INSET}" y="${INSET}" width="${CARD}" height="${CARD}" rx="${R}"
            fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="3.5"/>
      <!-- rim interior subtil -->
      <rect x="${INSET + 5}" y="${INSET + 5}" width="${CARD - 10}" height="${CARD - 10}" rx="${R - 5}"
            fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/>
    </svg>`)
}

async function buildMaster(theme) {
  const t = themes[theme]
  const card = await sharp(src)
    .resize(CARD, CARD, { fit: 'cover' })
    .composite([{ input: roundMaskSvg(), blend: 'dest-in' }])
    .png()
    .toBuffer()

  return sharp(backgroundSvg(t))
    .composite([
      { input: shadowSvg(t) },
      { input: card, top: INSET, left: INSET },
      { input: overlaySvg() },
    ])
    .png()
    .toBuffer()
}

async function emit(masterBuf, size, name) {
  await sharp(masterBuf).resize(size, size).png().toFile(join(publicDir, name))
  console.log('✓', name, `(${size}px)`)
}

const light = await buildMaster('light')
const dark = await buildMaster('dark')

await emit(light, 180, 'apple-touch-icon.png')
await emit(dark, 180, 'apple-touch-icon-dark.png')
await emit(light, 512, 'icon-512.png')
await emit(light, 192, 'icon-192.png')
await emit(light, 32, 'favicon-32.png')
await emit(light, 16, 'favicon-16.png')

console.log('Gata.')
