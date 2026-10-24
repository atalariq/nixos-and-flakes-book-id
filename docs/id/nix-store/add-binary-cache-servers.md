# Menambahkan Server Cache Biner {#adding-binary-cache-servers}

Kita sudah memperkenalkan konsep Nix Store dan cache biner. Di sini, kita akan melihat
cara menambahkan beberapa server cache untuk mempercepat unduhan paket.

## Mengapa Menambahkan Server Cache {#why-add-cache-servers}

Nix menyediakan server cache resmi, [https://cache.nixos.org](https://cache.nixos.org),
yang menyimpan hasil build sebagian besar paket yang umum dipakai. Namun, ini mungkin
belum memenuhi kebutuhan semua pengguna. Dalam keadaan berikut, kita perlu menambahkan
server cache lain:

1. Menambahkan server cache untuk proyek pihak ketiga, seperti server cache nix-community,
   [https://nix-community.cachix.org](https://nix-community.cachix.org), yang bisa sangat
   mempercepat build proyek-proyek tersebut.
1. Menambahkan situs mirror server cache terdekat dari pengguna untuk mempercepat unduhan.
1. Menambahkan server cache buatan sendiri untuk mempercepat build proyek pribadi.

## Cara Menambahkan Server Cache {#how-to-add-custom-cache-servers}

Dalam Nix, kamu bisa mengatur server cache dengan opsi berikut:

1. [substituters](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-substituters):
   Berupa daftar string, masing-masing berisi alamat server cache. Nix akan mencoba
   mencari cache pada server-server ini sesuai urutan dalam daftar.
2. [trusted-public-keys](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-trusted-public-keys):
   Untuk mencegah serangan berbahaya, opsi
   [require-sigs](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-require-sigs)
   aktif secara bawaan. Nix hanya memakai cache dengan tanda tangan yang bisa diverifikasi
   oleh salah satu kunci publik dalam `trusted-public-keys`. Jadi, kamu perlu menambahkan
   kunci publik yang sesuai dengan `substituters` ke `trusted-public-keys`.
   1. Data mirror cache disinkronkan langsung dari server cache resmi. Karena itu, kunci
      publiknya sama dengan server resmi, dan kamu bisa memakai kunci publik server resmi
      tanpa konfigurasi tambahan.
   2. Mekanisme verifikasi kunci publik yang sepenuhnya berbasis kepercayaan ini
      memindahkan tanggung jawab keamanan kepada pengguna. Jika ingin memakai server cache
      pihak ketiga untuk mempercepat build pustaka tertentu, pengguna harus menanggung
      risiko keamanannya. Mereka harus memutuskan apakah kunci publik server itu akan
      ditambahkan ke `trusted-public-keys`. Untuk menyelesaikan masalah kepercayaan ini
      sepenuhnya, Nix memperkenalkan fitur eksperimental
      [ca-derivations](https://wiki.nixos.org/wiki/Ca-derivations), yang tidak bergantung
      pada `trusted-public-keys` untuk verifikasi tanda tangan. Pengguna yang tertarik
      bisa menjelajahinya lebih lanjut.

Parameter `substituters` dan `trusted-public-keys` bisa diatur dengan cara berikut:

1. Atur dalam `/etc/nix/nix.conf`, konfigurasi global yang memengaruhi semua pengguna.
   1. Kamu bisa memakai `nix.settings.substituters` dan `nix.settings.trusted-public-keys`
      dalam Modul NixOS mana pun untuk menghasilkan `/etc/nix/nix.conf` secara deklaratif.
2. Atur dalam `flake.nix` proyek flake dengan `nixConfig.substituters`. Konfigurasi ini
   hanya memengaruhi flake saat ini.
3. Atur sementara melalui parameter `--option` perintah `nix`. Konfigurasi ini hanya
   berlaku pada perintah saat ini.

Dari ketiga cara ini, selain konfigurasi global pada cara pertama, dua cara lainnya
bersifat sementara. Jika beberapa cara dipakai bersamaan, konfigurasi yang belakangan
langsung menimpa konfigurasi sebelumnya.

Namun, menetapkan `substituters` sementara memiliki risiko keamanan, seperti dijelaskan
sebelumnya tentang kelemahan mekanisme verifikasi berbasis `trusted-public-keys`. Untuk
menetapkan `substituters` melalui cara kedua dan ketiga, salah satu syarat berikut harus
terpenuhi:

1. Pengguna saat ini tercantum dalam daftar parameter
   [`trusted-users`](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-trusted-users)
   di `/etc/nix/nix.conf`.
2. `substituters` yang ditentukan sementara melalui `--option substituters "http://xxx"`
   tercantum dalam daftar parameter
   [`trusted-substituters`](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-trusted-substituters)
   di `/etc/nix/nix.conf`.

Berdasarkan informasi tadi, berikut contoh ketiga cara konfigurasi yang disebutkan.

Pertama, atur `substituters` dan `trusted-public-keys` tingkat sistem secara deklaratif
dengan `nix.settings` dalam `/etc/nixos/configuration.nix` atau Modul NixOS mana pun:

```nix{7-27}
{
  lib,
  ...
}: {

  # ...
  nix.settings = {
    # given the users in this list the right to specify additional substituters via:
    #    1. `nixConfig.substituters` in `flake.nix`
    #    2. command line args `--options substituters http://xxx`
    trusted-users = ["ryan"];

    substituters = [
      # cache mirror located in China
      # status: https://mirror.sjtu.edu.cn/
      "https://mirror.sjtu.edu.cn/nix-channels/store"
      # status: https://mirrors.ustc.edu.cn/status/
      # "https://mirrors.ustc.edu.cn/nix-channels/store"

      "https://cache.nixos.org"
    ];

    trusted-public-keys = [
      # the default public key of cache.nixos.org, it's built-in, no need to add it here
      "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
    ];
  };

}
```

Cara kedua adalah mengatur `substituters` dan `trusted-public-keys` dengan `nixConfig`
dalam `flake.nix`:

> Seperti disebutkan sebelumnya, `nix.settings.trusted-users` harus diatur dalam
> konfigurasi ini. Jika tidak, `substituters` yang kita atur di sini tidak akan berlaku.

```nix{5-23,42-46}
{
  description = "My NixOS configuration";

  # the nixConfig here only affects the flake itself, not the system configuration!
  nixConfig = {
    # override the default substituters
    substituters = [
      # cache mirror located in China
      # status: https://mirror.sjtu.edu.cn/
      "https://mirror.sjtu.edu.cn/nix-channels/store"
      # status: https://mirrors.ustc.edu.cn/status/
      # "https://mirrors.ustc.edu.cn/nix-channels/store"

      "https://cache.nixos.org"

      # nix community's cache server
      "https://nix-community.cachix.org"
    ];
    trusted-public-keys = [
      # nix community's cache server public key
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";

    # omitting several configurations...
  };

  outputs = inputs@{
      self,
      nixpkgs,
      ...
  }: {
    nixosConfigurations = {
      my-nixos = nixpkgs.lib.nixosSystem {
        modules = [
          ./hardware-configuration.nix
          ./configuration.nix

          {
            # given the users in this list the right to specify additional substituters via:
            #    1. `nixConfig.substituters` in `flake.nix`
            nix.settings.trusted-users = [ "ryan" ];
          }
          # omitting several configurations...
       ];
      };
    };
  };
}
```

Terakhir, cara ketiga memakai perintah berikut untuk menentukan `substituters` dan
`trusted-public-keys` sementara selama deployment:

```bash
sudo nixos-rebuild switch --option substituters "https://nix-community.cachix.org" --option trusted-public-keys "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
```

Pilih salah satu dari ketiga cara di atas untuk konfigurasi dan deployment. Setelah
deployment berhasil, semua paket berikutnya akan mengutamakan pencarian cache dari sumber
mirror dalam negeri.

> Jika hostname sistemmu bukan `my-nixos`, ubah nama `nixosConfigurations` dalam
> `flake.nix` atau gunakan `--flake /etc/nixos#my-nixos` untuk menentukan nama
> konfigurasi.

### Awalan `extra-` untuk Parameter Opsi Nix {#the-extra-prefix-for-nix-options-parameters}

Seperti disebutkan sebelumnya, `substituters` yang diatur dengan ketiga cara akan saling
menimpa. Namun, keadaan yang ideal seharusnya:

1. Pada tingkat sistem dalam `/etc/nix/nix.conf`, atur hanya `substituters` dan
   `trusted-public-keys` paling umum, seperti server cache resmi dan sumber mirror dalam
   negeri.
2. Dalam `flake.nix` setiap proyek flake, atur `substituters` dan `trusted-public-keys`
   khusus proyek tersebut, seperti server cache tidak resmi nix-community.
3. Saat membangun proyek flake, nix harus **menggabungkan** `substituters` dan
   `trusted-public-keys` yang diatur dalam `flake.nix` dan `/etc/nix/nix.conf`.

Nix menyediakan
[awalan `extra-`](https://nixos.org/manual/nix/stable/command-ref/conf-file.html?highlight=extra#file-format)
untuk mewujudkan fungsi **penggabungan** ini.

Menurut dokumentasi resmi, jika nilai parameter `xxx` berupa daftar, nilai `extra-xxx`
akan ditambahkan ke bagian akhir parameter `xxx`:

Dengan kata lain, kamu bisa memakainya seperti ini:

```nix{7,13,36-58}
{
  description = "My NixOS configuration";

  # the nixConfig here only affects the flake itself, not the system configuration!
  nixConfig = {
    # will be appended to the system-level substituters
    extra-substituters = [
      # nix community's cache server
      "https://nix-community.cachix.org"
    ];

    # will be appended to the system-level trusted-public-keys
    extra-trusted-public-keys = [
      # nix community's cache server public key
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";

    # omitting several configurations...
  };

  outputs = inputs@{
      self,
      nixpkgs,
      ...
  }: {
    nixosConfigurations = {
      my-nixos = nixpkgs.lib.nixosSystem {
        modules = [
          ./hardware-configuration.nix
          ./configuration.nix

          {
            # given the users in this list the right to specify additional substituters via:
            #    1. `nixConfig.substituters` in `flake.nix`
            nix.settings.trusted-users = [ "ryan" ];

            # the system-level substituters & trusted-public-keys
            nix.settings = {
              substituters = [
                # cache mirror located in China
                # status: https://mirror.sjtu.edu.cn/
                "https://mirror.sjtu.edu.cn/nix-channels/store"
                # status: https://mirrors.ustc.edu.cn/status/
                # "https://mirrors.ustc.edu.cn/nix-channels/store"

                "https://cache.nixos.org"
              ];

              trusted-public-keys = [
                # the default public key of cache.nixos.org, it's built-in, no need to add it here
                "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
              ];
            };
          }
          # omitting several configurations...
       ];
      };
    };
  };
}
```

## Mempercepat Unduhan Paket melalui Server Proxy {#accelerate-package-downloads-via-a-proxy-server}

> Dirujuk dari issue:
> [roaming laptop: network proxy configuration - NixOS/nixpkgs](https://github.com/NixOS/nixpkgs/issues/27535#issuecomment-1178444327)
> Meski sebelumnya disebutkan bahwa proxy transparan di router atau mesin lokal bisa
> sepenuhnya mengatasi unduhan paket NixOS yang lambat, konfigurasinya cukup merepotkan
> dan sering memerlukan perangkat keras tambahan.

Sebagian pengguna mungkin lebih suka langsung mempercepat unduhan paket dengan proxy
HTTP/Socks5 yang berjalan di mesinnya. Berikut cara mengaturnya. Cara seperti
`export HTTPS_PROXY=http://127.0.0.1:7890` di Terminal tidak akan berhasil. Pekerjaan
sebenarnya dilakukan oleh proses latar belakang bernama `nix-daemon`, bukan perintah yang
langsung dijalankan di Terminal.

Jika hanya perlu proxy sementara, kamu bisa menetapkan variabel lingkungan proxy dengan
perintah berikut:

```bash
# These files are under /run, so the following commands need root privileges.
sudo mkdir -p /run/systemd/system/nix-daemon.service.d/
sudo tee /run/systemd/system/nix-daemon.service.d/override.conf <<EOF
[Service]
Environment="https_proxy=socks5h://localhost:7891"
EOF
sudo systemctl daemon-reload
sudo systemctl restart nix-daemon
```

Setelah menerapkan konfigurasi ini, periksa apakah variabel lingkungannya sudah diatur
dengan menjalankan `sudo cat /proc/$(pidof nix-daemon)/environ | tr '\0' '\n'`.

Pengaturan dalam `/run/systemd/system/nix-daemon.service.d/override.conf` otomatis dihapus
saat sistem dimulai ulang. Atau, kamu bisa menghapusnya secara manual dan memulai ulang
layanan nix-daemon untuk memulihkan pengaturan awal.

Jika ingin menetapkan proxy secara permanen, sebaiknya simpan perintah-perintah tadi
sebagai skrip shell dan jalankan setiap kali sistem mulai. Sebagai alternatif, gunakan
proxy transparan, TUN, atau solusi proxy global lainnya.

> Ada juga orang di komunitas yang menetapkan proxy permanen untuk nix-daemon secara
> deklaratif dengan `systemd.services.nix-daemon.environment`. Namun, jika proxy
> bermasalah, keadaannya sangat merepotkan. Nix-daemon tidak akan bekerja dengan baik dan
> sebagian besar perintah Nix tidak berjalan semestinya. Terlebih lagi, konfigurasi
> systemd sendiri dilindungi agar hanya bisa dibaca, sehingga pengaturan proxy sulit
> diubah atau dihapus. Jadi, cara ini tidak disarankan.

> Saat memakai sebagian proxy komersial atau publik, kamu mungkin menemui kesalahan HTTP
> 403 ketika mengunduh dari GitHub (seperti dijelaskan dalam
> [nixos-and-flakes-book/issues/74](https://github.com/ryan4yin/nixos-and-flakes-book/issues/74)).
> Dalam kasus ini, coba ganti server proxy atau atur
> [access-tokens](https://github.com/NixOS/nix/issues/6536) untuk mengatasinya.
