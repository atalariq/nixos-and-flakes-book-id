# Nix Store dan Cache Biner {#nix-store-and-binary-cache}

Di sini kita memberikan pengantar singkat tentang Nix Store, cache biner Nix, dan konsep
terkait. Konfigurasi khusus dan cara penggunaan tidak dibahas di sini, melainkan secara
terperinci pada bab-bab berikutnya.

## Nix Store {#nix-store}

Nix Store adalah salah satu konsep inti pengelola paket Nix. Ini merupakan sistem berkas
yang hanya bisa dibaca, untuk menyimpan semua berkas yang harus tetap tidak berubah.
Termasuk di dalamnya hasil build, metadata, dan semua input build paket perangkat lunak.

Pengelola paket Nix memakai bahasa fungsional Nix untuk menggambarkan paket perangkat
lunak dan dependensinya. Setiap paket dianggap sebagai output fungsi murni, dan hasil
build-nya disimpan dalam Nix Store.

Data dalam Nix Store memiliki format path tetap:

```text
/nix/store/b6gvzjyb2pg0kjfwrjmg1vfhh54ad73z-firefox-33.1
|--------| |------------------------------| |----------|
store directory         digest                  name
```

Seperti terlihat, path dalam Nix Store dimulai dengan nilai hash (digest), diikuti nama
dan nomor versi paket perangkat lunak. Nilai hash ini dihitung berdasarkan semua informasi
input paket (parameter build, dependensi, versi dependensi, dan sebagainya). Perubahan apa
pun pada parameter build atau dependensi akan mengubah nilai hash, sehingga memastikan
keunikan path setiap paket. Selain itu, Nix Store yang hanya bisa dibaca memastikan paket
perangkat lunak tidak berubah—setelah dibangun, paket tidak akan berubah.

Karena path penyimpanan hasil build dihitung berdasarkan semua informasi input proses
build, **informasi input yang sama menghasilkan path penyimpanan yang sama**. Rancangan
ini juga dikenal sebagai _Input-addressed Model_.

### Cara NixOS Memakai Nix Store {#how-nixos-uses-the-nix-store}

Konfigurasi deklaratif NixOS menghitung paket perangkat lunak yang perlu dipasang, lalu
membuat tautan simbolis dari path penyimpanan paket dalam Nix Store ke
`/run/current-system`. Variabel lingkungan seperti `PATH` diubah agar menunjuk ke folder
yang sesuai dalam `/run/current-system`, sehingga perangkat lunak terpasang. Setiap
deployment, NixOS menghitung konfigurasi sistem baru, membersihkan tautan simbolis lama,
dan membuat yang baru agar lingkungan sistem sesuai dengan konfigurasi deklaratif.

home-manager bekerja serupa: paket perangkat lunak yang dikonfigurasi pengguna ditautkan
secara simbolis ke `/etc/profiles/per-user/your-username`. Variabel lingkungan seperti
`PATH` diubah agar menunjuk ke path ini, sehingga paket perangkat lunak pengguna
terpasang.

```bash
# Check where bash in the environment comes from (installed using NixOS)
› which bash
╭───┬─────────┬─────────────────────────────────┬──────────╮
│ # │ command │              path               │   type   │
├───┼─────────┼─────────────────────────────────┼──────────┤
│ 0 │ bash    │ /run/current-system/sw/bin/bash │ external │
╰───┴─────────┴─────────────────────────────────┴──────────╯

› ls -al /run/current-system/sw/bin/bash
lrwxrwxrwx 15 root root 76 1970年 1月 1日 /run/current-system/sw/bin/bash -> /nix/store/1zslabm02hi75anb2w8zjrqwzgs0vrs3-bash-interactive-5.2p26/bin/bash

# Check where cowsay in the environment comes from (installed using home-manager)
› which cowsay
╭───┬─────────┬────────────────────────────────────────┬──────────╮
│ # │ command │                  path                  │   type   │
├───┼─────────┼────────────────────────────────────────┼──────────┤
│ 0 │ cowsay  │ /etc/profiles/per-user/ryan/bin/cowsay │ external │
╰───┴─────────┴────────────────────────────────────────┴──────────╯

› ls -al /etc/profiles/per-user/ryan/bin/cowsay
lrwxrwxrwx 2 root root 72 1970年 1月 1日 /etc/profiles/per-user/ryan/bin/cowsay -> /nix/store/w2czyf82gxz4vy9kzsdhr88112bmc0c1-home-manager-path/bin/cowsay
```

Sementara itu, perintah `nix develop` langsung menambahkan path penyimpanan paket ke
variabel lingkungan seperti `PATH` dan `LD_LIBRARY_PATH`. Dengan begitu, lingkungan shell
baru bisa langsung memakai paket perangkat lunak atau pustaka tersebut.

