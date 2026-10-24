# Penjelasan Konfigurasi `flake.nix` {#flake-nix-configuration-explained}

Sebelumnya, kita membuat berkas `flake.nix` untuk mengelola konfigurasi sistem, tetapi
strukturnya mungkin masih belum jelas. Mari bahas isi berkas ini secara terperinci.

<!-- prettier-ignore -->
## 1. Input Flake {#_1-flake-inputs}

Pertama, perhatikan atribut `inputs`. Ini adalah attribute set yang mendefinisikan semua
dependensi flake ini. Setelah diambil, dependensi tersebut akan diteruskan sebagai argumen
ke fungsi `outputs`:

```nix{2-5,7}
{
  inputs = {
    # NixOS official package source, using the nixos-26.05 branch here
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # Omitting previous configurations......
  };
}
```

Dependensi dalam `inputs` memiliki banyak jenis dan bentuk definisi. Dependensi bisa
berupa flake lain, repositori Git biasa, atau path lokal. Bagian
[Penggunaan Flakes Lainnya — Input Flake](../other-usage-of-flakes/inputs.md) menjelaskan
jenis dependensi yang umum dan definisinya secara terperinci.

Di sini kita hanya mendefinisikan dependensi bernama `nixpkgs`, dengan bentuk rujukan
paling umum dalam flake, yaitu `github:owner/name/reference`. `reference` di sini bisa
berupa nama branch, commit-id, atau tag.

Setelah `nixpkgs` didefinisikan dalam `inputs`, kamu bisa memakainya pada parameter fungsi
`outputs` berikutnya, persis seperti yang dilakukan contoh kita.

<!-- prettier-ignore -->
## 2. Output Flake {#_2-flake-outputs}

Sekarang, perhatikan `outputs`. Ini adalah fungsi yang menerima dependensi dari `inputs`
sebagai parameter dan mengembalikan attribute set yang mewakili hasil build flake:

Argumennya adalah isi `inputs` ditambah `self`, yaitu output flake itu sendiri. `...`
(elipsis) di bagian akhir berarti "abaikan atribut lain", sehingga kamu cukup menyebutkan
input yang benar-benar dipakai. `{ self, nixpkgs, ... }@inputs:` mengikat seluruh set
argumen ke `inputs`, yang berguna jika kamu ingin meneruskannya. Bentuk setaranya,
`inputs@{ self, nixpkgs, ... }:`, juga umum dipakai.

```nix{9-16}
{
  description = "A simple NixOS flake";

  inputs = {
    # NixOS official package source, here using the nixos-26.05 branch
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # The host with the hostname `my-nixos` will use this configuration
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      modules = [
        ./configuration.nix
      ];
    };
  };
}
```

Flakes bisa digunakan untuk berbagai tujuan dan memiliki beragam jenis output. Bagian
[Output Flake](../other-usage-of-flakes/outputs.md) memberikan pengantar yang lebih
terperinci. Di sini, kita hanya memakai jenis output `nixosConfigurations`, yang dipakai
untuk mengonfigurasi sistem NixOS.

Saat menjalankan `sudo nixos-rebuild switch`, perintah ini mencari atribut
`nixosConfigurations.my-nixos` dalam attribute set yang dikembalikan fungsi `outputs` pada
`/etc/nixos/flake.nix`. (`my-nixos` di sini adalah hostname sistem saat ini.) Definisi di
sana dipakai untuk mengonfigurasi sistem NixOS.

Sebenarnya, kita juga bisa menentukan lokasi flake dan nama konfigurasi NixOS sendiri,
alih-alih memakai nilai bawaan. Caranya dengan menambahkan parameter `--flake` ke perintah
`nixos-rebuild`. Contohnya:

```shell
sudo nixos-rebuild switch --flake /path/to/your/flake#your-hostname
```

Penjelasan singkat parameter `--flake /path/to/your/flake#your-hostname`:

1. `/path/to/your/flake` adalah lokasi flake tujuan. Path bawaannya adalah `/etc/nixos/`.
2. `#` adalah pemisah, dan `your-hostname` adalah nama konfigurasi NixOS. Secara bawaan,
   `nixos-rebuild` memakai hostname sistem saat ini sebagai nama konfigurasi yang dicari.

Kamu bahkan bisa langsung merujuk repositori GitHub jarak jauh sebagai sumber flake,
misalnya:

```shell
sudo nixos-rebuild switch --flake github:owner/repo#your-hostname
```

## 3. Parameter Khusus `self` pada Fungsi `outputs` {#special-parameter-self-of-outputs-function}

