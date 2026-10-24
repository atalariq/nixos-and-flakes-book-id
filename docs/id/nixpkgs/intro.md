# Penggunaan Lanjutan Nixpkgs {#nixpkgs-s-advanced-usage}

`callPackage`, `Overriding`, dan `Overlays` adalah teknik yang terkadang dipakai saat
menggunakan Nix untuk menyesuaikan cara build paket Nix.

Kita tahu banyak program memiliki sejumlah besar parameter build yang perlu dikonfigurasi.
Pengguna yang berbeda mungkin menginginkan parameter build yang berbeda pula. Di sinilah
`Overriding` dan `Overlays` berguna. Berikut beberapa contoh yang pernah saya temui:

1. [`fcitx5-rime.nix`](https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix):
   Secara bawaan, `fcitx5-rime` memakai `rime-data` sebagai nilai `rimeDataPkgs`, tetapi
   parameter ini bisa disesuaikan dengan `override`.
2. [`vscode/with-extensions.nix`](https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/applications/editors/vscode/with-extensions.nix):
   Paket untuk VS Code ini juga bisa disesuaikan dengan menimpa nilai `vscodeExtensions`.
   Dengan begitu, kita bisa memasang plugin kustom ke VS Code.
   - [`nix-vscode-extensions`](https://github.com/nix-community/nix-vscode-extensions):
     Pengelola plugin vscode yang diimplementasikan dengan menimpa `vscodeExtensions`.
3. [`firefox/common.nix`](https://github.com/NixOS/nixpkgs/blob/416ffcd08f1f16211130cd9571f74322e98ecef6/pkgs/applications/networking/browsers/firefox/common.nix):
   Firefox juga memiliki banyak parameter yang bisa disesuaikan.
4. ...

Singkatnya, `callPackage`, `Overriding`, dan `Overlays` bisa dipakai untuk menyesuaikan
parameter build paket Nix.