Misalnya, dalam repositori kode sumber buku ini,
[ryan4yin/nixos-and-flakes-book](https://github.com/ryan4yin/nixos-and-flakes-book),
setelah menjalankan `nix develop`, kita bisa memeriksa isi variabel lingkungan `PATH`:

```bash
› nix develop
node v22.18.0

› env | egrep '^PATH'
PATH=/nix/store/v0sf67x7sw6pg277amhgf3j84m60wrqn-pre-commit-4.2.0/bin:/nix/store/yva1rk7v7s31dpwkwxcphpqkn5l3bp1f-nodejs-22.18.0-dev/bin:/nix/store/vrqcpwq576gar2i430lj91v37b7k8jw2-nodejs-22.18.0/bin:/nix/store/qzw56f9vai5jg9dm3wbm45r6cc6b65d8-pnpm-10.15.0/bin:/nix/store/n8b4js8xkj12d1jjjqm86p9lwmyhh2rf-yarn-1.22.22/bin:/nix/store/bjhv861k4ri85l1vyrnr954ncsdbw3ri-prettier-3.5.3/bin:/nix/store/m6zld27lmw422ca5zywhkq8kmlaf8inh-git-2.50.1/bin:/nix/store/gz3wn2d2xbl758jsln65za95mdc9yial-typos-1.32.0/bin:/nix/store/bx0wnjpp6mgr6bmh5q1mz9c1ach34lbn-nixfmt-0.6.0-bin/bin:/nix/store/zf4jj08zh07zg1j2s64g8sfjbzfq70lm-pandoc-cli-3.6/bin:/nix/store/g7i75czfbw9sy5f8v7rjbama6lr3ya3s-patchelf-0.15.0/bin:/nix/store/kaj8d1zcn149m40s9h0xi0khakibiphz-gcc-wrapper-14.3.0/bin:/nix/store/8adzgnxs3s0pbj22qhk9zjxi1fqmz3xv-gcc-14.3.0/bin:/nix/store/p2ixvjsas4qw58dcwk01d22skwq4fyka-glibc-2.40-66-bin/bin:/nix/store/rry6qingvsrqmc7ll7jgaqpybcbdgf5v-coreutils-9.7/bin:/nix/store/87zpmcmwvn48z4lbrfba74b312h22s6c-binutils-wrapper-2.44/bin:/nix/store/ap35np2bkwaba3rxs3qlxpma57n2awyb-binutils-2.44/bin:/nix/store/rry6qingvsrqmc7ll7jgaqpybcbdgf5v-coreutils-9.7/bin:/nix/store/392hs9nhm6wfw4imjllbvb1wil1n39qx-findutils-4.10.0/bin:/nix/store/xw0mf3shymq3k7zlncf09rm8917sdi4h-diffutils-3.12/bin:/nix/store/4rpiqv9yr2pw5094v4wc33ijkqjpm9sa-gnused-4.9/bin:/nix/store/l2wvwyg680h0v2la18hz3yiznxy2naqw-gnugrep-3.11/bin:/nix/store/c1z5j28ndxljf1ihqzag57bwpfpzms0g-gawk-5.3.2/bin:/nix/store/w60s4xh1pjg6dwbw7j0b4xzlpp88q5qg-gnutar-1.35/bin:/nix/store/xd9m9jkvrs8pbxvmkzkwviql33rd090j-gzip-1.14/bin:/nix/store/w1pxx760yidi7n9vbi5bhpii9xxl5vdj-bzip2-1.0.8-bin/bin:/nix/store/xk0d14zpm0njxzdm182dd722aqhav2cc-gnumake-4.4.1/bin:/nix/store/cfqbabpc7xwg8akbcchqbq3cai6qq2vs-bash-5.2p37/bin:/nix/store/gj54zvf7vxll1mzzmqhqi1p4jiws3mfb-patch-2.7.6/bin:/nix/store/22rpb6790f346c55iqi6s9drr5qgmyjf-xz-5.8.1-bin/bin:/nix/store/xlmpcglsq8l09qh03rf0virz0331pjdc-file-5.45/bin:/home/ryan/.local/bin:/run/wrappers/bin:/etc/profiles/per-user/ryan/bin:/nix/var/nix/profiles/default/bin:/run/current-system/sw/bin:/home/ryan/go/bin:/home/ryan/.cargo/bin:/home/ryan/.npm/bin:/home/ryan/.local/bin:/home/ryan/go/bin:/home/ryan/.cargo/bin:/home/ryan/.npm/bin
```

Jelas terlihat bahwa `nix develop` langsung menambahkan path penyimpanan banyak paket
perangkat lunak ke variabel lingkungan `PATH`.

## Pengumpulan Sampah Nix Store {#nix-store-garbage-collection}

Nix Store merupakan sistem penyimpanan terpusat untuk semua input dan output build paket
perangkat lunak. Seiring penggunaan sistem, jumlah paket dalam Nix Store akan bertambah
dan ruang disk yang digunakan semakin besar.

Agar Nix Store tidak tumbuh tanpa batas, pengelola paket Nix menyediakan mekanisme
pengumpulan sampah untuk Nix Store lokal, guna membersihkan data lama dan mengosongkan
ruang penyimpanan.

Menurut
[Chapter 11. The Garbage Collector - nix pills](https://nixos.org/guides/nix-pills/garbage-collector),
perintah `nix-store --gc` mengumpulkan sampah dengan menelusuri semua tautan simbolis
dalam `/nix/var/nix/gcroots/` secara rekursif. Semua paket yang dirujuk dicari, lalu paket
yang tidak lagi dirujuk dihapus. Perintah `nix-collect-garbage --delete-old` melangkah
lebih jauh: semua [profil](https://nixos.org/manual/nix/stable/command-ref/files/profiles)
lama dihapus terlebih dahulu, lalu `nix-store --gc` dijalankan untuk membersihkan paket
yang tidak lagi dirujuk.

Perlu diingat bahwa hasil build perintah seperti `nix build` dan `nix develop` tidak
otomatis ditambahkan ke `/nix/var/nix/gcroots/`. Jadi, hasil build ini bisa dibersihkan
oleh mekanisme pengumpulan sampah. Kamu bisa memakai `nix-instantiate` dengan
`keep-outputs = true` dan cara lain untuk mencegahnya. Namun, saat ini saya lebih menyukai
server cache biner sendiri dengan masa penyimpanan cache lebih lama (misalnya satu tahun),
lalu mengirim data ke sana. Dengan begitu, hasil build bisa dibagikan antar-mesin dan
terhindar dari pembersihan oleh pengumpulan sampah lokal. Dua tujuan tercapai sekaligus.

## Cache Biner {#binary-cache}

Rancangan Nix dan Nix Store memastikan paket perangkat lunak tidak berubah, sehingga hasil
build bisa langsung dibagikan di antara beberapa mesin. Selama mesin-mesin ini memakai
informasi input yang sama untuk membangun paket, path output-nya akan sama. Nix bisa
memakai ulang hasil build mesin lain, alih-alih membangun ulang paket, sehingga instalasi
perangkat lunak lebih cepat.

Cache biner Nix dirancang berdasarkan sifat ini. Ini adalah implementasi Nix Store yang
menyimpan data di server jarak jauh, bukan secara lokal. Saat diperlukan, pengelola paket
Nix mengunduh hasil build yang sesuai dari server ke `/nix/store` lokal, sehingga
menghindari proses build lokal yang memakan waktu.

Nix menyediakan server cache biner resmi di <https://cache.nixos.org>, yang menyimpan
hasil build sebagian besar paket nixpkgs untuk arsitektur CPU umum. Saat kamu menjalankan
perintah build Nix di mesin lokal, Nix terlebih dahulu mencari cache biner yang sesuai
pada server cache. Jika ditemukan, berkas cache langsung diunduh, melewati kompilasi lokal
yang memakan waktu dan sangat mempercepat proses build.

## Model Kepercayaan Cache Biner Nix {#nix-binary-cache-trust-model}

**Input-addressed Model** hanya menjamin bahwa input yang sama menghasilkan path output
yang sama, tetapi tidak menjamin keunikan isi output. Artinya, meski informasi input sama,
beberapa build paket perangkat lunak yang sama bisa menghasilkan isi output berbeda.

Nix sudah mengambil langkah seperti menonaktifkan akses jaringan dalam lingkungan build
dan memakai cap waktu tetap untuk meminimalkan ketidakpastian. Namun, masih ada faktor di
luar kendali yang bisa memengaruhi proses build dan menghasilkan isi output berbeda.
Perbedaan ini biasanya tidak memengaruhi fungsi paket, tetapi menyulitkan pembagian cache
biner secara aman. Ketidakpastian isi output membuat kita sulit memastikan apakah cache
biner unduhan benar-benar dibangun dengan informasi input yang dinyatakan, dan apakah
isinya berbahaya.

Untuk mengatasinya, pengelola paket Nix memakai mekanisme penandatanganan kunci
publik-privat untuk memverifikasi sumber dan integritas cache biner. Ini membebankan
tanggung jawab keamanan kepada pengguna. Jika ingin memakai server cache tidak resmi untuk
mempercepat build, kamu harus menambahkan kunci publik server itu ke `trusted-public-keys`
dan menanggung risiko keamanannya. Server cache mungkin menyediakan data cache yang memuat
isi berbahaya.

### Content-addressed Model {#content-addressed-model}

[RFC062 - content-addressed store paths](https://github.com/NixOS/rfcs/blob/master/rfcs/0062-content-addressed-paths.md)
adalah upaya komunitas untuk meningkatkan konsistensi hasil build. Usulan ini mengajukan
cara baru menghitung path penyimpanan berdasarkan hasil build (output), bukan informasi
input. Rancangan ini memastikan konsistensi hasil build: jika hasilnya berbeda, path
penyimpanannya juga berbeda. Dengan begitu, ketidakpastian isi output yang melekat pada
input-addressed model bisa dihindari.

Namun, pendekatan ini masih dalam tahap eksperimental dan belum banyak diadopsi.

## Rujukan {#references}

- [Nix Store - Nix Manual](https://nixos.org/manual/nix/stable/store/)
