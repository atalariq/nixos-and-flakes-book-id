# Kompilasi Lintas Platform {#cross-platform-compilation}

Pada platform Linux mana pun, ada dua cara melakukan kompilasi lintas platform. Misalnya,
untuk membangun program `aarch64-linux` pada host `x86_64-linux`, kamu bisa memakai cara
berikut:

1. Memakai toolchain kompilasi silang untuk mengompilasi program `aarch64`.
   - Kekurangannya, kamu tidak bisa memakai cache biner NixOS dan perlu mengompilasi
     semuanya sendiri. (Kompilasi silang juga memiliki cache, tetapi pada dasarnya
     kosong.)
   - Keunggulannya, set instruksi tidak perlu diemulasikan, dan kinerjanya tinggi.
2. Memakai QEMU untuk mengemulasikan arsitektur `aarch64`, lalu mengompilasi program dalam
   emulator.
   - Kekurangannya, set instruksi diemulasikan dan kinerjanya buruk.
   - Keunggulannya, kamu bisa memakai cache biner NixOS dan tidak perlu mengompilasi
     semuanya sendiri.

Jika memakai cara pertama, kamu tidak perlu mengaktifkan `binfmt_misc`, tetapi harus
menjalankan kompilasi melalui toolchain kompilasi silang.

Jika memakai cara kedua, kamu perlu mengaktifkan `binfmt_misc` arsitektur `aarch64` dalam
konfigurasi NixOS mesin build.

## Kompilasi Silang {#cross-compilation}

`nixpkgs` menyediakan sekumpulan platform host yang sudah ditentukan untuk kompilasi
silang, bernama `pkgsCross`. Kamu bisa menjelajahinya dalam `nix repl`.

```shell
› nix repl -f '<nixpkgs>'
Welcome to Nix 2.13.3. Type :? for help.

Loading installable ''...
Added 19273 variables.
nix-repl> pkgsCross.<TAB>
pkgsCross.aarch64-android             pkgsCross.msp430
pkgsCross.aarch64-android-prebuilt    pkgsCross.musl-power
pkgsCross.aarch64-darwin              pkgsCross.musl32
pkgsCross.aarch64-embedded            pkgsCross.musl64
pkgsCross.aarch64-multiplatform       pkgsCross.muslpi
pkgsCross.aarch64-multiplatform-musl  pkgsCross.or1k
pkgsCross.aarch64be-embedded          pkgsCross.pogoplug4
pkgsCross.arm-embedded                pkgsCross.powernv
pkgsCross.armhf-embedded              pkgsCross.ppc-embedded
pkgsCross.armv7a-android-prebuilt     pkgsCross.ppc64
pkgsCross.armv7l-hf-multiplatform     pkgsCross.ppc64-musl
pkgsCross.avr                         pkgsCross.ppcle-embedded
pkgsCross.ben-nanonote                pkgsCross.raspberryPi
pkgsCross.fuloongminipc               pkgsCross.remarkable1
pkgsCross.ghcjs                       pkgsCross.remarkable2
pkgsCross.gnu32                       pkgsCross.riscv32
pkgsCross.gnu64                       pkgsCross.riscv32-embedded
pkgsCross.i686-embedded               pkgsCross.riscv64
pkgsCross.iphone32                    pkgsCross.riscv64-embedded
pkgsCross.iphone32-simulator          pkgsCross.rx-embedded
pkgsCross.iphone64                    pkgsCross.s390
pkgsCross.iphone64-simulator          pkgsCross.s390x
pkgsCross.loongarch64-linux           pkgsCross.sheevaplug
pkgsCross.m68k                        pkgsCross.vc4
pkgsCross.mingw32                     pkgsCross.wasi32
pkgsCross.mingwW64                    pkgsCross.x86_64-darwin
pkgsCross.mips-linux-gnu              pkgsCross.x86_64-embedded
pkgsCross.mips64-linux-gnuabi64       pkgsCross.x86_64-freebsd
pkgsCross.mips64-linux-gnuabin32      pkgsCross.x86_64-netbsd
pkgsCross.mips64el-linux-gnuabi64     pkgsCross.x86_64-netbsd-llvm
pkgsCross.mips64el-linux-gnuabin32    pkgsCross.x86_64-unknown-redox
pkgsCross.mipsel-linux-gnu
pkgsCross.mmix
```

Jika ingin mengatur `pkgs` secara global menjadi toolchain kompilasi silang dalam flake,
cukup tambahkan Modul pada `flake.nix`, seperti berikut:

