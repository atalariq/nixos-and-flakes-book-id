# Kiat Berguna Lainnya {#other-useful-tips}

## Menampilkan Pesan Kesalahan Terperinci {#show-detailed-error-messages}

Jika menemui kesalahan selama deployment, kamu selalu bisa mencoba menambahkan
`--show-trace --print-build-logs --verbose` ke perintah `nixos-rebuild` untuk memperoleh
pesan kesalahan yang terperinci. Misalnya:

```bash
cd /etc/nixos
sudo nixos-rebuild switch --flake .#myhost --show-trace --print-build-logs --verbose

# A more concise version
sudo nixos-rebuild switch --flake .#myhost --show-trace -L -v
```

## Mengelola Konfigurasi dengan Git {#managing-the-configuration-with-git}

Konfigurasi NixOS berupa sekumpulan berkas teks, sehingga cocok dikelola dengan kontrol
versi Git. Ini memudahkan pengembalian ke versi sebelumnya jika terjadi masalah.

> CATATAN: Saat memakai Git, Nix mengabaikan semua berkas yang tidak dilacak oleh Git.
> Jika Nix melaporkan bahwa suatu berkas tidak ditemukan, mungkin kamu belum menjalankan
> `git add` untuk berkas tersebut.

Secara bawaan, NixOS menempatkan konfigurasi di `/etc/nixos`, yang memerlukan izin root
untuk diubah. Ini kurang praktis untuk penggunaan sehari-hari. Untungnya, Flakes bisa
membantu dengan memungkinkanmu menempatkan flake di lokasi pilihanmu.

Misalnya, kamu bisa menempatkan flake di `~/nixos-config` dan membuat tautan simbolis di
`/etc/nixos` sebagai berikut:

```shell
sudo mv /etc/nixos /etc/nixos.bak  # Backup the original configuration
sudo ln -s ~/nixos-config /etc/nixos

# Deploy the flake.nix located at the default location (/etc/nixos)
sudo nixos-rebuild switch
```

Dengan cara ini, kamu bisa memakai Git untuk mengelola konfigurasi di `~/nixos-config`.
Konfigurasi bisa diubah dengan izin pengguna biasa dan tidak harus dimiliki root.

Pendekatan lain adalah langsung menghapus `/etc/nixos` dan menentukan path berkas
konfigurasi setiap kali menerapkannya:

```shell
sudo mv /etc/nixos /etc/nixos.bak
cd ~/nixos-config

# `--flake .#my-nixos` deploys the flake.nix located in
# the current directory, and the nixosConfiguration's name is `my-nixos`
sudo nixos-rebuild switch --flake .#my-nixos
```

Pilih cara yang paling cocok untukmu. Setelah itu, mengembalikan sistem menjadi mudah.
Cukup beralih ke commit sebelumnya dan terapkan:

```shell
cd ~/nixos-config
# Switch to the previous commit
git checkout HEAD^1
# Deploy the flake.nix located in the current directory,
# with the nixosConfiguration's name `my-nixos`
sudo nixos-rebuild switch --flake .#my-nixos
```

Operasi Git yang lebih lanjut tidak dibahas di sini, tetapi secara umum rollback bisa
langsung dilakukan melalui Git. Hanya jika sistem benar-benar macet, kamu perlu memulai
ulang ke bootloader dan melakukan boot dari versi sistem terdahulu.

## Melihat dan Menghapus Data Terdahulu {#viewing-and-deleting-historical-data}

Seperti disebutkan sebelumnya, setiap deployment NixOS membuat versi baru, dan semua versi
ditambahkan ke pilihan boot sistem. Selain memulai ulang komputer, kamu bisa melihat semua
versi terdahulu yang tersedia dengan perintah berikut:

```shell
nix profile history --profile /nix/var/nix/profiles/system
```

Untuk membersihkan versi terdahulu dan mengosongkan ruang penyimpanan, gunakan perintah
berikut:

```shell
# Delete all historical versions older than 7 days
sudo nix profile wipe-history --older-than 7d --profile /nix/var/nix/profiles/system

# Wiping history won't garbage collect the unused packages, you need to run the gc command manually as root:
sudo nix-collect-garbage --delete-older-than 7d

# Due to the following issue, you need to run the gc command as per user to delete home-manager's historical data:
# https://github.com/NixOS/nix/issues/8508
nix-collect-garbage --delete-older-than 7d
```

## Mengapa Suatu Paket Terpasang? {#why-some-packages-are-installed}

Untuk mencari tahu mengapa suatu paket terpasang, kamu bisa memakai perintah berikut:

1. Masuk ke shell yang menyediakan `nix-tree` & `rg`:
   `nix shell nixpkgs#nix-tree nixpkgs#ripgrep`
1. `nix-store --gc --print-roots | rg -v '/proc/' | rg -Po '(?<= -> ).*' | xargs -o nix-tree`
1. `/<package-name>` untuk mencari paket yang ingin diperiksa.
1. `w` untuk menampilkan paket yang bergantung padanya beserta seluruh rantai
   dependensinya.

## Mengurangi Penggunaan Disk {#reducing-disk-usage}

Konfigurasi berikut bisa ditambahkan ke konfigurasi NixOS untuk membantu mengurangi
penggunaan disk:

```nix
{ lib, pkgs, ... }:

{
  # ...

  # Limit the number of generations to keep
  boot.loader.systemd-boot.configurationLimit = 10;
  # boot.loader.grub.configurationLimit = 10;

  # Perform garbage collection weekly to maintain low disk usage
  nix.gc = {
    automatic = true;
    dates = "weekly";
    options = "--delete-older-than 7d";
  };

  # Optimize storage
  # You can also manually optimize the store via:
  #    nix-store --optimise
  # Refer to the following link for more details:
  # https://nixos.org/manual/nix/stable/command-ref/conf-file.html#conf-auto-optimise-store
  nix.settings.auto-optimise-store = true;
}
```

Dengan menyertakan konfigurasi ini, kamu bisa mengelola dan mengoptimalkan penggunaan disk
sistem NixOS dengan lebih baik.
