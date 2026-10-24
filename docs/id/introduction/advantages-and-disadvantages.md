# Kelebihan & Kekurangan NixOS {#advantages-disadvantages-of-nixos}

## Kelebihan NixOS {#advantages-of-nixos}

- **Konfigurasi Deklaratif, OS sebagai Kode**
  - NixOS memakai konfigurasi deklaratif untuk mengelola seluruh lingkungan sistem.
    Konfigurasi ini bisa langsung dikelola dengan Git. Sistem bisa dikembalikan ke keadaan
    sebelumnya mana pun selama berkas konfigurasinya tersimpan (asalkan keadaan yang
    diinginkan dinyatakan dalam konfigurasi Nix).
  - Nix Flakes semakin meningkatkan reproduksibilitas dengan berkas pengunci versi
    `flake.lock`. Berkas ini mencatat alamat sumber data, nilai hash, dan informasi
    terkait lainnya untuk semua dependensi. Rancangan ini sangat meningkatkan
    reproduksibilitas Nix dan memastikan hasil build yang konsisten. Inspirasinya berasal
    dari rancangan pengelolaan paket bahasa pemrograman seperti Cargo dan npm.
- **Penyesuaian Sistem yang Sangat Praktis**
  - Berbagai komponen sistem bisa diganti dengan mudah hanya melalui beberapa perubahan
    konfigurasi. Nix membungkus semua operasi rumit di baliknya dalam paket Nix, sehingga
    pengguna cukup memakai sekumpulan parameter deklaratif yang ringkas.
  - Perubahan aman dilakukan. Beralih di antara lingkungan desktop (seperti GNOME, KDE,
    i3, dan sway) juga mudah, dengan sedikit kendala.
- **Kemampuan Rollback**
  - Sistem bisa dikembalikan ke keadaan sebelumnya mana pun. Secara bawaan, NixOS bahkan
    menyertakan semua versi lama dalam pilihan boot agar perubahan mudah dibatalkan.
    Karena itu, Nix dianggap sebagai salah satu pendekatan pengelolaan paket yang paling
    stabil.
- **Tanpa Masalah Konflik Dependensi**
  - Setiap paket perangkat lunak di Nix memiliki hash unik yang disertakan dalam path
    instalasinya. Dengan begitu, beberapa versi bisa terpasang berdampingan.
- **Komunitas aktif dengan beragam proyek pihak ketiga**
  - Repositori paket resmi, nixpkgs, memiliki banyak kontributor, dan banyak orang
    membagikan konfigurasi Nix mereka. Menjelajahi ekosistem NixOS merupakan pengalaman
    seru, seperti menemukan benua baru.

<figure>
  <img src="/nixos-bootloader.avif">
  <figcaption>
    <h4 align="center">
      Semua versi terdahulu tercantum dalam pilihan boot NixOS. <br>
      Gambar dari
      <a href="https://discourse.nixos.org/t/how-to-make-uefis-grub2-menu-the-same-as-bioss-one/10074" target="_blank" rel="noopener noreferrer">
        NixOS Discourse - 10074
      </a>
    </h4>
  </figcaption>
</figure>

## Kekurangan NixOS {#disadvantages-of-nixos}

- **Sulit Dipelajari**:
  - Untuk mencapai reproduksibilitas penuh dan menghindari masalah akibat penggunaan yang
    keliru, kamu perlu mempelajari keseluruhan rancangan Nix dan mengelola sistem secara
    deklaratif. Bukan sekadar menjalankan perintah seperti `nix-env -i` (serupa dengan
    `apt-get install`) tanpa memahaminya.
- **Dokumentasi Tidak Tertata**:
  - Saat ini, Nix Flakes masih merupakan fitur eksperimental, dan dokumentasi yang khusus
    membahasnya masih terbatas. Sebagian besar dokumentasi komunitas Nix membahas
    `/etc/nixos/configuration.nix` klasik. Jika ingin langsung belajar dari Nix
    Flakes(`flake.nix`), kamu perlu membaca banyak dokumentasi usang dan mengambil
    informasi yang relevan. Selain itu, beberapa fitur inti Nix, seperti `imports` dan
    Nixpkgs Module System, belum memiliki dokumentasi resmi yang terperinci. Akibatnya,
    kamu harus menganalisis kode sumber.
- **Penggunaan Ruang Disk Lebih Besar**:
  - Agar sistem bisa dikembalikan kapan saja, secara bawaan Nix menyimpan semua lingkungan
    terdahulu. Akibatnya, penggunaan ruang disk meningkat.
  - Tambahan penggunaan ruang ini mungkin tidak menjadi masalah di komputer desktop,
    tetapi bisa merepotkan di server cloud dengan sumber daya terbatas.
- **Pesan Kesalahan Sulit Dipahami**:
  - Karena
    [algoritma penggabungan yang rumit](https://discourse.nixos.org/t/best-resources-for-learning-about-the-nixos-module-system/1177/4)
    pada [sistem modul Nixpkgs](../other-usage-of-flakes/module-system.md), pesan
    kesalahan NixOS sangat buruk. Sering kali, dengan ataupun tanpa `--show-trace`,
    pesannya hanya memberi tahu bahwa ada kesalahan dalam kode. (Pesan yang paling umum
    dan membingungkan adalah
    [Infinite recursion encountered](https://discourse.nixos.org/t/infinite-recursion-encountered-by-making-module-configurable/23508/2).)
    Tetapi di mana tepatnya? Sistem tipenya bilang tidak tahu, jadi kamu harus mencarinya
    sendiri. Menurut pengalaman saya, **cara paling sederhana dan efektif menghadapi pesan
    kesalahan tak bermakna ini adalah memakai "pencarian biner" untuk mengembalikan kode
    secara bertahap**.
  - Masalah ini barangkali merupakan hal paling menyakitkan dari NixOS saat ini.
- **Implementasi di Baliknya Lebih Rumit**:
  - Abstraksi deklaratif Nix menambah kerumitan pada kode di baliknya dibandingkan kode
    serupa dalam alat imperatif tradisional.
  - Kerumitan ini mempersulit implementasi dan penyesuaian pada tingkat yang lebih rendah.
    Namun, beban ini terutama ditanggung pengelola paket Nix. Pengguna biasa jarang
    berhadapan dengan kerumitan di baliknya, sehingga beban mereka lebih ringan.

## Ringkasan {#summary}

Secara keseluruhan, menurut saya NixOS cocok untuk pengembang yang punya pengalaman
menggunakan Linux dan pengetahuan pemrograman pada tingkat tertentu, serta menginginkan
kendali lebih besar atas sistem mereka.

Saya tidak menyarankan pemula yang belum pernah memakai Linux untuk langsung terjun ke
NixOS, karena perjalanannya bisa membuat frustrasi.

> Jika masih punya pertanyaan tentang NixOS, kamu bisa membaca bab terakhir buku ini,
> [FAQ](../faq/).
