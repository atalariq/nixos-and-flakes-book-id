# Dasar Pemaketan {#packaging-101}

WIP, masih dikerjakan. Rujuk dokumen berikut untuk mempelajari pemaketan Nix.

## Rujukan {#references}

- [NixOS Series 3: Software Packaging 101](https://lantian.pub/en/article/modify-computer/nixos-packaging.lantian/)
- [How to Learn Nix, Part 28: The standard environment](https://ianthehenry.com/posts/how-to-learn-nix/the-standard-environment/)
- [stdenv - Nixpkgs Manual](https://github.com/NixOS/nixpkgs/tree/nixos-unstable/doc/stdenv)
- [languages-frameworks - Nixpkgs Manual](https://github.com/NixOS/nixpkgs/tree/nixos-unstable/doc/languages-frameworks)
- [Wrapping packages - NixOS Cookbook](https://wiki.nixos.org/wiki/Nix_Cookbook#Wrapping_packages)
- Alat yang berguna:
  - [nurl](https://github.com/nix-community/nurl): Menghasilkan pemanggilan fetcher Nix
    dari URL repositori
  - [nix-init](https://github.com/nix-community/nix-init): Menghasilkan paket Nix dari
    URL, dengan pengambilan hash di awal, inferensi dependensi, deteksi lisensi, dan
    lainnya
- Kode Sumber:
  - [pkgs/build-support/trivial-builders/default.nix - runCommand](https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/trivial-builders/default.nix#L25-L54)
  - [pkgs/build-support/setup-hooks/make-wrapper.sh](https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/setup-hooks/make-wrapper.sh)
  - Terkait FHS
    - [pkgs/build-support/build-fhsenv-bubblewrap/buildFHSEnv.nix](https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/build-fhsenv-bubblewrap/buildFHSEnv.nix):
      `pkgs.buildFHSEnvBubblewrap` (menggantikan `pkgs.buildFHSEnvChroot` yang sudah
      usang)
