# Overriding {#overriding}

Dalam Nix, kamu bisa menyesuaikan paket Nix dalam `pkgs` dengan fungsi `override`. Fungsi
ini memungkinkanmu menentukan parameter build kustom dan mengembalikan derivation baru
dengan nilai yang ditimpa. Mari lihat contohnya:

```nix
pkgs.fcitx5-rime.override { rimeDataPkgs = [ ./rime-data-flypy ]; }
```

Pada contoh di atas, kita menimpa parameter `rimeDataPkgs` pada derivation `fcitx5-rime`
agar memakai paket kustom bernama `rime-data-flypy`. Ini membuat derivation baru dengan
`rimeDataPkgs` yang ditimpa, sementara parameter lain tetap sama.

Untuk mengetahui parameter mana pada suatu paket yang bisa ditimpa, ada beberapa cara:

1. Periksa kode sumber paket dalam repositori Nixpkgs di GitHub, misalnya
   [`fcitx5-rime.nix`](https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix).
   Pastikan memilih branch yang sesuai, misalnya `nixos-unstable` jika kamu memakai branch
   tersebut.
2. Gunakan perintah `nix edit nixpkgs#fcitx5-rime`. Ini membuka kode sumber paket dalam
   editor bawaanmu, tempat kamu bisa melihat semua parameter paket itu.

Dengan cara-cara ini, kamu bisa menemukan parameter input paket dan menentukan mana yang
bisa diubah dengan `override`.

Misalnya, paket `fcitx5-rime` memiliki parameter input berikut, yang semuanya bisa diubah
dengan `override`:

```nix
{ lib, stdenv
, fetchFromGitHub
, pkg-config
, cmake
, extra-cmake-modules
, gettext
, fcitx5
, librime
, rime-data
, symlinkJoin
, rimeDataPkgs ? [ rime-data ]
}:

stdenv.mkDerivation rec {
  # ......
}
```

Sebagai contoh, mari lihat kode sumber [pkgs.hello]:

```nix
{ callPackage
, lib
, stdenv
, fetchurl
, nixos
, testers
, hello
}:

stdenv.mkDerivation (finalAttrs: {
  pname = "hello";
  version = "2.12.3";

  src = fetchurl {
    url = "mirror://gnu/hello/hello-${finalAttrs.version}.tar.gz";
    sha256 = "sha256-DV9gFUOC/uELEUocNOeF2LH0kgc64tOm97FHaHs2aqA=";
  };

  doCheck = true;

  # ...
})
```

Dalam contoh ini, atribut `pname`, `version`, `src`, dan `doCheck` semuanya bisa ditimpa
dengan `overrideAttrs`. Misalnya:

```nix
helloWithDebug = pkgs.hello.overrideAttrs (finalAttrs: previousAttrs: {
  doCheck = false;
});
```

Pada kode di atas, kita memakai `overrideAttrs` untuk menimpa atribut `doCheck`, sementara
atribut lain tetap sama.

Kamu juga bisa menimpa beberapa atribut bawaan yang didefinisikan dalam
`stdenv.mkDerivation` dengan `overrideAttrs`. Misalnya:

```nix
helloWithDebug = pkgs.hello.overrideAttrs (finalAttrs: previousAttrs: {
  separateDebugInfo = true;
});
```

Dalam kasus ini, kita menimpa atribut `separateDebugInfo`, yang didefinisikan dalam
`stdenv.mkDerivation`, bukan dalam kode sumber `hello`.

Untuk melihat semua atribut yang didefinisikan dalam `stdenv.mkDerivation`, kamu bisa
memeriksa kode sumbernya dengan `nix repl -f '<nixpkgs>'`, lalu memasukkan
`:e stdenv.mkDerivation`.

Ini akan membuka kode sumber dalam editor bawaanmu. Jika baru memakai `nix repl`, ketik
`:?` untuk melihat informasi bantuan.

## Rujukan {#references}

- [Chapter 4. Overriding - nixpkgs Manual](https://nixos.org/manual/nixpkgs/stable/#chap-overrides)

[pkgs.hello]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/by-name/he/hello/package.nix
