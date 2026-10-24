# Menurunkan atau Menaikkan Versi Paket {#downgrading-or-upgrading-packages}

Saat memakai Flakes, kamu mungkin perlu menurunkan atau menaikkan versi paket tertentu
untuk mengatasi bug atau masalah kompatibilitas. Dalam Flakes, versi paket dan nilai hash
terkait langsung dengan commit git input flake-nya. Untuk mengubah versi paket, kamu perlu
mengunci commit git input flake tersebut.

Berikut contoh menambahkan beberapa input nixpkgs, masing-masing memakai commit git atau
branch yang berbeda:

```nix{8-13,19-20,27-42}
{
  description = "My NixOS configuration";

  inputs = {
    # Default to the nixos-unstable branch
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    # Latest stable branch of nixpkgs, used for version rollback
    # The current latest version is 26.05
    nixpkgs-stable.url = "github:nixos/nixpkgs/nixos-26.05";

    # You can also use a specific git commit hash to lock the version
    nixpkgs-fd40cef8d.url = "github:nixos/nixpkgs/fd40cef8d797670e203a27a91e4b8e6decf0b90c";
  };

  outputs = inputs@{
    self,
    nixpkgs,
    nixpkgs-stable,
    nixpkgs-fd40cef8d,
    ...
  }: {
    nixosConfigurations = {
      my-nixos = nixpkgs.lib.nixosSystem {
        # The `specialArgs` parameter passes the
        # non-default nixpkgs instances to other nix modules
        specialArgs = let
          system = "x86_64-linux";
        in {
          # To use packages from nixpkgs-stable,
          # we configure some parameters for it first
          pkgs-stable = import nixpkgs-stable {
            inherit system;
            # To use Chrome, we need to allow the
            # installation of non-free software.
            config.allowUnfree = true;
          };
          pkgs-fd40cef8d = import nixpkgs-fd40cef8d {
            inherit system;
            config.allowUnfree = true;
          };
        };

        modules = [
          ./hosts/my-nixos

          # Omit other configurations...
        ];
      };
    };
  };
}
```

> **CATATAN**: Saat memakai `import nixpkgs { ... }`, kamu harus memberikan `system` atau
> `localSystem` untuk menentukan arsitektur tujuan. Ini berbeda dari mendefinisikan
> konfigurasi NixOS dengan `nixpkgs.lib.nixosSystem`.  
> Pada cara kedua, `nixpkgs.hostPlatform` sudah diatur dalam `hardware-configuration.nix`
> yang dihasilkan. Sementara itu, `import nixpkgs { ... }` baru membuat instans baru yang
> tidak mewarisi nilai tersebut.

Pada contoh di atas, kita mendefinisikan beberapa input nixpkgs: `nixpkgs`,
`nixpkgs-stable`, dan `nixpkgs-fd40cef8d`. Setiap input merujuk pada commit git atau
branch yang berbeda.

Selanjutnya, kamu bisa merujuk paket dari `pkgs-stable` atau `pkgs-fd40cef8d` dalam
submodul. Berikut contoh submodul Home Manager:

```nix{4-7,13,25}
{
  pkgs,
  config,
  # Nix will search for and inject this parameter
  # from `specialArgs` in `flake.nix`
  pkgs-stable,
  # pkgs-fd40cef8d,
  ...
}:

{
  # Use packages from `pkgs-stable` instead of `pkgs`
  home.packages = with pkgs-stable; [
    firefox-wayland

    # Chrome Wayland support was broken on the nixos-unstable branch,
    # so we fallback to the stable branch for now.
    # Reference: https://github.com/swaywm/sway/issues/7562
    google-chrome
  ];

  programs.vscode = {
    enable = true;
    # Refer to vscode from `pkgs-stable` instead of `pkgs`
    package = pkgs-stable.vscode;
  };
}
```

## Mengunci Versi Paket dengan Overlay {#pinning-a-package-version-with-an-overlay}

Pendekatan di atas sangat cocok untuk paket aplikasi, tetapi terkadang kamu perlu
mengganti pustaka yang dipakai paket-paket itu. Di sinilah
[Overlays](../nixpkgs/overlays.md) menunjukkan keunggulannya! Overlay bisa menyunting atau
mengganti atribut paket mana pun, tetapi untuk saat ini kita hanya akan mengunci paket ke
versi nixpkgs lain. Kekurangan utama menyunting dependensi dengan overlay: instalasi Nix
akan mengompilasi ulang semua paket terpasang yang bergantung padanya. Namun, situasimu
mungkin memerlukannya untuk perbaikan bug tertentu.

```nix
# overlays/mesa.nix
{ config, pkgs, lib, pkgs-fd40cef8d, ... }:
{
  nixpkgs.overlays = [
    # Overlay: Use `self` and `super` to express
    # the inheritance relationship
    (self: super: {
      mesa = pkgs-fd40cef8d.mesa;
    })
  ];
}
```

## Menerapkan Konfigurasi Baru {#applying-the-new-configuration}

Setelah menyesuaikan konfigurasi seperti di atas, kamu bisa menerapkannya dengan
`sudo nixos-rebuild switch`. Ini akan menurunkan versi Firefox/Chrome/VSCode ke versi yang
sesuai dengan `nixpkgs-stable` atau `nixpkgs-fd40cef8d`.

> Menurut
> [1000 instances of nixpkgs](https://discourse.nixos.org/t/1000-instances-of-nixpkgs/17347),
> memakai `import` dalam submodul atau subflake untuk menyesuaikan `nixpkgs` bukan praktik
> yang baik. Setiap `import` membuat instans nixpkgs baru, yang meningkatkan waktu build
> dan penggunaan memori seiring berkembangnya konfigurasi. Untuk menghindari masalah ini,
> kita membuat semua instans nixpkgs dalam `flake.nix`.