```nix{12-17}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      modules = [
        {
          # the platform that performs the build-step
          nixpkgs.buildPlatform.system = "x86_64-linux";

          # the platform that will execute the resulting binaries
          # add this to enable cross-compilation.
          nixpkgs.crossSystem.system = "riscv64-linux";
        }

        # ...... other modules
      ];
    };
  };
}
```

Opsi `nixpkgs.crossSystem` dipakai untuk mengatur `pkgs` menjadi toolchain kompilasi
silang, sehingga semua yang dibangun akan berarsitektur `riscv64-linux`.

## Kompilasi melalui Sistem yang Diemulasikan {#compile-through-emulated-system}

Cara kedua adalah melakukan kompilasi lintas platform melalui sistem yang diemulasikan.
Cara ini tidak memerlukan toolchain kompilasi silang.

Untuk memakainya, mesin build harus terlebih dahulu mengaktifkan modul binfmt_misc dalam
konfigurasi. Jika mesin build memakai NixOS, tambahkan konfigurasi berikut ke Modul NixOS
untuk mengaktifkan sistem build emulasi arsitektur `aarch64-linux` dan `riscv64-linux`:

```nix{6}
{ ... }:
{
  # ......

  # Enable binfmt emulation.
  boot.binfmt.emulatedSystems = [ "aarch64-linux" "riscv64-linux" ];

  # ......
}
```

Untuk `flake.nix`, pengaturannya sangat sederhana, bahkan lebih mudah daripada pengaturan
kompilasi silang, seperti berikut:

```nix{13}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      modules = [
        # the native platform
        # usually this is already set in the generated `hardware-configuration.nix` and can be omit.
        { nixpkgs.hostPlatform = "riscv64-linux"; }
        # ...... other modules
      ];
    };
  };
}
```

Kamu tidak perlu menambahkan modul lain. Cukup tentukan `nixpkgs.hostPlatform` sebagai
`riscv64-linux`. Saat build, Nix otomatis mendeteksi apakah sistem saat ini adalah
`riscv64-linux`. Jika bukan, build otomatis dilakukan melalui sistem yang diemulasikan
(QEMU). Bagi pengguna, operasi di balik layar ini sepenuhnya transparan.

## Linux binfmt_misc {#linux-binfmt-misc}

Bagian sebelumnya hanya memperkenalkan penggunaan sistem emulasi Nix. Jika ingin memahami
detail di baliknya, berikut pengantar singkatnya.

`binfmt_misc` adalah fitur kernel Linux, singkatan dari Kernel Support for miscellaneous
Binary Formats (dukungan kernel untuk berbagai format biner). Fitur ini memungkinkan Linux
menjalankan program untuk hampir semua arsitektur CPU, termasuk X86_64, ARM64, RISCV64,
dan lainnya.

Agar `binfmt_misc` bisa menjalankan program dalam berbagai format, dua hal diperlukan:
cara khusus mengidentifikasi format biner dan lokasi interpreter yang sesuai. Meski
terdengar hebat, implementasi `binfmt_misc` ternyata mudah dipahami. Cara kerjanya mirip
interpreter Bash yang menentukan interpreter dari baris pertama berkas skrip (misalnya
`#!/usr/bin/env python3`). `binfmt_misc` mendefinisikan serangkaian aturan, seperti
membaca magic number pada lokasi tertentu dalam berkas biner atau menentukan format
executable dari ekstensi berkas (misalnya .exe, .py). Lalu, interpreter yang sesuai
dipanggil untuk menjalankan program. Format executable bawaan Linux adalah ELF, tetapi
`binfmt_misc` memperluasnya agar berbagai berkas biner bisa dijalankan dengan interpreter
masing-masing.

Untuk mendaftarkan format program biner, tulis baris dengan format
`:name:type:offset:magic:mask:interpreter:flags` ke berkas
`/proc/sys/fs/binfmt_misc/register`. Penjelasan terperinci format ini di luar cakupan
pembahasan kita.

Karena menulis informasi pendaftaran `binfmt_misc` secara manual bisa merepotkan,
komunitas menyediakan kontainer untuk membantu pendaftaran otomatis. Kontainer bernama
`binfmt` ini akan memasang berbagai emulator `binfmt_misc` saat dijalankan. Contohnya:

```shell
# Register all architectures
podman run --privileged --rm tonistiigi/binfmt:latest --install all

# Register only common arm/riscv architectures
docker run --privileged --rm tonistiigi/binfmt --install arm64,riscv64,arm
```

