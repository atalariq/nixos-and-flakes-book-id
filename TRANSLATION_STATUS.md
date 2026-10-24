# Status terjemahan Bahasa Indonesia

**SELESAI — 45/45 halaman (100%).** Sumber utama: `docs/en/**/*.md`; padanan
`docs/id/**/*.md` memakai path relatif yang sama. Termasuk seluruh halaman WIP, catatan,
rujukan, tabel bila ada, caption, frontmatter, dan navigasi. EN tetap root, ZH tetap
`/zh/`, dan Indonesia tersedia di `/id/` dengan locale `id-ID`.

Karya asli: **Ryan Yin, NixOS & Flakes Book**. Ini **terjemahan komunitas, bukan versi
resmi atau karya asli**, dengan lisensi **CC BY-SA 4.0** yang sama. Atribusi dan penandaan
terjemahan tersedia pada footer locale. `LICENSE.md` tidak diubah. Keputusan istilah
tercatat dalam [glosarium](TRANSLATION_GLOSSARY.md).

## Bukti QA

- **PASS** inventaris: semua 45 sumber memiliki padanan, tidak ada halaman yang hilang.
- **PASS** audit pasangan: 170 heading; jumlah dan susunan heading, paragraf, butir
  daftar, tabel/sel, gambar Markdown/HTML, kutipan, callout, serta definisi catatan kaki
  sesuai.
- **PASS** semua 141 code fence, termasuk penanda bahasa, penyorotan baris, komentar,
  perintah, dan output, identik dengan sumber. Isi CSS beranda juga identik.
- **PASS** identifier/perintah inline yang berbeda-beda tetap sama; tautan eksternal
  identik. Pengulangan identifier dan urutannya bisa berubah karena susunan kalimat
  Indonesia. Satu kutipan prosa dalam backtick diterjemahkan (lihat deviasi).
- **PASS** semua anchor sumber dipertahankan dan tautan lokal beserta fragmennya valid.
- **PASS** seluruh 48 entri navbar/sidebar valid di `/id/`; semua 44 halaman isi tercakup
  sidebar, ditambah beranda melalui navbar. Label tema, pencarian, prev/next, mode warna,
  dan pemilih bahasa dilokalkan. Komentar Giscus memakai bahasa Indonesia.
- **PASS** `pnpm run docs:build`: produksi berhasil, 136 halaman HTML terbangun.
- **PASS** audit hasil render: 45 halaman ID memiliki `lang="id-ID"`, canonical `/id/`,
  atribusi, dan pemilih bahasa. Sebanyak 10.142 tautan/referensi aset diperiksa pada
  **semua** halaman EN/ZH/ID dan 404, tanpa target atau fragmen rusak.
- **PASS** `pnpm run check`: Prettier dan typos. Pengecualian kamus Inggris hanya berlaku
  bagi prosa ID, konfigurasi locale ID, laporan/glosarium terjemahan, dan satu literal
  kutipan terjemahan di auditor. Pemeriksaan EN/ZH dan kode lainnya tetap aktif.
- **PASS** regresi: `git diff HEAD -- docs/en docs/zh` kosong; rute root dan `/zh/` tetap
  valid dalam audit render. Canonical dan bahasa EN/ZH mempertahankan perilaku sumber.
- **PASS** HTTP preview: `/`, `/zh/`, `/id/`, dan bab Home Manager `/id/` merespons 200.

Angka kebahasaan: **1.600/1.628 kalimat (98,28%) ≤25 kata**; **943/943 paragraf (100%)
≤120 kata**. Metode: token paragraf Markdown termasuk list dan kutipan, tanpa code fence
atau tabel; pemisahan kalimat dengan `Intl.Segmenter("id")`, kata dipisahkan whitespace.
Judul rujukan ikut terhitung bila berbentuk paragraf; metrik ini bukan penilaian makna.

Setiap halaman dibaca berpasangan saat penerjemahan. Pemeriksaan mencakup urutan argumen,
negasi, syarat, peringatan, batas kepastian, humor, opini, serta penggunaan
saya/kita/kamu. Semua paragraf yang terdeteksi identik dalam audit diperiksa: sisanya
hanya nama proyek atau judul rujukan eksternal yang memang dipertahankan. Tidak ada
paragraf penjelasan berbahasa Inggris yang dibiarkan. QA ini dilakukan oleh agen
penerjemah dan auditor otomatis; bukan klaim peninjauan oleh penyunting manusia
independen.

Bukti per halaman, hash SHA-256 sumber/terjemahan, metrik, dan hasil pemeriksaan tersimpan
pada [TRANSLATION_QA.json](TRANSLATION_QA.json). Hash mengikat bukti ke isi berkas yang
diperiksa. Audit otomatis melengkapi pemeriksaan makna, bukan menggantikannya.

