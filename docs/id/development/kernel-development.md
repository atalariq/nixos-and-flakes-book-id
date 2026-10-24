# Pengembangan Kernel {#kernel-development}

> WIP, masih dikerjakan

Contoh pengembangan kernel dengan `flake.nix`.

```nix
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05-small";

    # custom kernel's source
    thead-kernel = {
      url = "github:revyos/thead-kernel/lpi4a";
      flake = false;
    };
  };

  outputs = inputs@{
    self
    ,nixpkgs
    ,thead-kernel
    ,... }:
  let
    pkgsKernel = import nixpkgs {
      localSystem = "x86_64-linux";
      crossSystem = {
        config = "riscv64-unknown-linux-gnu";
      };

      overlays = [
        (self: super: {
          # use gcc 13 to compile this custom kernel
          linuxPackages_thead = super.linuxPackagesFor (super.callPackage ./pkgs/kernel {
            src = thead-kernel;
            stdenv = super.gcc13Stdenv;
            kernelPatches = with super.kernelPatches; [
              bridge_stp_helper
              request_key_helper
            ];
          });
        })
      ];
    };
  in
  {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";

      specialArgs = {
        inherit nixpkgs pkgsKernel;
      };
      modules = [
        {
          # cross-compile this flake.
          nixpkgs.crossSystem = {
            system = "riscv64-linux";
          };
        }

        ./modules/licheepi4a.nix
        ./modules/sd-image-lp4a.nix
      ];
    };

    # use `nix develop .#kernel` to enter the environment with the custom kernel build environment available.
    # and then use `unpackPhase` to unpack the kernel source code and cd into it.
    # then you can use `make menuconfig` to configure the kernel.
    #
    # problem
    #   - using `make menuconfig` - Unable to find the ncurses package.
    devShells.x86_64-linux.kernel = pkgsKernel.linuxPackages_thead.kernel.dev;

    # use `nix develop .#fhs` to enter the fhs test environment defined here.
    devShells.x86_64-linux.fhs = let
      pkgs = import nixpkgs {
        system = "x86_64-linux";
      };
    in
      # the code here is mainly copied from:
      #   https://wiki.nixos.org/wiki/Linux_kernel#Embedded_Linux_Cross-compile_xconfig_and_menuconfig
      (pkgs.buildFHSUserEnv {
        name = "kernel-build-env";
        targetPkgs = pkgs_: (with pkgs_;
          [
            # we need theses packages to run `make menuconfig` successfully.
            pkgconfig
            ncurses

            pkgsKernel.gcc13Stdenv.cc
            gcc
          ]
          ++ pkgs.linux.nativeBuildInputs);
        runScript = pkgs.writeScript "init.sh" ''
          # set the cross-compilation environment variables.
          export CROSS_COMPILE=riscv64-unknown-linux-gnu-
          export ARCH=riscv
          export PKG_CONFIG_PATH="${pkgs.ncurses.dev}/lib/pkgconfig:"
          exec bash
        '';
      }).env;
  };
}
```

Dengan `flake.nix` di atas, saya bisa memasuki lingkungan build kernel melalui
`nix develop .#kernel`, lalu memakai `unpackPhase` untuk mengekstrak kode sumber kernel
dan masuk ke direktorinya dengan cd. Namun, saya tidak bisa memakai `make menuconfig`
untuk mengonfigurasi kernel, karena paket `ncurses` tidak ada dalam lingkungan ini.

Untuk mengatasinya, saya menambahkan lingkungan `fhs` untuk memasang paket `ncurses` dan
paket lain yang diperlukan. Lalu, saya bisa memakai `nix develop .#fhs` untuk memasuki
lingkungan ini dan memakai `make menuconfig` untuk mengonfigurasi kernel.

## Rujukan {#references}

- [Linux kernel - NixOS Wiki](https://wiki.nixos.org/wiki/Linux_kernel)
- https://github.com/jordanisaacs/kernel-development-flake
