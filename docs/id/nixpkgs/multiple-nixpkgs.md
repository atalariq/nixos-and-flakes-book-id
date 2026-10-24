# Pemanfaatan Cerdik Beberapa Instans nixpkgs {#the-ingenious-uses-of-multiple-nixpkgs-instances}

Pada bagian
[Menurunkan atau Menaikkan Versi Paket](../nixos-with-flakes/downgrade-or-upgrade-packages.md),
kita sudah melihat cara membuat beberapa instans nixpkgs berbeda melalui
`import nixpkgs {...}`, lalu memakainya dalam submodul mana pun melalui `specialArgs`.
Teknik ini punya banyak kegunaan. Beberapa yang umum di antaranya:

1. Membuat instans nixpkgs dengan commit ID berbeda untuk memasang berbagai versi paket
   perangkat lunak. Pendekatan ini dipakai pada bagian
   [Menurunkan atau Menaikkan Versi Paket](../nixos-with-flakes/downgrade-or-upgrade-packages.md)
   sebelumnya.

2. Jika ingin memakai overlay tanpa memengaruhi instans nixpkgs bawaan, kamu bisa membuat
   instans nixpkgs baru dan menerapkan overlay padanya.
   - `nixpkgs.overlays = [...];` yang disebutkan pada bagian Overlays sebelumnya langsung
     mengubah instans nixpkgs global. Jika overlay mengubah beberapa paket tingkat rendah,
     modul lain mungkin terpengaruh. Salah satu dampak buruknya adalah peningkatan
     kompilasi lokal (karena cache tidak lagi valid), dan mungkin juga gangguan fungsi
     paket yang terdampak.

3. Dalam kompilasi lintas arsitektur sistem, kamu bisa membuat beberapa instans nixpkgs
   untuk memilih penggunaan simulasi QEMU bagi kompilasi dan kompilasi silang di lokasi
   berbeda, atau menambahkan beragam parameter kompilasi GCC.

Jadi, membuat beberapa instans nixpkgs sangat menguntungkan.

## Membuat Instans `nixpkgs` {#instantiating-nixpkgs}

Mari pahami terlebih dahulu cara membuat instans nixpkgs nonglobal. Sintaks yang paling
umum adalah sebagai berikut:

```nix
{
  # a simple example
  pkgs-xxx = import nixpkgs {
    # as we said before, `system` or `localSystem` is required here.
    system = "x86_64-linux";
  };

  # nixpkgs with custom overlays
  pkgs-yyy = import nixpkgs {
    system = "x86_64-linux";

    overlays = [
      (self: super: {
        google-chrome = super.google-chrome.override {
          commandLineArgs =
            "--proxy-server='https=127.0.0.1:3128;http=127.0.0.1:3128'";
        };
        # ... other overlays
      })
    ];
  };

  # a more complex example (cross-compiling)
  pkgs-zzz = import nixpkgs {
    localSystem = "x86_64-linux";
    crossSystem = {
      config = "riscv64-unknown-linux-gnu";

      # https://wiki.nixos.org/wiki/Build_flags
      # this option equals to adding `-march=rv64gc` to CFLAGS.
      # CFLAGS will be used as the command line arguments for gcc/clang.
      gcc.arch = "rv64gc";
      # equivalent to `-mabi=lp64d` in CFLAGS.
      gcc.abi = "lp64d";
    };

    overlays = [
      (self: super: {
        google-chrome = super.google-chrome.override {
          commandLineArgs =
            "--proxy-server='https=127.0.0.1:3128;http=127.0.0.1:3128'";
        };
        # ... other overlays
      })
    ];
  };
}
```

Dari pembelajaran sintaks Nix, kita sudah mengetahui:

> Ekspresi `import` menerima path ke berkas Nix lain sebagai argumen dan mengembalikan
> hasil eksekusi berkas tersebut. Jika argumennya berupa path folder, hasil yang
> dikembalikan adalah hasil eksekusi berkas `default.nix` dalam folder itu.

`nixpkgs` adalah flake dengan berkas `default.nix` di direktori akarnya. Jadi,
`import nixpkgs` pada dasarnya mengembalikan hasil eksekusi [nixpkgs/default.nix]. Dari
berkas ini, kamu bisa menemukan bahwa implementasi `import nixpkgs` berada dalam
[pkgs/top-level/impure.nix], dengan cuplikan berikut:

```nix
# ... skipping some lines

{ # We put legacy `system` into `localSystem` if `localSystem` was not passed.
  # If neither is passed, assume we are building packages on the current
  # (build, in GNU Autotools parlance) platform.
  localSystem ? { system = args.system or builtins.currentSystem; }

# These are needed only because nix's `--arg` command-line logic doesn't work
# with unnamed parameters allowed by ...
, system ? localSystem.system
, crossSystem ? localSystem

, # Fallback: The contents of the configuration file found at $NIXPKGS_CONFIG or
  # $HOME/.config/nixpkgs/config.nix.
  config ? let
  # ... skipping some lines

, # Overlays are used to extend Nixpkgs collection with additional
  # collections of packages.  These collection of packages are part of the
  # fix-point made by Nixpkgs.
  overlays ? let
  # ... skipping some lines

, crossOverlays ? []

, ...
} @ args:

# If `localSystem` was explicitly passed, legacy `system` should
# not be passed, and vice versa.
assert args ? localSystem -> !(args ? system);
assert args ? system -> !(args ? localSystem);

import ./. (builtins.removeAttrs args [ "system" ] // {
  inherit config overlays localSystem;
})
```

Dengan demikian, `import nixpkgs {...}` sebenarnya memanggil fungsi ini, dan attribute set
setelahnya menjadi argumen fungsi tersebut.

## Hal yang Perlu Diperhatikan {#considerations}

Saat membuat beberapa instans nixpkgs, ada detail yang perlu diperhatikan. Berikut
beberapa masalah umum yang perlu dipertimbangkan:

1. Menurut artikel
   [1000 instances of nixpkgs](https://discourse.nixos.org/t/1000-instances-of-nixpkgs/17347)
   yang dibagikan @fbewivpjsbsby, memakai `import` untuk menyesuaikan `nixpkgs` dalam
   submodul atau subflake bukan praktik yang baik. Setiap `import` dievaluasi secara
   terpisah dan membuat instans nixpkgs baru. Seiring bertambahnya konfigurasi, waktu
   build bisa bertambah lama dan penggunaan memori meningkat. Karena itu, sebaiknya buat
   semua instans nixpkgs dalam berkas `flake.nix`.

2. Saat mencampur simulasi QEMU dengan kompilasi silang, berhati-hatilah agar kompilasi
   paket tidak terduplikasi tanpa perlu.

[nixpkgs/default.nix]: https://github.com/NixOS/nixpkgs/blob/nixos-26.05/default.nix
[pkgs/top-level/impure.nix]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/top-level/impure.nix
