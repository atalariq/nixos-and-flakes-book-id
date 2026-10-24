# NIX_PATH dan Flake Registry Kustom {#custom-nix-path-and-flake-registry}

## Pengantar NIX_PATH {#nix-path-introduction}

Path pencarian Nix dikendalikan oleh variabel lingkungan `NIX_PATH`. Formatnya sama dengan
variabel lingkungan Linux `PATH`, berupa beberapa path yang dipisahkan titik dua.

Path dalam ekspresi Nix yang berbentuk `<name>` diselesaikan menggunakan path bernama
`name` dari `NIX_PATH`.

Pola penggunaan ini tidak lagi disarankan dengan fitur Flakes. Build Flake menjadi
bergantung pada variabel lingkungan `NIX_PATH` yang bisa berubah, sehingga mengganggu
reproduksibilitas.

Namun, dalam keadaan tertentu kita masih perlu memakai `NIX_PATH`. Misalnya, saat sering
memakai perintah `nix repl -f '<nixpkgs>'`, yang menggunakan Nixpkgs hasil pencarian
melalui `NIX_PATH`.

## Pengantar Flakes Registry {#flakes-registry-introduction}

Flakes Registry adalah pusat pendaftaran Flake yang membantu kita memakai ID singkat
sebagai pengganti alamat repositori flake yang panjang dalam perintah seperti `nix run`,
`nix shell`, dan lainnya.

Secara bawaan, Nix mencari alamat repositori GitHub yang sesuai dengan ID ini di
<https://github.com/NixOS/flake-registry/blob/master/flake-registry.json>.

Misalnya, jika kita menjalankan `nix run nixpkgs#ponysay hello`, Nix otomatis mengambil
alamat repositori GitHub untuk `nixpkgs` dari berkas JSON tersebut. Repositori lalu
diunduh, `flake.nix` di dalamnya dicari, dan paket `ponysay` yang bersesuaian dijalankan.

## NIX_PATH dan Flake Registry Kustom {#custom-nix-path-and-flake-registry-1}

> **CATATAN: Pemula sebaiknya melewati bagian ini! Menonaktifkan `nix-channel` dengan cara
> yang keliru bisa merepotkan.**

Peran `NIX_PATH` dan Flake Registry sudah dijelaskan sebelumnya. Dalam penggunaan
sehari-hari, biasanya kita ingin `nixpkgs` dalam perintah seperti
`nix repl -f '<nixpkgs>'` dan `nix run nixpkgs#ponysay hello` cocok dengan `nixpkgs`
sistem. Ini sudah menjadi perilaku bawaan sejak [NixOS 24.05][automatic flake registry].
Selain itu, meski `nix-channel` bisa dipakai bersamaan dengan fitur Flakes, dalam
praktiknya Flakes bisa menggantikannya sepenuhnya. Jadi, kita juga bisa menonaktifkannya.

[automatic flake registry]: https://github.com/NixOS/nixpkgs/pull/254405

Tambahkan modul berikut ke konfigurasi NixOS untuk memenuhi kebutuhan tadi:

```nix
{ nixpkgs, ... }: {
  nix.channel.enable = false; # remove nix-channel related tools & configs, we use flakes instead.

  # this is set automatically by nixpkgs.lib.nixosSystem but might be required
  # if one is not using that:
  # nixpkgs.flake.source = nixpkgs;
}
```

## Rujukan {#references}

- [Chapter 15. Nix Search Paths - Nix Pills](https://nixos.org/guides/nix-pills/nix-search-paths.html)
