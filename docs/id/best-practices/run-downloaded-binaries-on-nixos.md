# Menjalankan Biner Unduhan di NixOS {#running-downloaded-binaries-on-nixos}

Karena NixOS tidak mengikuti Filesystem Hierarchy Standard (FHS) secara ketat, biner yang
diunduh dari internet mungkin tidak langsung berjalan di NixOS. Namun, ada berbagai cara
agar biner tersebut bisa berfungsi dengan baik.

Untuk panduan menyeluruh berisi sepuluh pendekatan menjalankan biner unduhan di NixOS,
saya menyarankan artikel
[Different methods to run a non-nixos executable on Nixos](https://unix.stackexchange.com/questions/522822/different-methods-to-run-a-non-nixos-executable-on-nixos)
dan melihat [nix-alien](https://github.com/thiagokokada/nix-alien). Atau, jika sudah
terbiasa dengan Docker, menjalankan biner dalam kontainer Docker juga merupakan pilihan
yang baik.

Di antara cara-cara ini, saya pribadi lebih menyukai pembuatan lingkungan FHS untuk
menjalankan biner, karena praktis dan mudah dipakai. Untuk menyiapkannya, tambahkan kode
berikut ke salah satu modul Nix:

```nix
{ config, pkgs, lib, ... }:

{
  # ......omit many configurations

  environment.systemPackages = with pkgs; [
    # ......omit many packages

    # Create an FHS environment using the command `fhs`, enabling the execution of non-NixOS packages in NixOS!
    (let base = pkgs.appimageTools.defaultFhsEnvArgs; in
      pkgs.buildFHSEnv (base // {
      name = "fhs";
      targetPkgs = pkgs:
        # pkgs.buildFHSEnv provides only a minimal FHS environment,
        # lacking many basic packages needed by most software.
        # Therefore, we need to add them manually.
        #
        # pkgs.appimageTools provides basic packages required by most software.
        (base.targetPkgs pkgs) ++ (with pkgs; [
          pkg-config
          ncurses
          # Feel free to add more packages here if needed.
        ]
      );
      profile = "export FHS=1";
      runScript = "bash";
      extraOutputsToInstall = ["dev"];
    }))
  ];

  # ......omit many configurations
}
```

Setelah menerapkan konfigurasi yang diperbarui, kamu bisa memakai perintah `fhs` untuk
memasuki lingkungan FHS, lalu menjalankan biner yang diunduh. Misalnya:

```shell
# Activating FHS drops me into a shell that resembles a "normal" Linux environment.
$ fhs
# Check what we have in /usr/bin.
(fhs) $ ls /usr/bin
# Try running a non-NixOS binary downloaded from the Internet.
(fhs) $ ./bin/code
```

## Rujukan {#references}

- [Tips&Tricks for NixOS Desktop - NixOS
  Discourse][Tips&Tricks for NixOS Desktop - NixOS Discourse]: Kumpulan kiat dan trik
  berguna bagi pengguna desktop NixOS.
- [nix-alien](https://github.com/thiagokokada/nix-alien): Menjalankan biner tanpa patch di
  Nix/NixOS
- [nix-ld](https://github.com/nix-community/nix-ld): Menjalankan biner dinamis tanpa patch
  di NixOS.
- [NixOS: Packaging Closed Source Software (& Binary Distributed Ones) - Lan Tian @ Blog](https://lantian.pub/en/article/modify-computer/nixos-packaging.lantian/#examples-closed-source-software--binary-distributed-ones)

[Tips&Tricks for NixOS Desktop - NixOS Discourse]:
  https://discourse.nixos.org/t/tips-tricks-for-nixos-desktop/28488
