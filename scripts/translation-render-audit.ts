import fs from "node:fs"
import path from "node:path"

// Run after docs:build. Inspect real rendered routes, assets and fragment targets.
const dist = path.resolve("docs/.vitepress/dist")
function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(file) : [file]
  })
}
const pages = walk(dist).filter((p) => p.endsWith(".html"))
const ids = new Map(
  pages.map((p) => [
    p,
    new Set([...fs.readFileSync(p, "utf8").matchAll(/\bid="([^"]*)"/g)].map((m) => m[1])),
  ])
)
const failures: { page: string; link: string; reason: string }[] = []
let links = 0
let idPages = 0
for (const file of pages) {
  const rel = path.relative(dist, file)
  const html = fs.readFileSync(file, "utf8")
  if (rel.startsWith("id/")) {
    idPages++
    if (!html.includes('lang="id-ID"'))
      failures.push({ page: rel, link: "", reason: "language" })
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)
    if (!canonical?.[1].startsWith("/id/"))
      failures.push({ page: rel, link: canonical?.[1] || "", reason: "canonical" })
    if (
      !html.includes("Bahasa Indonesia") ||
      !html.includes("CC BY-SA 4.0") ||
      !html.includes("Ryan Yin")
    )
      failures.push({ page: rel, link: "", reason: "language switch or attribution" })
  }
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const href = match[1].replaceAll("&amp;", "&")
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) continue
    links++
    const [pathname, fragment] = href.split("#")
    let target = pathname
      ? path.resolve(
          pathname.startsWith("/") ? dist : path.dirname(file),
          `.${pathname.startsWith("/") ? pathname : `/${pathname}`}`
        )
      : file
    if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      if (fs.existsSync(`${target}.html`)) target += ".html"
      else target = path.join(target, "index.html")
    }
    if (!fs.existsSync(target))
      failures.push({ page: rel, link: href, reason: "missing target" })
    else if (
      fragment &&
      ids.has(target) &&
      !ids.get(target)?.has(decodeURIComponent(fragment))
    )
      failures.push({ page: rel, link: href, reason: "missing fragment" })
  }
}
const expected = walk(path.resolve("docs/en")).filter((file) =>
  file.endsWith(".md")
).length
if (idPages !== expected)
  failures.push({
    page: "id/",
    link: "",
    reason: `expected ${expected} pages, found ${idPages}`,
  })
const sitemap = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8")
if (/https:\/\/nixos-and-flakes\.thiscute\.world\/id(?:\/|<)/.test(sitemap))
  failures.push({
    page: "sitemap.xml",
    link: "",
    reason: "undeclared translation hostname",
  })
console.log(JSON.stringify({ pages: pages.length, idPages, links, failures }, null, 2))
if (failures.length) process.exitCode = 1
