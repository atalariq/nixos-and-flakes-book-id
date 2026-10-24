import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { createMarkdownRenderer } from "vitepress"
import { id as locale } from "../docs/.vitepress/config/id"

// Structural evidence complements, and does not replace, a bilingual meaning review.
const root = path.resolve("docs")
const md = await createMarkdownRenderer(root, { lineNumbers: true })
md.use(createRequire(import.meta.url)("markdown-it-footnote"))
function files(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const p = path.join(dir, entry.name)
      return entry.isDirectory() ? files(p) : p.endsWith(".md") ? [p] : []
    })
    .sort()
}
function body(raw: string) {
  return raw.replace(/^---\n[\s\S]*?\n---\n?/, "")
}
function inspect(raw: string) {
  const tokens = md.parse(body(raw), {})
  const all: any[] = []
  function visit(ts: any[]) {
    for (const t of ts) {
      all.push(t)
      if (t.children) visit(t.children)
    }
  }
  visit(tokens)
  const count = (type: string) => all.filter((t) => t.type === type).length
  let tableDepth = 0
  const prose: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === "table_open") tableDepth++
    if (tokens[i].type === "table_close") tableDepth--
    if (!tableDepth && tokens[i].type === "paragraph_open") {
      const next = tokens[i + 1]
      if (next?.type === "inline") {
        const text = (next.children || [])
          .filter((t) => ["text", "code_inline", "softbreak"].includes(t.type))
          .map((t) => (t.type === "softbreak" ? " " : t.content))
          .join("")
          .trim()
        if (text) prose.push(text)
      }
    }
  }
  return {
    prose,
    styles: [...raw.matchAll(/<style[\s\S]*?<\/style>/g)].map((m) => m[0]),
    fences: all.filter((t) => t.type === "fence").map((t) => [t.info, t.content]),
    inlineCode: all.filter((t) => t.type === "code_inline").map((t) => t.content),
    paragraphs: count("paragraph_open"),
    headings: all
      .filter((t) => t.type === "heading_open")
      .map((t) => [t.tag, t.attrGet("id")]),
    listItems: count("list_item_open"),
    tables: count("table_open"),
    tableCells: count("td_open") + count("th_open"),
    images: all.filter((t) => t.type === "image").map((t) => t.attrGet("src")),
    htmlImages: [...raw.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]),
    footnotes: [...raw.matchAll(/^\[\^([^\]]+)\]:/gm)].map((m) => m[1]),
    containers: [...raw.matchAll(/^\s*:::\s*(\w*)/gm)].map((m) => m[1]),
    quotes: count("blockquote_open"),
    links: all
      .filter((t) => t.type === "link_open")
      .map((t) => t.attrGet("href") as string),
  }
}
const rows: any[] = []
const words = (text: string) => text.split(/\s+/).filter(Boolean).length
const sentenceSegmenter = new Intl.Segmenter("id", { granularity: "sentence" })
const proseLengths: number[] = []
const sentenceLengths: number[] = []
for (const source of files(path.join(root, "en"))) {
  const relative = path.relative(path.join(root, "en"), source)
  const target = path.join(root, "id", relative)
  if (!fs.existsSync(target)) {
    rows.push({ path: relative, status: "MISSING" })
    continue
  }
  const en = inspect(fs.readFileSync(source, "utf8"))
  const id = inspect(fs.readFileSync(target, "utf8"))
  for (const text of id.prose) {
    proseLengths.push(words(text))
    for (const sentence of sentenceSegmenter.segment(text))
      sentenceLengths.push(words(sentence.segment))
  }
  const errors: string[] = []
  for (const key of [
    "fences",
    "headings",
    "listItems",
    "tables",
    "tableCells",
    "images",
    "htmlImages",
    "footnotes",
    "containers",
    "quotes",
    "paragraphs",
    "styles",
  ] as const) {
    if (key === "headings") {
      if (
        JSON.stringify(en.headings.map((h) => h[0])) !==
        JSON.stringify(id.headings.map((h) => h[0]))
      )
        errors.push("headingLevels")
      const aliases = [
        ...fs.readFileSync(target, "utf8").matchAll(/<a id="([^"]+)"/g),
      ].map((m) => m[1])
      if (
        en.headings.some(
          (h) => ![...id.headings.map((v) => v[1]), ...aliases].includes(h[1])
        )
      )
        errors.push("headingAnchors")
    } else if (JSON.stringify(en[key]) !== JSON.stringify(id[key])) errors.push(key)
  }
  const external = (links: string[]) =>
    links.filter((s) => /^(https?:|mailto:)/.test(s)).sort()
  if (JSON.stringify(external(en.links)) !== JSON.stringify(external(id.links)))
    errors.push("externalLinks")
  const englishQuote =
    "A list of modules. These are merged together to form the final configuration."
  const translatedQuote =
    "Daftar modul. Modul-modul ini digabungkan untuk membentuk konfigurasi akhir."
  const code = (items: string[]) =>
    items.filter((s) => s !== englishQuote && s !== translatedQuote)
  if (
    JSON.stringify([...new Set(code(en.inlineCode))].sort()) !==
    JSON.stringify([...new Set(code(id.inlineCode))].sort())
  )
    errors.push("inlineCode")
  const broken: string[] = []
  for (const href of id.links) {
    if (/^(https?:|mailto:|tel:)/.test(href)) continue
    if (href.startsWith("#")) {
      const anchor = decodeURIComponent(href.slice(1))
      if (
        !id.headings.some((h) => h[1] === anchor) &&
        !fs.readFileSync(target, "utf8").includes(`id="${anchor}"`)
      )
        broken.push(href)
      continue
    }
    let dest = decodeURIComponent(href.split("#")[0].split("?")[0])
    if (dest.startsWith("/") && !dest.startsWith("/id/")) {
      broken.push(`locale: ${href}`)
      continue
    }
    dest = dest.startsWith("/")
      ? path.join(root, dest)
      : path.resolve(path.dirname(target), dest)
    if (!path.extname(dest))
      dest = fs.existsSync(`${dest}.md`) ? `${dest}.md` : path.join(dest, "index.md")
    if (!fs.existsSync(dest)) broken.push(href)
    else if (href.includes("#") && dest.endsWith(".md")) {
      const anchor = decodeURIComponent(href.split("#")[1])
      const destRaw = fs.readFileSync(dest, "utf8")
      if (
        !inspect(destRaw).headings.some((h) => h[1] === anchor) &&
        !destRaw.includes(`id="${anchor}"`)
      )
        broken.push(href)
    }
  }
  rows.push({
    path: relative,
    sourceSha256: createHash("sha256").update(fs.readFileSync(source)).digest("hex"),
    translationSha256: createHash("sha256").update(fs.readFileSync(target)).digest("hex"),
    status: errors.length ? "FAIL" : "STRUCTURE_PASS",
    errors,
    paragraphs: { en: en.paragraphs, id: id.paragraphs },
    codeFences: en.fences.length,
    headingCount: en.headings.length,
    unchangedProse: id.prose.filter(
      (p) => en.prose.includes(p) && /\b(the|is|are|this|that|with|for|to)\b/i.test(p)
    ),
    inlineDifference: errors.includes("inlineCode")
      ? { en: en.inlineCode, id: id.inlineCode }
      : undefined,
    headingDifference: errors.includes("headingAnchors")
      ? { en: en.headings, id: id.headings }
      : undefined,
    broken,
  })
}
const changedOriginals = execFileSync(
  "git",
  ["diff", "--name-only", "HEAD", "--", "docs/en", "docs/zh"],
  { encoding: "utf8" }
).trim()
const navLinks: string[] = []
function visitNav(items: any[]) {
  for (const item of items) {
    if (item.link) navLinks.push(item.link)
    if (item.items) visitNav(item.items)
  }
}
visitNav(locale.themeConfig?.nav as any[])
visitNav(locale.themeConfig?.sidebar as any[])
const invalidNav = navLinks.filter((href) => {
  const file = path.join(root, href.endsWith("/") ? `${href}index.md` : href)
  return !href.startsWith("/id/") || !fs.existsSync(file)
})
const sidebarMissing = rows
  .filter((r) => r.path !== "index.md" && !navLinks.includes(`/id/${r.path}`))
  .map((r) => r.path)