Meski belum dibahas sebelumnya, semua contoh kode pada bagian terdahulu memiliki satu
parameter khusus lagi dalam fungsi `outputs`. Di sini kita akan memperkenalkan tujuannya
secara singkat.

Penjelasannya dalam [nix flake - Nix Manual] adalah:

> Input khusus bernama `self` merujuk pada output dan pohon sumber flake ini.

Artinya, `self` adalah nilai kembalian fungsi `outputs` flake saat ini, sekaligus path ke
folder kode sumbernya (pohon sumber).

Kita belum memakai parameter `self` di sini, tetapi nanti kamu akan melihat penggunaannya
pada contoh yang lebih rumit (atau konfigurasi yang ditemukan di internet).

> Catatan: Kamu mungkin menemukan kode yang memakai `self.outputs` untuk merujuk output
> flake saat ini. Hal itu memang bisa dilakukan. Namun, Nix Manual tidak memberikan
> penjelasan tentangnya, dan ini dianggap sebagai detail implementasi internal flakes.
> Penggunaannya dalam kodemu sendiri tidak disarankan!

## 4. Pengantar Singkat Fungsi `nixpkgs.lib.nixosSystem` {#simple-introduction-to-nixpkgs-lib-nixos-system}

**Sebuah Flake bisa bergantung pada Flake lain untuk memanfaatkan fitur yang
disediakannya.**

Secara bawaan, flake mencari berkas `flake.nix` dalam direktori akar setiap dependensinya
(yaitu setiap item dalam `inputs`) dan mengevaluasi fungsi `outputs` masing-masing secara
malas. Attribute set yang dikembalikan fungsi-fungsi ini lalu diteruskan sebagai argumen
ke fungsi `outputs` miliknya sendiri. Dengan begitu, kita bisa memakai fitur flake lain
dalam flake saat ini.

Lebih tepatnya, evaluasi fungsi `outputs` setiap dependensi bersifat malas. Artinya,
fungsi `outputs` sebuah flake hanya dievaluasi saat benar-benar dipakai, sehingga
menghindari perhitungan yang tidak perlu dan meningkatkan efisiensi.

Penjelasan tadi mungkin agak membingungkan. Mari lihat prosesnya melalui contoh
`flake.nix` yang dipakai di bagian ini. `flake.nix` kita mendeklarasikan dependensi
`inputs.nixpkgs`, sehingga [nixpkgs/flake.nix] akan dievaluasi ketika kita menjalankan
`sudo nixos-rebuild switch`.

Dari kode sumber repositori Nixpkgs, kita bisa melihat bahwa definisi output flake-nya
mencakup atribut `lib`. Dalam contoh kita, fungsi `nixosSystem` pada atribut `lib` dipakai
untuk mengonfigurasi sistem NixOS:

```nix{8-13}
{
  inputs = {
    # NixOS official package source, here using the nixos-26.05 branch
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      # system = "x86_64-linux";
      modules = [
        ./configuration.nix
      ];
    };
  };
}
```

Attribute set setelah `nixpkgs.lib.nixosSystem` merupakan satu-satunya argumen fungsi ini,
yang memuat semua parameter konfigurasi. Di sini, kita hanya memberikan dua:

- `system`: Alias lama untuk `nixpkgs.hostPlatform` yang menentukan platform tempat mesin
  berjalan.  
  Karena `hardware-configuration.nix` yang dihasilkan (diimpor oleh `configuration.nix`)
  sudah mendefinisikan nilai ini, biasanya kamu bisa menghilangkannya di sini.
- `modules`: Daftar modul tempat konfigurasi sistem NixOS yang sebenarnya didefinisikan.
  Berkas konfigurasi `/etc/nixos/configuration.nix` sendiri merupakan Modul Nixpkgs,
  sehingga bisa langsung ditambahkan ke daftar `modules` untuk dipakai.

Pemahaman dasar ini cukup bagi pemula. Untuk mendalami fungsi `nixpkgs.lib.nixosSystem`,
kamu perlu memahami sistem modul Nixpkgs. Pembaca yang telah menyelesaikan bagian
[Memodulkan Konfigurasi NixOS](./modularize-the-configuration.md) bisa kembali ke
[nixpkgs/flake.nix] untuk menemukan definisi `nixpkgs.lib.nixosSystem`, menelusuri kode
sumbernya, dan mempelajari implementasinya.

[nix flake - Nix Manual]:
  https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake#flake-inputs
[nixpkgs/flake.nix]: https://github.com/NixOS/nixpkgs/tree/nixos-26.05/flake.nix
