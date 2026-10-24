# Prakata {#preface}

## Kesulitan Pemula NixOS — Dokumentasi dan Flakes {#the-pain-of-nixos-beginners-documentation-and-flakes}

NixOS adalah distribusi Linux yang sangat khas, dibangun di atas pengelola paket Nix.
Filosofi rancangannya berbeda dari distribusi tradisional seperti Ubuntu, CentOS, Arch
Linux, dan lainnya.

Salah satu keunggulan utama NixOS dibandingkan distribusi lain adalah reproduksibilitas
dan konfigurasi deklaratifnya. Keduanya memungkinkan pengguna mereplikasi lingkungan
sistem yang konsisten di beberapa mesin.

NixOS memang andal, tetapi keunggulannya juga disertai peningkatan kerumitan sistem. Ini
membuatnya lebih sulit bagi pendatang baru. Salah satu kendala utamanya: pengetahuan yang
dikumpulkan dari distribusi Linux lain tidak mudah diterapkan pada NixOS. Kendala lainnya,
dokumentasi resmi dan komunitas sering tersebar dan usang. Masalah-masalah ini menyulitkan
banyak pemula NixOS.

Masalah tersebut terlihat pada fitur eksperimental pengelola paket Nix yang bernama
Flakes. Terinspirasi pengelola paket seperti npm dan Cargo, Flakes memakai `flake.nix`
untuk mencatat semua dependensi eksternal dan `flake.lock` untuk mengunci versinya. Ini
sangat meningkatkan reproduksibilitas dan kemampuan menggabungkan konfigurasi pengelola
paket Nix maupun NixOS.

Keunggulan Flakes membuatnya sangat populer di komunitas. Menurut survei resmi, lebih dari
separuh repositori Nix baru yang dibuat di GitHub kini memakai Flakes.

Namun, demi menjaga stabilitas, dokumentasi resmi hampir tidak membahas materi terkait
Flakes. Ini membuat banyak pengguna Nix/NixOS kebingungan. Mereka melihat semua orang
memakai Flakes dan ingin mempelajarinya juga, tetapi tidak tahu harus mulai dari mana.
Sering kali mereka harus merangkai informasi yang tersebar, menelusuri kode sumber
Nixpkgs, atau meminta bantuan pengguna yang lebih berpengalaman.

## Asal Mula Buku Ini {#the-origin-of-this-book}

Buku ini berawal dari catatan saya yang tersebar saat pertama kali mulai memakai NixOS.

Pada April tahun ini (2023), saat mulai mendalami NixOS, saya jatuh cinta pada filosofi
rancangannya. Atas saran seorang teman, saya mengenal fitur eksperimental Flakes milik
Nix. Setelah membandingkan Flakes dengan cara konfigurasi NixOS tradisional, saya sadar
bahwa hanya NixOS dengan Flakes yang sesuai harapan saya. Akibatnya, saya sama sekali
mengabaikan pendekatan konfigurasi Nix tradisional dan langsung belajar mengonfigurasi
sistem NixOS dengan Flakes sejak langkah awal.

Selama belajar, saya menemukan bahwa sumber belajar Flakes yang ramah pemula sangat
sedikit. Sebagian besar dokumentasi berfokus pada pendekatan konfigurasi Nix tradisional.
Saya terpaksa mengambil informasi yang diperlukan dari berbagai sumber, seperti NixOS
Wiki, Zero to Nix, Nixpkgs Manual, dan kode sumber Nixpkgs. Materi yang tidak terkait
Flakes saya abaikan. Perjalanan belajar ini cukup berliku dan menyakitkan. Agar tidak
tersandung lagi di kemudian hari, saya rajin mencatat banyak hal selama belajar, meski
catatannya tersebar.

Setelah mendapat sedikit pengalaman, pada awal Mei tahun ini saya mengalihkan PC utama
saya ke NixOS. Seusai merapikan dan menyempurnakan catatan pemula NixOS saya, saya
menerbitkannya di blog[^1] dan membagikannya ke komunitas NixOS berbahasa Mandarin.
Tanggapannya positif. Mengikuti saran mereka, saya menerjemahkan artikel itu ke bahasa
Inggris dan membagikannya di Reddit, yang juga mendapat tanggapan besar[^2].

Sambutan positif terhadap dokumen yang saya bagikan itu menyemangati saya untuk terus
menyempurnakannya. Dengan pembaruan terus-menerus, isi dokumen ini berkembang hingga lebih
dari 20.000 kata. Beberapa pembaca mengatakan pengalaman membacanya bisa diperbaiki, jadi
saya menerapkan saran mereka[^3]. Saya pun memindahkan isi artikel ke repositori GitHub,
membuat situs dokumentasi khusus, dan menyesuaikan penyajiannya. Hasilnya lebih menyerupai
panduan pemula daripada buku catatan pribadi.