## Deviasi yang disengaja

1. Heading diterjemahkan tetapi ID heading Inggris dipertahankan sebagai anchor eksplisit.
   Empat heading bernomor diberi `<!-- prettier-ignore -->` agar Prettier tidak mengubah
   `{#_1-...}` menjadi `{#\_1-...}` dan merusak pembacaan anchor oleh VitePress.
2. Tautan relatif antarbab tetap relatif di pohon `docs/id/`; tautan absolut pada beranda
   dan navigasi memakai `/id/`. URL eksternal dan semua contoh kode tetap sama.
3. Penanda prosa `TODO` menjadi “Belum dikerjakan”; WIP tetap ditandai sebagai pekerjaan
   yang belum selesai. Ini mempertahankan keadaan sumber, bukan menghilangkan halaman.
4. Kutipan dokumentasi berformat backtick dalam bab pemodulan (“A list of modules…”)
   diterjemahkan menjadi “Daftar modul…”. Ini kutipan prosa, bukan kode/perintah.
5. Atribusi terjemahan komunitas ditambahkan melalui footer locale, terpisah dari suara
   penulis. Klaim historis, versi dependensi, dan saran sumber tidak diperbarui.
6. Hostname produksi terjemahan belum ditentukan. Canonical, `og:url`, dan URL JSON-LD ID
   memakai path `/id/` relatif terhadap origin situs. Rute ID dikecualikan dari sitemap
   ber-hostname upstream agar tidak mengklaim deployment ID di domain Ryan Yin. Tidak ada
   domain fork yang dibuat-buat; SEO EN/ZH tetap sama.
7. Instruksi umum AGENTS.md tentang pencerminan EN/ZH tidak diterapkan pada penambahan
   locale ini, sesuai instruksi tugas yang secara eksplisit melarang perubahan EN/ZH.

## Menjalankan ulang validasi dan preview

```sh
nix develop
pnpm install --frozen-lockfile
pnpm run check
pnpm run check:translation
pnpm run docs:build
pnpm run check:translation:rendered
pnpm run docs:dev
# Buka http://localhost:5173/id/
# Atau preview hasil produksi:
pnpm run docs:preview --host 127.0.0.1 --port 4173
# Buka http://127.0.0.1:4173/id/
```

Tidak ada rebuild NixOS, perubahan konfigurasi host, atau deployment yang dilakukan.
`nix develop` menyiapkan dependensi pengembangan dan memasang hook pre-commit sebagaimana
shellHook repo.

## Kegagalan dan pekerjaan tersisa

Tidak ada kegagalan validasi yang tersisa. Tidak ada path EN yang belum diterjemahkan.
Hostname publik belum ditentukan; solusi canonical relatif dan pengecualian sitemap sudah
aktif, sehingga ini bukan penghambat preview atau kelengkapan locale.

## Daftar halaman

Setiap baris **PASS** mencakup terjemahan lengkap, pembacaan berpasangan, audit struktur,
serta pemeriksaan tautan. Detail hitungan dan hash tersedia pada JSON QA.

