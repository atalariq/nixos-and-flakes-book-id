# `pkgs.callPackage` {#pkgs-callpackage}

`pkgs.callPackage` dipakai untuk memberikan parameter pada pembentukan Derivation Nix.
Untuk memahami tujuannya, mari terlebih dahulu lihat cara mendefinisikan paket Nix (juga
dikenal sebagai Derivation) tanpa `pkgs.callPackage`.

<!-- prettier-ignore -->
## 1. Tanpa `pkgs.callPackage` {#_1-without-pkgs-callpackage}

Kita bisa mendefinisikan paket Nix dengan kode seperti ini:

```nix
pkgs.writeShellScriptBin "hello" ''echo "hello, ryan!"''
```

Untuk memastikannya, kamu bisa memakai `nix repl`. Hasilnya memang sebuah Derivation:

```shell
› nix repl -f '<nixpkgs>'
Welcome to Nix 2.13.5. Type :? for help.

Loading installable ''...
Added 19203 variables.

nix-repl> pkgs.writeShellScriptBin "hello" '' echo "hello, xxx!" ''
«derivation /nix/store/zhgar12vfhbajbchj36vbbl3mg6762s8-hello.drv»
```

Meski definisi Derivation ini cukup ringkas, sebagian besar Derivation dalam nixpkgs jauh
lebih rumit. Di bagian sebelumnya, kita memperkenalkan dan banyak memakai cara
`import xxx.nix` untuk mengimpor ekspresi Nix dari berkas Nix lain. Ini bisa membuat kode
lebih mudah dipelihara.

1. Agar lebih mudah dipelihara, kamu bisa menyimpan definisi Derivation dalam berkas
   terpisah, misalnya `hello.nix`.
   1. Namun, konteks dalam `hello.nix` sendiri tidak memuat variabel `pkgs`. Jadi, isinya
      perlu diubah agar `pkgs` diteruskan sebagai parameter ke `hello.nix`.
2. Di tempat yang memerlukan Derivation ini, kamu bisa memakai `import ./hello.nix pkgs`
   untuk mengimpor `hello.nix` dan menjalankan fungsi di dalamnya dengan `pkgs` sebagai
   parameter.

Mari lanjutkan pemeriksaan dengan `nix repl`. Hasilnya masih berupa Derivation:

```shell
› cat hello.nix
pkgs:
  pkgs.writeShellScriptBin "hello" '' echo "hello, xxx!" ''

› nix repl -f '<nixpkgs>'
Welcome to Nix 2.13.5. Type :? for help.

warning: Nix search path entry '/nix/var/nix/profiles/per-user/root/channels' does not exist, ignoring
Loading installable ''...
Added 19203 variables.

nix-repl> import ./hello.nix pkgs
«derivation /nix/store/zhgar12vfhbajbchj36vbbl3mg6762s8-hello.drv»
```

<!-- prettier-ignore -->
## 2. Memakai `pkgs.callPackage` {#_2-using-pkgs-callpackage}

Pada contoh sebelumnya tanpa `pkgs.callPackage`, kita langsung meneruskan `pkgs` sebagai
parameter ke `hello.nix`. Namun, pendekatan ini punya beberapa kekurangan:

1. Semua dependensi lain dari Derivation `hello` terikat erat dengan `pkgs`.
   1. Jika memerlukan dependensi kustom, kita harus mengubah `pkgs` atau isi `hello.nix`,
      yang bisa merepotkan.
2. Jika `hello.nix` menjadi rumit, sulit menentukan Derivation mana dari `pkgs` yang
   menjadi dependensinya. Ini mempersulit analisis dependensi antar-Derivation.