Lahirlah buku sumber terbuka dwibahasa yang saya beri nama "<NixOS & Flakes Book>" dengan
judul Mandarin "NixOS & Flakes 新手指南" ("Panduan Pemula NixOS & Flakes").

Isi buku sumber terbuka ini berkembang sedikit demi sedikit seiring saya memakai NixOS dan
berinteraksi dengan pembaca. Rasa pencapaian dari tanggapan positif pembaca menjadi
pendorong terbesar saya untuk memperbaruinya. Masukan beberapa pembaca sangat membantu
"evolusinya". Awalnya, saya hanya ingin berbagi pengalaman memakai NixOS dengan agak
santai, tetapi tanpa diduga tulisan itu menjadi buku sumber terbuka. Pembacanya di luar
negeri bahkan melampaui pembaca di negara saya sendiri, dan buku ini mendapat banyak
bintang—hasil yang tidak pernah saya bayangkan.

Saya berterima kasih kepada semua teman yang berkontribusi dan memberikan saran untuk buku
ini. Saya juga menghargai semua dukungan dan semangat dari para pembaca. Tanpa kalian
semua, isi buku ini mungkin tetap terbatas pada blog pribadi saya, dan tidak akan mencapai
bentuknya sekarang.

## Ciri Buku Ini {#the-features-of-this-book}

1. Berfokus pada NixOS dan Flakes, mengabaikan pendekatan konfigurasi Nix tradisional.
2. Ramah pemula, dengan penjelasan dari sudut pandang pendatang baru NixOS yang punya
   sedikit pengalaman menggunakan Linux dan pemrograman.
3. Pembelajaran bertahap, selangkah demi selangkah.
4. Sebagian besar bab menyediakan tautan rujukan di bagian akhir. Pembaca bisa mendalami
   topik dan menilai kredibilitas isinya dengan mudah.
5. Isinya padu, tertata, dan terstruktur. Pembaca bisa membaca buku ini secara bertahap
   ataupun segera menemukan informasi yang dibutuhkan.

## Donasi {#donation}

Jika buku ini bermanfaat, pertimbangkan untuk berdonasi demi mendukung pengembangannya.

- GitHub: <https://github.com/sponsors/ryan4yin>
- Patreon: <https://patreon.com/ryan4yin>
- Buy me a coffee: <https://buymeacoffee.com/ryan4yin>
- 爱发电: <https://afdian.com/a/ryan4yin>
- Ethereum: `0xB74Aa43C280cDc8d8236952400bF6427E4390855`

## Masukan dan Diskusi {#feedback-and-discussion}

Saya bukan pakar NixOS. Per 2024-02, saya baru memakai NixOS kurang dari 9 bulan, jadi
pasti ada pemahaman keliru atau kasus rumit dalam buku ini. Jika menemukan kesalahan, atau
punya pertanyaan maupun saran, beri tahu saya dengan membuka issue atau ikut berdiskusi di
[GitHub Discussions](https://github.com/ryan4yin/nixos-and-flakes-book/discussions). Saya
senang untuk terus menyempurnakan isi buku ini.

Saya menulis buku kecil ini semata-mata karena belum ada orang di komunitas yang
membuatkannya untuk saya, yang saat itu masih pemula. Jadi, saya memilih melakukannya
sendiri. Meski saya tahu bisa saja membuat kesalahan, itu jauh lebih baik daripada tidak
melakukan apa-apa.

Saya berharap buku ini bisa membantu lebih banyak orang merasakan keseruan NixOS. Semoga
kamu menyukainya!

## Riwayat Masukan dan Diskusi tentang Buku Ini {#historical-feedback-and-discussions-on-this-book}

Masukan berbahasa Inggris dan diskusi terkait:

- [[2023-05-11] NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/13dxw9d/nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-22] Updates: NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/14fvz1q/updates_nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-24] An unofficial NixOS & Flakes book for beginners - Discourse](https://discourse.nixos.org/t/an-unofficial-nixos-flakes-book-for-beginners/29561)
- [[2023-07-06] This isn't an issue but it has to be said: - Discussions](https://github.com/ryan4yin/nixos-and-flakes-book/discussions/43)

Masukan dan diskusi berbahasa Mandarin:

- [[2023-05-09] NixOS 与 Nix Flakes 新手入门 - v2ex 社区](https://www.v2ex.com/t/938569#reply45)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - v2ex 社区](https://www.v2ex.com/t/951190#reply9)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - 0xffff 社区](https://0xffff.one/d/1547-nixos-yu-flakes-yi-fen-fei-guan)

[^1]:
    [NixOS & Nix Flakes - A Guide for Beginners - This Cute World](https://thiscute.world/en/posts/nixos-and-flake-basics/)

[^2]:
    [NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/13dxw9d/nixos_nix_flakes_a_guide_for_beginners/)

[^3]:
    [Updates: NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/14fvz1q/comment/jp4xhj3/?context=3)