const summary = {
  total: rows.length,
  translated: rows.filter((r) => r.status !== "MISSING").length,
  structuralFailures: rows.filter((r) => r.status === "FAIL").length,
  missing: rows.filter((r) => r.status === "MISSING").length,
  brokenLinks: rows.reduce((n, r) => n + (r.broken?.length || 0), 0),
  changedOriginals: changedOriginals ? changedOriginals.split("\n") : [],
  navLinks: navLinks.length,
  invalidNav,
  sidebarMissing,
  codeFences: rows.reduce((n, r) => n + (r.codeFences || 0), 0),
  headings: rows.reduce((n, r) => n + (r.headingCount || 0), 0),
  reading: {
    method:
      "Markdown paragraphs including lists and quotations; excludes tables and code fences; Intl.Segmenter id sentences; whitespace-delimited words",
    sentences: sentenceLengths.length,
    sentencesAtMost25Words: sentenceLengths.filter((n) => n <= 25).length,
    shortSentencePercent:
      (100 * sentenceLengths.filter((n) => n <= 25).length) / sentenceLengths.length,
    paragraphs: proseLengths.length,
    paragraphsAtMost120Words: proseLengths.filter((n) => n <= 120).length,
    shortParagraphPercent:
      (100 * proseLengths.filter((n) => n <= 120).length) / proseLengths.length,
  },
}
console.log(JSON.stringify({ summary, pages: rows }, null, 2))
if (
  summary.missing ||
  summary.structuralFailures ||
  summary.brokenLinks ||
  invalidNav.length ||
  sidebarMissing.length ||
  changedOriginals
)
  process.exitCode = 1
