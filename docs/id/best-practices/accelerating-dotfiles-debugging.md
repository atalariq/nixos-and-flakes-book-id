# Mempercepat Debugging Dotfiles {#accelerating-dotfiles-debugging}

Setelah mengelola Dotfiles dengan Home Manager, kita mungkin menemui masalah: setiap
perubahan Dotfiles memerlukan `sudo nixos-rebuild switch` agar berlaku. (Atau
`home-manager switch` jika memakai Home Manager secara mandiri.) Namun, perintah ini
menghitung ulang seluruh keadaan sistem setiap kali dijalankan. Ini menyiksa, meskipun Nix
sudah memiliki banyak mekanisme cache untuk mempercepat perhitungannya.

Ambil contoh konfigurasi Neovim/Emacs saya. Saya sering mengubahnya, terkadang puluhan
bahkan ratusan kali sehari. Harus menunggu `nixos-rebuild` selama puluhan detik setiap
kali benar-benar membuang waktu.

Untungnya, Home Manager menyediakan fungsi [mkOutOfStoreSymlink][mkOutOfStoreSymlink],
yang membuat tautan simbolis ke path absolut Dotfiles. Isinya tetap berada dalam direktori
home, alih-alih disalin ke Nix store, sehingga perubahan langsung berlaku.

Cara ini efektif dengan syarat isi Dotfiles tidak dihasilkan oleh Nix. Misalnya,
konfigurasi Emacs/Neovim saya ditulis dalam format aslinya dan hanya ditautkan ke lokasi
yang tepat melalui `home.file` atau `xdg.configFile` milik Nix Home-Manager.

Berikut penjelasan singkat penggunaan fungsi ini untuk mempercepat debugging Dotfiles.

Misalkan konfigurasi Neovim berada di `~/nix-config/home/nvim`. Tambahkan kode berikut ke
konfigurasi Home Manager (misalnya `~/nix-config/home/default.nix`):

```nix
{ config, pkgs, ... }: let
  # path to your nvim config directory
  nvimPath = "${config.home.homeDirectory}/nix-config/home/nvim";
  # path to your doom emacs config directory
  doomPath = "${config.home.homeDirectory}/nix-config/home/doom";
in
{
  xdg.configFile."nvim".source = config.lib.file.mkOutOfStoreSymlink nvimPath;
  xdg.configFile."doom".source = config.lib.file.mkOutOfStoreSymlink doomPath;
  # other configurations
}
```

Setelah mengubah konfigurasi, jalankan `sudo nixos-rebuild switch` (atau
`home-manager switch` jika memakai Home Manager secara mandiri) untuk menerapkannya. Sejak
saat itu, perubahan apa pun pada `~/nix-config/home/nvim` atau `~/nix-config/home/doom`
akan langsung terlihat oleh Neovim/Emacs.

Dengan begitu, kamu bisa mengelola semua Dotfiles melalui satu repositori nix-config.
Konfigurasi non-Nix yang sering diubah bisa langsung berlaku, tanpa terpengaruh Nix.

> **Catatan**
>
> - Teruskan path sebagai **string absolut**, seperti contoh di atas. Literal path seperti
>   `./nvim` disalin ke Nix store saat flake dievaluasi, sehingga tautan simbolis akan
>   menunjuk ke salinan sesaat yang hanya bisa dibaca. Perubahanmu tidak lagi berlaku, dan
>   berkasnya akan dimiliki `root`/`nixbld`.
> - Isi yang ditautkan berada di luar Nix store: tidak dicatat dalam `flake.lock` dan
>   tidak tercakup pengumpulan sampah. Tautan simbolisnya tetap dideklarasikan dalam Nix,
>   sehingga isinya harus kamu sediakan sendiri. Pastikan berkasnya sudah ada pada path
>   absolut tersebut, misalnya dengan mengkloning repositori dotfiles ke sana. Evaluasi
>   tetap murni (tidak memerlukan `--impure`).
> - `config` yang dipakai di sini harus milik modul Home Manager. Jika yang tersedia
>   justru `config` NixOS (misalnya definisi pengguna dan konfigurasi Home Manager berbagi
>   satu modul), `config.lib.file` tidak ada.
> - Jangan arahkan ke path yang sudah dikelola modul program. Jika
>   `programs.<name>.enable = true` menulis berkas yang sama, Home Manager melaporkan
>   konflik. Nonaktifkan modul tersebut dan kelola berkasnya sendiri.
> - Direktori yang ditautkan menjadi satu tautan simbolis, sehingga dengan sendirinya
>   bersifat rekursif (`recursive = true` tidak diperlukan). Semua isi di dalamnya pun
>   berada di luar kendali Home Manager.

[mkOutOfStoreSymlink]:
  https://github.com/nix-community/home-manager/blob/master/modules/files.nix