| Sumber                                                             | Terjemahan                                                         | Status |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------ |
| `docs/en/advanced-topics/index.md`                                 | `docs/id/advanced-topics/index.md`                                 | PASS   |
| `docs/en/best-practices/accelerating-dotfiles-debugging.md`        | `docs/id/best-practices/accelerating-dotfiles-debugging.md`        | PASS   |
| `docs/en/best-practices/debugging.md`                              | `docs/id/best-practices/debugging.md`                              | PASS   |
| `docs/en/best-practices/intro.md`                                  | `docs/id/best-practices/intro.md`                                  | PASS   |
| `docs/en/best-practices/nix-path-and-flake-registry.md`            | `docs/id/best-practices/nix-path-and-flake-registry.md`            | PASS   |
| `docs/en/best-practices/remote-deployment.md`                      | `docs/id/best-practices/remote-deployment.md`                      | PASS   |
| `docs/en/best-practices/run-downloaded-binaries-on-nixos.md`       | `docs/id/best-practices/run-downloaded-binaries-on-nixos.md`       | PASS   |
| `docs/en/best-practices/simplify-nixos-related-commands.md`        | `docs/id/best-practices/simplify-nixos-related-commands.md`        | PASS   |
| `docs/en/development/cross-platform-compilation.md`                | `docs/id/development/cross-platform-compilation.md`                | PASS   |
| `docs/en/development/dev-environments.md`                          | `docs/id/development/dev-environments.md`                          | PASS   |
| `docs/en/development/distributed-building.md`                      | `docs/id/development/distributed-building.md`                      | PASS   |
| `docs/en/development/intro.md`                                     | `docs/id/development/intro.md`                                     | PASS   |
| `docs/en/development/kernel-development.md`                        | `docs/id/development/kernel-development.md`                        | PASS   |
| `docs/en/development/packaging-101.md`                             | `docs/id/development/packaging-101.md`                             | PASS   |
| `docs/en/faq/index.md`                                             | `docs/id/faq/index.md`                                             | PASS   |
| `docs/en/index.md`                                                 | `docs/id/index.md`                                                 | PASS   |
| `docs/en/introduction/advantages-and-disadvantages.md`             | `docs/id/introduction/advantages-and-disadvantages.md`             | PASS   |
| `docs/en/introduction/index.md`                                    | `docs/id/introduction/index.md`                                    | PASS   |
| `docs/en/introduction/installation.md`                             | `docs/id/introduction/installation.md`                             | PASS   |
| `docs/en/nix-store/add-binary-cache-servers.md`                    | `docs/id/nix-store/add-binary-cache-servers.md`                    | PASS   |
| `docs/en/nix-store/host-your-own-binary-cache-server.md`           | `docs/id/nix-store/host-your-own-binary-cache-server.md`           | PASS   |
| `docs/en/nix-store/intro.md`                                       | `docs/id/nix-store/intro.md`                                       | PASS   |
| `docs/en/nixos-with-flakes/downgrade-or-upgrade-packages.md`       | `docs/id/nixos-with-flakes/downgrade-or-upgrade-packages.md`       | PASS   |
| `docs/en/nixos-with-flakes/get-started-with-nixos.md`              | `docs/id/nixos-with-flakes/get-started-with-nixos.md`              | PASS   |
| `docs/en/nixos-with-flakes/introduction-to-flakes.md`              | `docs/id/nixos-with-flakes/introduction-to-flakes.md`              | PASS   |
| `docs/en/nixos-with-flakes/modularize-the-configuration.md`        | `docs/id/nixos-with-flakes/modularize-the-configuration.md`        | PASS   |
| `docs/en/nixos-with-flakes/nixos-flake-and-module-system.md`       | `docs/id/nixos-with-flakes/nixos-flake-and-module-system.md`       | PASS   |
| `docs/en/nixos-with-flakes/nixos-flake-configuration-explained.md` | `docs/id/nixos-with-flakes/nixos-flake-configuration-explained.md` | PASS   |
| `docs/en/nixos-with-flakes/nixos-with-flakes-enabled.md`           | `docs/id/nixos-with-flakes/nixos-with-flakes-enabled.md`           | PASS   |
| `docs/en/nixos-with-flakes/other-useful-tips.md`                   | `docs/id/nixos-with-flakes/other-useful-tips.md`                   | PASS   |
| `docs/en/nixos-with-flakes/start-using-home-manager.md`            | `docs/id/nixos-with-flakes/start-using-home-manager.md`            | PASS   |
| `docs/en/nixos-with-flakes/update-the-system.md`                   | `docs/id/nixos-with-flakes/update-the-system.md`                   | PASS   |
| `docs/en/nixpkgs/callpackage.md`                                   | `docs/id/nixpkgs/callpackage.md`                                   | PASS   |
| `docs/en/nixpkgs/intro.md`                                         | `docs/id/nixpkgs/intro.md`                                         | PASS   |
| `docs/en/nixpkgs/multiple-nixpkgs.md`                              | `docs/id/nixpkgs/multiple-nixpkgs.md`                              | PASS   |
| `docs/en/nixpkgs/overlays.md`                                      | `docs/id/nixpkgs/overlays.md`                                      | PASS   |
| `docs/en/nixpkgs/overriding.md`                                    | `docs/id/nixpkgs/overriding.md`                                    | PASS   |
| `docs/en/other-usage-of-flakes/inputs.md`                          | `docs/id/other-usage-of-flakes/inputs.md`                          | PASS   |
| `docs/en/other-usage-of-flakes/intro.md`                           | `docs/id/other-usage-of-flakes/intro.md`                           | PASS   |
| `docs/en/other-usage-of-flakes/module-system.md`                   | `docs/id/other-usage-of-flakes/module-system.md`                   | PASS   |
| `docs/en/other-usage-of-flakes/outputs.md`                         | `docs/id/other-usage-of-flakes/outputs.md`                         | PASS   |
| `docs/en/other-usage-of-flakes/testing.md`                         | `docs/id/other-usage-of-flakes/testing.md`                         | PASS   |
| `docs/en/other-usage-of-flakes/the-new-cli.md`                     | `docs/id/other-usage-of-flakes/the-new-cli.md`                     | PASS   |
| `docs/en/preface.md`                                               | `docs/id/preface.md`                                               | PASS   |
| `docs/en/the-nix-language/index.md`                                | `docs/id/the-nix-language/index.md`                                | PASS   |

Commit sumber: `5b36e479d21b57e80d248cfca92e30b3b71b570c`.
