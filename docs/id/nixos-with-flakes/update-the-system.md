# Memperbarui Sistem {#updating-the-system}

Dengan Flakes, memperbarui sistem sangat mudah. Cukup jalankan perintah berikut di
`/etc/nixos` atau lokasi lain tempat kamu menyimpan konfigurasi:

> **CATATAN**: Direktori `/etc/nixos` dimiliki oleh `root` dan hanya bisa ditulisi oleh
> `root`. Jadi, jika flake berada di direktori ini, kamu perlu memakai `sudo` untuk
> memperbarui berkas konfigurasi apa pun.

```shell
# Update flake.lock
nix flake update

# Or update only the specific input, such as home-manager:
nix flake update home-manager

# Apply the updates (if your configuration is in /etc/nixos, you can omit --flake .)
sudo nixos-rebuild switch --flake .
```

Sesekali, kamu mungkin menemui kesalahan "sha256 mismatch" saat menjalankan
`nixos-rebuild switch`. Kesalahan ini bisa diatasi dengan memperbarui `flake.lock` memakai
`nix flake update`.
