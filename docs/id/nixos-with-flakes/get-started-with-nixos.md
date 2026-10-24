# Mulai Menggunakan NixOS {#get-started-with-nixos}

Setelah mempelajari dasar bahasa Nix, kita bisa mulai memakainya untuk mengonfigurasi
sistem NixOS. Berkas konfigurasi bawaan NixOS berada di `/etc/nixos/configuration.nix`.
Berkas ini berisi seluruh konfigurasi deklaratif sistem, termasuk zona waktu, bahasa, tata
letak papan ketik, jaringan, pengguna, sistem berkas, dan pilihan boot.

Untuk mengubah keadaan sistem secara reproduktif (sangat disarankan), kita perlu
menyunting `/etc/nixos/configuration.nix` secara manual, lalu menjalankan
`sudo nixos-rebuild switch` untuk menerapkan perubahan. Perintah ini menghasilkan
lingkungan sistem baru berdasarkan berkas konfigurasi yang diubah, menjadikannya
lingkungan bawaan, dan menyimpan lingkungan sebelumnya dalam pilihan boot
grub/systemd-boot. Dengan begitu, kita selalu bisa kembali ke lingkungan lama meskipun
lingkungan baru gagal dijalankan.

Meski `/etc/nixos/configuration.nix` merupakan cara klasik mengonfigurasi NixOS, cara ini
bergantung pada sumber data yang diatur oleh `nix-channel` dan tidak memiliki mekanisme
penguncian versi. Akibatnya, reproduksibilitas sistem sulit dipastikan. Pendekatan yang
lebih baik adalah memakai Flakes, yang menyediakan reproduksibilitas dan memudahkan
pengelolaan konfigurasi.

Di bagian ini, kita akan terlebih dahulu belajar mengelola NixOS dengan cara klasik
(`/etc/nixos/configuration.nix`), lalu menjelajahi Flakes yang lebih canggih.

## Mengonfigurasi Sistem dengan `/etc/nixos/configuration.nix` {#configuring-the-system-using-etc-nixos-configuration-nix}

Berkas `/etc/nixos/configuration.nix` merupakan cara bawaan dan klasik untuk
mengonfigurasi NixOS. Meski tidak memiliki beberapa fitur canggih Flakes, cara ini masih
banyak dipakai dan memberikan keleluasaan dalam konfigurasi sistem.

Sebagai contoh penggunaan `/etc/nixos/configuration.nix`, mari aktifkan SSH dan tambahkan
pengguna bernama `ryan` ke sistem. Kita bisa melakukannya dengan menambahkan isi berikut
ke `/etc/nixos/configuration.nix`:

```nix{14-38}
# Edit this configuration file to define what should be installed on
# your system.  Help is available in the configuration.nix(5) man page
# and in the NixOS manual (accessible by running ‘nixos-help’).
{ config, pkgs, ... }:

{
  imports =
    [ # Include the results of the hardware scan.
      ./hardware-configuration.nix
    ];

  # Omit previous configuration settings...

  # Add user 'ryan'
  users.users.ryan = {
    isNormalUser = true;
    description = "ryan";
    extraGroups = [ "networkmanager" "wheel" ];
    openssh.authorizedKeys.keys = [
        # Replace with your own public key
        "ssh-ed25519 <some-public-key> ryan@ryan-pc"
    ];
    packages = with pkgs; [
      firefox
    #  thunderbird
    ];
  };

  # Enable the OpenSSH daemon.
  services.openssh = {
    enable = true;
    settings = {
      X11Forwarding = true;
      PermitRootLogin = "no"; # disable root login
      PasswordAuthentication = false; # disable password login
    };
    openFirewall = true;
  };

  # Omit the rest of the configuration...
}
```

Dalam konfigurasi ini, kita menyatakan keinginan untuk mengaktifkan layanan openssh,
menambahkan kunci publik SSH untuk pengguna 'ryan', dan menonaktifkan login dengan kata
sandi.

Untuk melakukan deployment konfigurasi yang diubah, jalankan `sudo nixos-rebuild switch`.
Perintah ini menerapkan perubahan, menghasilkan lingkungan sistem baru, dan menjadikannya
lingkungan bawaan. Kini kamu bisa masuk ke sistem melalui SSH dengan kunci SSH yang sudah
dikonfigurasi.

> Jika menemui kesalahan saat deployment, kamu selalu bisa mencoba menambahkan
> `--show-trace --print-build-logs --verbose` ke perintah `nixos-rebuild` untuk memperoleh
> pesan kesalahan yang terperinci.

Ingat, perubahan sistem yang dapat direproduksi bisa dilakukan dengan menyunting
`/etc/nixos/configuration.nix`, lalu menerapkannya dengan `sudo nixos-rebuild switch`.

Untuk menemukan opsi konfigurasi dan dokumentasi:

- Gunakan mesin pencari seperti Google. Misalnya, cari `Chrome NixOS` untuk menemukan
  informasi Chrome yang berkaitan dengan NixOS. NixOS Wiki dan kode sumber Nixpkgs
  biasanya muncul di antara hasil teratas.
- Gunakan [NixOS Options Search](https://search.nixos.org/options) untuk mencari kata
  kunci.
- Rujuk
  [bagian Konfigurasi](https://nixos.org/manual/nixos/unstable/index.html#ch-configuration)
  dalam NixOS Manual untuk dokumentasi konfigurasi tingkat sistem.
- Cari kata kunci langsung dalam kode sumber [nixpkgs](https://github.com/NixOS/nixpkgs)
  di GitHub.

## Rujukan {#references}

- [Overview of the NixOS Linux distribution](https://wiki.nixos.org/wiki/Overview_of_the_NixOS_Linux_distribution)