`pkgs.callPackage`, sebagai alat pemberi parameter pada pembentukan Derivation, mengatasi
masalah ini. Mari lihat kode sumber dan komentarnya di
[nixpkgs/lib/customisation.nix#L101-L121](https://github.com/NixOS/nixpkgs/blob/fe138d3/lib/customisation.nix#L101-L121):

```nix
  /* Call the package function in the file `fn` with the required
    arguments automatically.  The function is called with the
    arguments `args`, but any missing arguments are obtained from
    `autoArgs`.  This function is intended to be partially
    parameterised, e.g.,

      callPackage = callPackageWith pkgs;
      pkgs = {
        libfoo = callPackage ./foo.nix { };
        libbar = callPackage ./bar.nix { };
      };

    If the `libbar` function expects an argument named `libfoo`, it is
    automatically passed as an argument.  Overrides or missing
    arguments can be supplied in `args`, e.g.

      libbar = callPackage ./bar.nix {
        libfoo = null;
        enableX11 = true;
      };
  */
  callPackageWith = autoArgs: fn: args:
    let
      f = if lib.isFunction fn then fn else import fn;
      fargs = lib.functionArgs f;

      # All arguments that will be passed to the function
      # This includes automatic ones and ones passed explicitly
      allArgs = builtins.intersectAttrs fargs autoArgs // args;

    # ......
```

Pada dasarnya, `pkgs.callPackage` dipakai sebagai `pkgs.callPackage fn args`, dengan `fn`
sebagai berkas atau fungsi Nix, dan `args` sebagai attribute set. Cara kerjanya:

1. `pkgs.callPackage fn args` terlebih dahulu memeriksa apakah `fn` berupa fungsi atau
   berkas. Jika berupa berkas, fungsi yang didefinisikan di dalamnya diimpor.
   1. Setelah langkah ini, kamu memperoleh fungsi, biasanya dengan parameter seperti
      `lib`, `stdenv`, `fetchurl`, dan mungkin beberapa parameter kustom.
2. Berikutnya, `pkgs.callPackage fn args` menggabungkan `args` dengan attribute set
   `pkgs`. Jika ada konflik, parameter dalam `args` akan menimpa parameter dalam `pkgs`.
3. Lalu, `pkgs.callPackage fn args` mengambil parameter fungsi `fn` dari attribute set
   gabungan tersebut dan memakainya untuk menjalankan fungsi.
4. Hasil eksekusi fungsi adalah sebuah Derivation, yaitu paket Nix.

Seperti apa bentuk berkas atau fungsi Nix yang menjadi argumen `pkgs.callPackage`? Kamu
bisa memeriksa contoh yang sudah kita pakai dalam
[Penggunaan Lanjutan Nixpkgs — Pengantar](./intro.md): `hello.nix`, `fcitx5-rime.nix`,
`vscode/with-extensions.nix`, dan `firefox/common.nix`. Semuanya bisa diimpor dengan
`pkgs.callPackage`.

Misalnya, kamu mendefinisikan konfigurasi kernel NixOS kustom dalam `kernel.nix`, dengan
nama branch pengembangan dan kode sumber kernel yang bisa dikonfigurasi:

```nix
{
  lib,
  stdenv,
  linuxManualConfig,

  src,
  boardName,
  ...
}:
(linuxManualConfig {
  version = "5.10.113-thead-1520";
  modDirVersion = "5.10.113";

  inherit src lib stdenv;

  # file path to the generated kernel config file(the `.config` generated by make menuconfig)
  #
  # here is a special usage to generate a file path from a string
  configfile = ./. + "${boardName}_config";

  allowImportFromDerivation = true;
})
```

Kamu bisa memakai `pkgs.callPackage ./hello.nix {}` dalam modul Nix mana pun untuk
mengimpor dan memakainya, serta mengganti parameter mana pun sesuai kebutuhan:

```nix
{ lib, pkgs, pkgsKernel, kernel-src, ... }:

{
  # ......

  boot = {
    # ......
    kernelPackages = pkgs.linuxPackagesFor (pkgs.callPackage ./pkgs/kernel {
        src = kernel-src;  # kernel source is passed as a `specialArgs` and injected into this module.
        boardName = "licheepi4a";  # the board name, used to generate the kernel config file path.
    });

  # ......
}
```

Seperti terlihat di atas, dengan `pkgs.callPackage`, kamu bisa meneruskan `src` dan
`boardName` berbeda ke fungsi dalam `kernel.nix` untuk menghasilkan paket kernel berbeda.
Ini memungkinkan `kernel.nix` yang sama disesuaikan untuk kode sumber kernel dan papan
pengembangan yang berbeda.

Keunggulan `pkgs.callPackage`:

1. Definisi Derivation memiliki parameter, dan semua dependensinya adalah parameter fungsi
   dalam definisinya. Ini memudahkan analisis dependensi antar-Derivation.
2. Semua dependensi dan parameter kustom lain dari Derivation mudah diganti melalui
   parameter kedua `pkgs.callPackage`, sehingga Derivation jauh lebih mudah dipakai ulang.
3. Kedua kemampuan di atas tercapai tanpa menambah kerumitan kode, karena semua dependensi
   dalam `pkgs` bisa disuntikkan otomatis.

Jadi, penggunaan `pkgs.callPackage` untuk mendefinisikan Derivation selalu disarankan.

## Rujukan {#references}

- [Chapter 13. Callpackage Design Pattern - Nix Pills](https://nixos.org/guides/nix-pills/callpackage-design-pattern.html)
- [callPackage, a tool for the lazy - The Summer of Nix](https://summer.nixos.org/blog/callpackage-a-tool-for-the-lazy/)
- [Document what callPackage does and its preconditions - Nixpkgs Issues](https://github.com/NixOS/nixpkgs/issues/36354)
