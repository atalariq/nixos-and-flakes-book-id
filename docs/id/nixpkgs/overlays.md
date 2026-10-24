# Overlays {#overlays}

Pada bagian sebelumnya, kita belajar menimpa derivation dengan `pkgs.xxx.override { ... }`
atau `pkgs.xxx.overrideAttrs (finalAttrs: previousAttrs: { ... });`. Namun, pendekatan ini
menghasilkan derivation baru dan tidak mengubah derivation asli dalam instans `pkgs`. Jika
derivation yang ingin ditimpa juga dipakai paket Nix lain, paket-paket tersebut tetap
memakai derivation yang belum diubah.

Untuk mengubah derivation secara global dalam instans nixpkgs bawaan, Nix menyediakan
fitur bernama "overlays".

Dalam lingkungan Nix tradisional, overlay bisa dikonfigurasi secara global melalui berkas
`~/.config/nixpkgs/overlays.nix` atau `~/.config/nixpkgs/overlays/*.nix`. Namun, dengan
fitur Flakes, overlay tidak boleh bergantung pada konfigurasi di luar repositori Git agar
reproduksibilitas sistem terjamin.

Saat memakai `flake.nix` untuk mengonfigurasi NixOS, baik Home Manager maupun NixOS
menyediakan opsi `nixpkgs.overlays` untuk mendefinisikan overlay. Kamu bisa merujuk
dokumentasi berikut untuk rinciannya:

- [Home Manager docs - `nixpkgs.overlays`](https://nix-community.github.io/home-manager/options.xhtml#opt-nixpkgs.overlays)
- [Nixpkgs source code - `nixpkgs.overlays`](https://github.com/NixOS/nixpkgs/blob/30d7dd7e7f2cba9c105a6906ae2c9ed419e02f17/nixos/modules/misc/nixpkgs.nix#L169)

Mari lihat contoh modul yang memuat overlay. Modul ini bisa dipakai sebagai modul Home
Manager atau modul NixOS, karena definisinya sama:

```nix
# ./overlays/default.nix
{ config, pkgs, lib, ... }:

{
  nixpkgs.overlays = [
    # Overlay 1: Use `self` and `super` to express
    # the inheritance relationship
    (self: super: {
      google-chrome = super.google-chrome.override {
        commandLineArgs =
          "--proxy-server='https=127.0.0.1:3128;http=127.0.0.1:3128'";
      };
    })

    # Overlay 2: Use `final` and `prev` to express
    # the relationship between the new and the old
    (final: prev: {
      steam = prev.steam.override {
        extraPkgs = pkgs: with pkgs; [
          keyutils
          libkrb5
          libpng
          libpulseaudio
          libvorbis
          stdenv.cc.cc.lib
          xorg.libXcursor
          xorg.libXi
          xorg.libXinerama
          xorg.libXScrnSaver
        ];
        extraProfile = "export GDK_SCALE=2";
      };
    })

    # Overlay 3: Define overlays in other files
    # The content of ./overlays/overlay3/default.nix is the same as above:
    # `(final: prev: { xxx = prev.xxx.override { ... }; })`
    (import ./overlay3)
  ];
}
```

Pada contoh di atas, kita mendefinisikan tiga overlay.

1. Overlay 1 mengubah derivation `google-chrome` dengan menambahkan argumen baris perintah
   untuk server proxy.
2. Overlay 2 mengubah derivation `steam` dengan menambahkan paket dan variabel lingkungan.
3. Overlay 3 didefinisikan dalam berkas terpisah `./overlays/overlay3/default.nix`.

Berikut contoh mengimpor konfigurasi di atas sebagai modul NixOS:

```nix
# ./flake.nix
{
  inputs = {
    # ...
  };

  outputs = inputs@{ nixpkgs, ... }: {
    nixosConfigurations = {
      my-nixos = nixpkgs.lib.nixosSystem {
        modules = [
          ./configuration.nix

          # import the module that contains overlays
          (import ./overlays)
        ];
      };
    };
  };
}
```

Ini hanya contoh. Tulislah overlay sendiri sesuai kebutuhanmu.

## Beberapa Instans nixpkgs dengan Overlay Berbeda {#multiple-nixpkgs-instances-with-different-overlays}

`nixpkgs.overlays = [...];` yang disebutkan di atas langsung mengubah instans nixpkgs
global, `pkgs`. Jika overlay mengubah beberapa paket tingkat rendah, modul lain mungkin
terpengaruh. Salah satu dampak buruknya adalah peningkatan kompilasi lokal (karena cache
tidak lagi valid), dan mungkin juga gangguan fungsi paket yang terdampak.

Jika ingin memakai overlay hanya di lokasi tertentu tanpa memengaruhi instans nixpkgs
bawaan, kamu bisa membuat instans nixpkgs baru dan menerapkan overlay padanya. Caranya
akan kita bahas pada bagian berikutnya,
[Pemanfaatan Cerdik Beberapa Instans nixpkgs](./multiple-nixpkgs.md).

## Rujukan {#references}

- [Chapter 3. Overlays - nixpkgs Manual](https://nixos.org/manual/nixpkgs/stable/#chap-overlays)
