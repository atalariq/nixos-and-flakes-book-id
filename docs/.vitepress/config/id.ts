import { defineConfig } from "vitepress"

export const id = defineConfig({
  lang: "id-ID",
  description: "Buku tidak resmi untuk pemula dengan sudut pandang penulis",

  themeConfig: {
    darkModeSwitchLabel: "Tampilan",
    lightModeSwitchTitle: "Beralih ke mode terang",
    darkModeSwitchTitle: "Beralih ke mode gelap",
    sidebarMenuLabel: "Daftar isi",
    returnToTopLabel: "Kembali ke atas",
    langMenuLabel: "Ganti bahasa",
    skipToContentLabel: "Langsung ke isi",
    outline: { label: "Di halaman ini" },
    lastUpdated: { text: "Terakhir diperbarui" },
    docFooter: { prev: "Sebelumnya", next: "Berikutnya" },
    editLink: {
      pattern: "https://github.com/ryan4yin/nixos-and-flakes-book/edit/main/docs/:path",
      text: "Sunting halaman ini di GitHub",
    },
    footer: {
      message:
        'Terjemahan komunitas Bahasa Indonesia, bukan versi resmi. Karya asli Ryan Yin. Berlisensi <a href="http://creativecommons.org/licenses/by-sa/4.0/?ref=chooser-v1" target="_blank">CC BY-SA 4.0</a>.',
      copyright:
        'Hak cipta © 2023–sekarang <a href="https://github.com/ryan4yin" target="_blank">Ryan Yin</a>',
    },
    search: {
      provider: "local",
      options: {
        locales: {
          id: {
            translations: {
              button: { buttonText: "Cari", buttonAriaLabel: "Cari" },
              modal: {
                displayDetails: "Tampilkan detail",
                resetButtonTitle: "Hapus pencarian",
                backButtonTitle: "Tutup pencarian",
                noResultsText: "Tidak ada hasil untuk",
                footer: {
                  selectText: "untuk memilih",
                  selectKeyAriaLabel: "enter",
                  navigateText: "untuk berpindah",
                  navigateUpKeyAriaLabel: "panah atas",
                  navigateDownKeyAriaLabel: "panah bawah",
                  closeText: "untuk menutup",
                  closeKeyAriaLabel: "escape",
                },
              },
            },
          },
        },
      },
    },
    notFound: {
      title: "HALAMAN TIDAK DITEMUKAN",
      quote:
        "Namun, jika tidak mengubah arah dan terus mencari, kamu mungkin tiba di tempat yang sedang kamu tuju.",
      linkLabel: "Kembali ke beranda",
      linkText: "Kembali ke beranda",
    },
    nav: [
      { text: "Beranda", link: "/id/" },
      { text: "Prakata", link: "/id/preface.md" },
      { text: "Mulai", link: "/id/introduction/index.md" },
      { text: "Praktik Terbaik", link: "/id/best-practices/intro.md" },
    ],
    sidebar: [
      {
        text: "Prakata",
        items: [{ text: "Prakata", link: "/id/preface.md" }],
      },
      {
        text: "Mulai",
        items: [
          { text: "Pengantar", link: "/id/introduction/index.md" },
          {
            text: "Kelebihan dan Kekurangan",
            link: "/id/introduction/advantages-and-disadvantages.md",
          },
          {
            text: "Instalasi",
            link: "/id/introduction/installation.md",
          },
        ],
      },
      {
        text: "Bahasa Nix",
        items: [{ text: "Dasar", link: "/id/the-nix-language/index.md" }],
      },
      {
        text: "NixOS dengan Flakes",
        items: [
          {
            text: "Mulai Menggunakan NixOS",
            link: "/id/nixos-with-flakes/get-started-with-nixos.md",
          },
          {
            text: "Pengantar Flakes",
            link: "/id/nixos-with-flakes/introduction-to-flakes.md",
          },
          {
            text: "Mengaktifkan NixOS dengan Flakes",
            link: "/id/nixos-with-flakes/nixos-with-flakes-enabled.md",
          },
          {
            text: "Penjelasan flake.nix NixOS",
            link: "/id/nixos-with-flakes/nixos-flake-configuration-explained.md",
          },
          {
            text: "Kemampuan Komposisi Flakes dan Sistem Modul Nixpkgs",
            link: "/id/nixos-with-flakes/nixos-flake-and-module-system.md",
          },
          {
            text: "Mulai Menggunakan Home Manager",
            link: "/id/nixos-with-flakes/start-using-home-manager.md",
          },
          {
            text: "Memodulkan Konfigurasi",
            link: "/id/nixos-with-flakes/modularize-the-configuration.md",
          },
          {
            text: "Memperbarui Sistem",
            link: "/id/nixos-with-flakes/update-the-system.md",
          },
          {
            text: "Menurunkan atau Menaikkan Versi Paket",
            link: "/id/nixos-with-flakes/downgrade-or-upgrade-packages.md",
          },
          {
            text: "Kiat Berguna Lainnya",
            link: "/id/nixos-with-flakes/other-useful-tips.md",
          },
        ],
      },
      {
        text: "Penggunaan Lanjutan Nixpkgs",
        items: [
          { text: "Pengantar", link: "/id/nixpkgs/intro.md" },
          { text: "callPackage", link: "/id/nixpkgs/callpackage.md" },
          { text: "Overriding", link: "/id/nixpkgs/overriding.md" },
          { text: "Overlays", link: "/id/nixpkgs/overlays.md" },
          {
            text: "Beberapa Instans Nixpkgs",
            link: "/id/nixpkgs/multiple-nixpkgs.md",
          },
        ],
      },
      {
        text: "Nix Store & Cache Biner",
        items: [
          { text: "Pengantar", link: "/id/nix-store/intro.md" },
          {
            text: "Menambahkan Server Cache Biner",
            link: "/id/nix-store/add-binary-cache-servers.md",
          },
          {
            text: "Menjalankan Server Cache Biner Sendiri",
            link: "/id/nix-store/host-your-own-binary-cache-server.md",
          },
        ],
      },
      {
        text: "Praktik Terbaik",
        items: [
          { text: "Pengantar", link: "/id/best-practices/intro.md" },
          {
            text: "Menjalankan Biner Unduhan di NixOS",
            link: "/id/best-practices/run-downloaded-binaries-on-nixos.md",
          },
          {
            text: "Menyederhanakan Perintah Terkait NixOS",
            link: "/id/best-practices/simplify-nixos-related-commands.md",
          },
          {
            text: "Mempercepat Debugging Dotfiles",
            link: "/id/best-practices/accelerating-dotfiles-debugging.md",
          },
          {
            text: "NIX_PATH dan Flake Registry Kustom",
            link: "/id/best-practices/nix-path-and-flake-registry.md",
          },
          {
            text: "Deployment Jarak Jauh",
            link: "/id/best-practices/remote-deployment.md",
          },
          {
            text: "Debugging Derivation dan Ekspresi Nix",
            link: "/id/best-practices/debugging.md",
          },
        ],
      },

      {
        text: "Penggunaan Flakes Lainnya",
        items: [
          { text: "Pengantar", link: "/id/other-usage-of-flakes/intro.md" },
          {
            text: "Input Flake",
            link: "/id/other-usage-of-flakes/inputs.md",
          },
          {
            text: "Output Flake",
            link: "/id/other-usage-of-flakes/outputs.md",
          },
          {
            text: "CLI Baru",
            link: "/id/other-usage-of-flakes/the-new-cli.md",
          },
          {
            text: "Sistem Modul & Opsi Kustom",
            link: "/id/other-usage-of-flakes/module-system.md",
          },
          {
            text: "[WIP]Pengujian",
            link: "/id/other-usage-of-flakes/testing.md",
          },
        ],
      },
      {
        text: "Lingkungan Pengembangan di NixOS",
        items: [
          {
            text: "nix shell, nix develop & pkgs.runCommand",
            link: "/id/development/intro.md",
          },
          {
            text: "Lingkungan Pengembangan",
            link: "/id/development/dev-environments.md",
          },
          {
            text: "[WIP]Dasar Pemaketan",
            link: "/id/development/packaging-101.md",
          },
          {
            text: "Kompilasi Lintas Platform",
            link: "/id/development/cross-platform-compilation.md",
          },
          {
            text: "Build Terdistribusi",
            link: "/id/development/distributed-building.md",
          },
          {
            text: "[WIP]Pengembangan Kernel",
            link: "/id/development/kernel-development.md",
          },
        ],
      },
      {
        text: "Topik Lanjutan",
        items: [{ text: "Topik Lanjutan", link: "/id/advanced-topics/index.md" }],
      },
      {
        text: "Pertanyaan yang Sering Diajukan",
        items: [{ text: "Pertanyaan yang Sering Diajukan", link: "/id/faq/index.md" }],
      },
    ],
  },
})
