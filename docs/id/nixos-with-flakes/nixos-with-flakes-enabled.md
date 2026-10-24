# Mengaktifkan NixOS dengan Flakes {#enabling-nixos-with-flakes}

Dibandingkan cara konfigurasi bawaan NixOS saat ini, Flakes menawarkan reproduksibilitas
yang lebih baik. Definisi struktur paketnya jelas dan secara bawaan mendukung dependensi
pada repositori Git lain, sehingga memudahkan berbagi kode. Karena itu, buku ini
menyarankan penggunaan Flakes untuk mengelola konfigurasi sistem.

Bagian ini menjelaskan cara memakai Flakes untuk mengelola konfigurasi sistem NixOS.
**Kamu tidak perlu tahu apa pun tentang Flakes sebelumnya**.

## Mengaktifkan Dukungan Flakes pada NixOS {#enable-nix-flakes}

Saat ini, Flakes masih merupakan fitur eksperimental dan belum aktif secara bawaan. Kita
perlu menyunting berkas `/etc/nixos/configuration.nix` secara manual untuk mengaktifkan
fitur Flakes beserta alat baris perintah nix yang baru:

```nix{12,16}
{ config, pkgs, ... }:

{
  imports = [
    # Include the results of the hardware scan.
    ./hardware-configuration.nix
  ];

  # ......

  # Enable the Flakes feature and the accompanying new nix command-line tool
  nix.settings.experimental-features = [ "nix-command" "flakes" ];
  environment.systemPackages = with pkgs; [
    # Flakes clones its dependencies through the git command,
    # so git must be installed first
    git
    vim
    wget
  ];
  # Set the default editor to vim
  environment.variables.EDITOR = "vim";

  # ......
}
```

Setelah membuat perubahan ini, jalankan `sudo nixos-rebuild switch` untuk menerapkannya.
Setelah itu, kamu bisa memakai fitur Flakes untuk mengelola konfigurasi sistem.

Alat baris perintah nix yang baru juga menawarkan beberapa fitur praktis. Misalnya, kini
kamu bisa memakai perintah `nix repl` untuk membuka lingkungan interaktif nix. Jika
tertarik, kamu bisa memakainya untuk mengulang dan menguji semua sintaks Nix yang sudah
dipelajari.

## Memindahkan Konfigurasi Sistem ke `flake.nix` {#switch-to-flake-nix}

Setelah fitur Flakes diaktifkan, perintah `sudo nixos-rebuild switch` akan mengutamakan
pembacaan berkas `/etc/nixos/flake.nix`. Jika tidak ditemukan, perintah ini akan mencoba
memakai `/etc/nixos/configuration.nix`.

Kamu bisa mulai belajar menulis flake dengan templat resmi. Pertama, periksa templat yang
tersedia:

```bash
nix flake show templates
```

Di antaranya, templat `templates#full` memperlihatkan semua kemungkinan penggunaan.
`nix flake init` menulis `flake.nix` ke direktori saat ini. Jadi, jalankan di direktori
sementara agar berkasmu sendiri tidak tertimpa:

```bash
mkdir /tmp/flake-demo && cd /tmp/flake-demo
nix flake init -t templates#full
cat flake.nix
```

Dengan merujuk templat ini, buat berkas `/etc/nixos/flake.nix` dan tulis isi
konfigurasinya. Semua perubahan sistem berikutnya akan ditangani oleh Nix Flakes. Berikut
contoh isinya:

```nix{15}
{
  description = "A simple NixOS flake";

  inputs = {
    # NixOS official package source, using the nixos-26.05 branch here
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # Please replace my-nixos with your hostname
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      modules = [
        # Import the previous configuration.nix we used,
        # so the old configuration file still takes effect
        ./configuration.nix
      ];
    };
  };
}
```

Di sini kita mendefinisikan sistem bernama `my-nixos`, dengan berkas konfigurasi
`./configuration.nix` yang berada di `/etc/nixos/`. Artinya, kita masih memakai
konfigurasi lama.

Sekarang, saat menjalankan `sudo nixos-rebuild switch` untuk menerapkan konfigurasi,
sistem semestinya sama sekali tidak berubah. Kita hanya beralih ke Nix Flakes, sementara
isi konfigurasinya tetap sama seperti sebelumnya.

> Jika hostname sistemmu bukan `my-nixos`, ubah nama `nixosConfigurations` di `flake.nix`,
> atau gunakan `--flake /etc/nixos#my-nixos` untuk menentukan nama konfigurasinya.

Setelah beralih, kita bisa mengelola sistem melalui fitur Flakes.

Saat ini, flake kita mencakup berkas-berkas berikut:

- `/etc/nixos/flake.nix`: Titik masuk flake, yang dikenali dan diterapkan ketika
  `sudo nixos-rebuild switch` dijalankan.
- `/etc/nixos/flake.lock`: Berkas pengunci versi yang dihasilkan otomatis. Berkas ini
  mencatat sumber data, nilai hash, dan nomor versi semua input dalam keseluruhan flake,
  sehingga memastikan reproduksibilitas sistem.
- `/etc/nixos/configuration.nix`: Berkas konfigurasi kita sebelumnya, yang diimpor sebagai
  modul dalam `flake.nix`. Saat ini, seluruh konfigurasi sistem ditulis dalam berkas ini.
- `/etc/nixos/hardware-configuration.nix`: Berkas konfigurasi perangkat keras sistem,
  dihasilkan oleh NixOS, yang menggambarkan informasi perangkat keras sistem.

## Penutup {#conclusion}

Sampai di sini, kita hanya menambahkan berkas konfigurasi yang sangat sederhana,
`/etc/nixos/flake.nix`. Berkas ini sekadar pembungkus tipis bagi
`/etc/nixos/configuration.nix`, tanpa menawarkan fungsi baru ataupun membawa perubahan
yang mengganggu.

Pada bagian-bagian buku selanjutnya, kita akan mempelajari struktur dan fungsi
`flake.nix`, lalu perlahan melihat manfaat yang bisa diberikan pembungkus semacam ini.

> Catatan: Cara pengelolaan konfigurasi yang dijelaskan dalam buku ini BUKAN "Semuanya
> dalam satu berkas". Sebaiknya kelompokkan konfigurasi ke dalam beberapa berkas nix, lalu
> masukkan berkas-berkas ini dalam daftar `modules` pada `flake.nix`, dan kelola dengan
> Git.
>
> Pendekatan ini membuat berkas konfigurasi lebih tertata dan konfigurasinya lebih mudah
> dipelihara. Bagian [Memodulkan Konfigurasi NixOS](./modularize-the-configuration.md)
> akan menjelaskan secara terperinci cara memodulkan konfigurasi NixOS, dan
> [Kiat Berguna Lainnya — Mengelola Konfigurasi NixOS dengan Git](./other-useful-tips.md)
> akan memperkenalkan beberapa praktik terbaik untuk mengelola konfigurasi NixOS dengan
> Git.