Modul `binfmt_misc` diperkenalkan pada Linux versi 2.6.12-rc2 dan sejak itu mengalami
beberapa perubahan fungsi kecil. Pada Linux 4.8, flag "F" (fix binary) ditambahkan agar
interpreter bisa dipanggil dengan benar dalam mount namespace dan lingkungan chroot. Agar
berjalan dengan baik dalam kontainer yang perlu membangun beberapa arsitektur, flag "F"
diperlukan. Jadi, versi kernel harus 4.8 atau lebih baru.

Singkatnya, dibandingkan memanggil interpreter secara eksplisit untuk menjalankan program
arsitektur nonasli, `binfmt_misc` membuat prosesnya transparan. Pengguna tidak perlu lagi
memikirkan interpreter yang harus dipakai saat menjalankan program. Program arsitektur
mana pun bisa langsung dijalankan. Flag "F" yang bisa dikonfigurasi merupakan keuntungan
tambahan: program interpreter dimuat ke memori saat instalasi dan tidak terpengaruh
perubahan lingkungan sesudahnya.

## Toolchain Build Kustom {#custom-build-toolchain}

Terkadang kita perlu memakai toolchain build kustom, misalnya gcc atau musl libc sendiri.
Perubahan ini bisa dilakukan melalui overlay.

Misalnya, mari coba memakai versi gcc berbeda dan mengujinya melalui `nix repl`:

```shell
› nix repl -f '<nixpkgs>'
Welcome to Nix 2.13.3. Type :? for help.

Loading installable ''...
Added 17755 variables.

# replace gcc through overlays, this will create a new instance of nixpkgs
nix-repl> a = import <nixpkgs> { crossSystem = "riscv64-linux"; overlays = [ (self: super: { gcc = self.gcc13; }) ]; }

# check the gcc version, it is indeed changed to 13
nix-repl> a.pkgsCross.riscv64.stdenv.cc
«derivation /nix/store/kdi3g7px1bxz2r1jmjnr4pahscw8jj96-riscv64-unknown-linux-gnu-gcc-wrapper-13.4.0.drv»

# take a look at the default pkgs, it is still 14
nix-repl> pkgs.pkgsCross.riscv64.stdenv.cc
«derivation /nix/store/xd8s47j71z3lym5f2j9zy3v9r0ifw209-riscv64-unknown-linux-gnu-gcc-wrapper-14.3.0.drv»
```

Lalu, bagaimana memakainya dalam Flakes? Berikut contoh `flake.nix`:

```nix{20-21}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05-small";
  };

  outputs = { self, nixpkgs, ... }:
  {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      modules = [
        {
          # the platform that performs the build-step
          nixpkgs.buildPlatform.system = "x86_64-linux";

          # the platform that will execute the resulting binaries
          # add this to enable cross-compilation.
          nixpkgs.crossSystem.system = "riscv64-linux";

          # replace gcc with gcc13 through overlays
          nixpkgs.overlays = [ (self: super: { gcc = self.gcc13; }) ];
        }

        # other modules ......
      ];
    };
  };
}
```

`nixpkgs.overlays` dipakai untuk mengubah instans `pkgs` secara global. Instans yang
diubah berlaku bagi seluruh flake. Ini kemungkinan membuat banyak cache tidak lagi cocok,
sehingga banyak paket Nix perlu dibangun secara lokal.

Untuk menghindarinya, cara yang lebih baik adalah membuat instans `pkgs` baru dan hanya
memakainya saat membangun paket yang ingin diubah. Berikut contoh `flake.nix`:

```nix{10-17,32}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05-small";
  };

  outputs = { self, nixpkgs, ... }: let
    # create a new pkgs instance with overlays
    pkgs-gcc13 = import nixpkgs {
      localSystem = "x86_64-linux";
      crossSystem = "riscv64-linux";

      overlays = [
        (self: super: { gcc = self.gcc13; })
      ];
    };
  in {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      specialArgs = {
        # pass the new pkgs instance to the module
        inherit pkgs-gcc13;
      };
      modules = [
        {
          nixpkgs.buildPlatform.system = "x86_64-linux";
          nixpkgs.crossSystem.system = "riscv64-linux";
        }

        ({pkgs-gcc13, ...}: {
          # use the custom pkgs instance to build the package hello
          environment.systemPackages = [ pkgs-gcc13.hello ];
        })

        # other modules ......
      ];
    };
  };
}
```

Dengan cara di atas, kita bisa mudah menyesuaikan toolchain build beberapa paket tanpa
memengaruhi build paket lain.

## Rujukan {#references}

- [Cross compilation - nix.dev](https://nix.dev/tutorials/cross-compilation)
