# Deployment Jarak Jauh {#remote-deployment}

Rancangan dasar Nix sangat cocok untuk deployment jarak jauh. Komunitas Nix menawarkan
beberapa alat khusus untuk keperluan ini, seperti
[colmena](https://github.com/nix-community/colmena) dan
[deploy-rs](https://github.com/serokell/deploy-rs). Selain itu, alat resmi yang sudah
sering kita pakai, `nixos-rebuild`, juga memiliki kemampuan deployment jarak jauh.

Dalam penggunaan beberapa arsitektur, deployment jarak jauh bisa memanfaatkan dukungan
multiarsitektur Nix secara optimal. Misalnya, kamu bisa mengompilasi silang sistem NixOS
aarch64/riscv64 pada host x86_64, lalu menerapkannya ke host yang sesuai melalui SSH.

Belakangan, saya mengompilasi silang image sistem NixOS untuk SBC RISCV64 di mesin lokal.
Karena itu, saya sudah memiliki semua cache kompilasi untuk membangun sistem ini secara
lokal. Namun, karena tidak ada cache biner resmi untuk arsitektur RISCV64, menjalankan
program yang belum terpasang langsung di papan pengembangan memicu kompilasi
besar-besaran. Misalnya, `nix run nixpkgs#cowsay hello`. Proses ini memakan waktu
berjam-jam, yang sungguh tidak bisa diterima.

Dengan deployment jarak jauh, saya bisa memanfaatkan sepenuhnya daya komputasi CPU lokal
yang berkinerja tinggi dan cache kompilasi yang besar. Peralihan ini sangat memperbaiki
pengalaman saya dan jauh mengurangi masalah kompilasi yang sebelumnya memakan waktu.

Mari saya pandu secara singkat penggunaan `colmena` atau `nixos-rebuild` untuk deployment
jarak jauh.

## Prasyarat {#prerequisites}

Sebelum memulai deployment jarak jauh, ada beberapa persiapan yang diperlukan:

1. Untuk mencegah kegagalan verifikasi kata sandi sudo pada host jarak jauh, pilih salah
   satu cara berikut:
   1. Lakukan deployment sebagai pengguna `root` host jarak jauh.
   2. Tambahkan `security.sudo.wheelNeedsPassword = false;` ke konfigurasi host jarak
      jauh, lalu lakukan deployment manual sekali terlebih dahulu untuk memberikan izin
      sudo tanpa kata sandi kepada pengguna.
      1. **Ini memungkinkan program tingkat pengguna memperoleh izin sudo secara
         diam-diam, sehingga menimbulkan risiko keamanan**! Jadi, jika memilih cara ini,
         sebaiknya buat pengguna khusus untuk deployment jarak jauh, alih-alih memakai
         akun pengguna sehari-hari!
2. Atur autentikasi kunci publik SSH untuk host jarak jauh.
   1. Gunakan opsi `users.users.<name>.openssh.authorizedKeys.keys` untuk melakukannya.
3. Tambahkan catatan Known Hosts host jarak jauh ke mesin lokal. Jika tidak,
   colmena/nixos-rebuild akan gagal melakukan deployment karena tidak bisa memverifikasi
   identitas host jarak jauh.
   1. Gunakan opsi `programs.ssh.knownHosts` untuk menambahkan kunci publik host jarak
      jauh ke catatan Known Hosts.
4. Jalankan `ssh root@<you-host>` secara manual untuk memastikan kamu bisa masuk ke host
   jarak jauh.
   1. Jika menemui masalah, selesaikan sebelum melanjutkan.

Sebaiknya gunakan pengguna `root` untuk deployment karena lebih praktis dan menghindari
kerumitan izin sudo.

Dengan asumsi kita akan melakukan deployment jarak jauh memakai root, langkah awalnya
adalah mengatur autentikasi kunci publik SSH untuk root pada host jarak jauh. Cukup
tambahkan isi berikut ke Modul NixOS mana pun dalam konfigurasi Nix host tersebut
(misalnya `configuration.nix`), lalu bangun ulang sistemnya:

```nix{6-9}
# configuration.nix
{

  # ...

  users.users.root.openssh.authorizedKeys.keys = [
    # TODO Replace with your own SSH public key.
    "ssh-ed25519 AAAAC3Nxxxxx ryan@xxx"
  ];

  # ...
}
```

Selain itu, kamu perlu menambahkan kunci privat SSH ke SSH agent pada mesin lokal untuk
autentikasi selama deployment jarak jauh:

```bash
ssh-add ~/.ssh/your-private-key
```

## Deployment melalui `colmena` {#deploy-through-colmena}

`colmena` tidak langsung memakai `nixosConfigurations.xxx` yang sudah kita kenal untuk
deployment jarak jauh. Sebagai gantinya, alat ini menggunakan output flake khusus bernama
`colmena`. Strukturnya mirip dengan `nixosConfigurations.xxx`, tetapi tidak identik.

Dalam `flake.nix` sistem, tambahkan output baru bernama `colmena`. Berikut contoh
sederhananya:

```nix{11-34}
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";

    # ...
  };
  outputs = { self, nixpkgs }: {
    # ...

    # Add this output, colmena will read its contents for remote deployment
    colmena = {
      meta = {
        nixpkgs = import nixpkgs { system = "x86_64-linux"; };

        # This parameter functions similarly to `specialArgs` in `nixosConfigurations.xxx`,
        # used for passing custom arguments to all submodules.
        specialArgs = {
          inherit nixpkgs;
        };
      };

      # Host name = "my-nixos"
      "my-nixos" = { name, nodes, ... }: {
        # Parameters related to remote deployment
        deployment.targetHost = "192.168.5.42"; # Remote host's IP address
        deployment.targetUser = "root";  # Remote host's username

        # This parameter functions similarly to `modules` in `nixosConfigurations.xxx`,
        # used for importing all submodules.
        imports = [
          ./configuration.nix
        ];
      };
    };
  };
}
```

Kini kamu bisa menerapkan konfigurasi ke perangkat:

```bash
nix run nixpkgs#colmena apply
```

Untuk penggunaan lebih lanjut, rujuk dokumentasi resmi colmena di
<https://colmena.cli.rs/unstable/introduction.html>

## Deployment melalui `nixos-rebuild` {#deploy-through-nixos-rebuild}

Keuntungan memakai `nixos-rebuild` untuk deployment jarak jauh adalah caranya mirip dengan
deployment ke host lokal. Hanya diperlukan beberapa parameter tambahan untuk menentukan
alamat IP host jarak jauh, nama pengguna, dan detail lainnya.

Misalnya, untuk menerapkan konfigurasi yang didefinisikan dalam
`nixosConfigurations.my-nixos` pada flake ke host jarak jauh, gunakan perintah berikut:

```bash
nixos-rebuild switch --flake .#my-nixos \
  --target-host root@192.168.4.1 --build-host localhost --verbose
```

Perintah di atas membangun dan menerapkan konfigurasi `my-nixos` ke server dengan IP
`192.168.4.1`. Proses build sistem dilakukan secara lokal.

Jika lebih suka membangun konfigurasi pada host jarak jauh, ganti `--build-host localhost`
dengan `--build-host root@192.168.4.1`.

Agar tidak berulang kali memakai alamat IP, kamu bisa mendefinisikan alias host dalam
`~/.ssh/config` atau `/etc/ssh/ssh_config` pada mesin lokal. Misalnya:

> Seluruh konfigurasi SSH bisa dihasilkan melalui konfigurasi Nix. Tugas ini diserahkan
> kepadamu.

```bash
› cat ~/.ssh/config

# ......

Host aquamarine
  HostName 192.168.4.1
  Port 22

# ......
```

Dengan pengaturan ini, kamu bisa memakai alias host untuk deployment:

```bash
nixos-rebuild switch --flake .#my-nixos --target-host root@aquamarine --build-host root@aquamarine --verbose
```

Ini memberikan cara deployment yang lebih praktis dengan alias host yang sudah
didefinisikan.
