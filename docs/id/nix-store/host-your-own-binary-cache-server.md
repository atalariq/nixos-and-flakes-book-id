# Menjalankan Server Cache Biner Nix Sendiri {#host-your-own-nix-binary-cache-server}

## Pengantar {#introduction}

Cache biner Nix adalah implementasi Nix Store yang menyimpan data di server jarak jauh,
bukan secara lokal, sehingga memudahkan pembagian cache biner di antara beberapa mesin.

Server cache biner resmi Nix hanya menyediakan biner yang dibangun dengan parameter
standar. Jika parameter build diubah atau paket di luar Nixpkgs dipakai, Nix tidak akan
menemukan cache biner yang sesuai. Akibatnya, build dilakukan secara lokal.

Hanya mengandalkan Nix Store lokal `/nix/store` bisa merepotkan. Kamu harus membangun
ulang semua paket kustom pada setiap mesin, yang bisa memakan waktu dan banyak memori.
Keadaan ini lebih buruk pada platform berkinerja rendah seperti Raspberry Pi.

Dokumen ini akan memperlihatkan cara menyiapkan server cache biner Nix sendiri dengan
layanan S3 (seperti MinIO), untuk berbagi hasil build antar-mesin dan mengatasi masalah
tadi.

## Prasyarat {#prerequisites}

1. Host NixOS
1. Server MinIO yang sudah berjalan
   1. Jika belum, ikuti
      [panduan deployment resmi](https://min.io/docs/minio/linux/operations/installation.html)
      MinIO.
1. Server MinIO memerlukan sertifikat digital TLS yang valid, baik publik maupun privat.
   Contoh ini memakai `https://minio.homelab.local` dengan sertifikat privat.
1. Pasang `minio-client`

## Menghasilkan Kata Sandi {#generating-a-password}

```bash
nix run nixpkgs#pwgen -- -c -n -y -s -B 32 1
# => oenu1Yuch3rohz2ahveid0koo4giecho
```

## Menyiapkan Klien MinIO {#setting-up-the-minio-client}

Pasang klien baris perintah MinIO, `mc`.

```nix
{ pkgs, ... }:
{
  environment.systemPackages = with pkgs; [
    minio-client # Alternatives for ls, cp, mkdir, diff, and rsync commands for file systems and object storage
  ];
}
```

Buat `~/.mc/config.json` dengan isi berikut (ganti parameter kunci dengan milikmu
sendiri):

```json
{
  "version": "10",
  "aliases": {
    "s3": {
      "url": "https://s3.homelab.local",
      "accessKey": "minio",
      "secretKey": "oenu1Yuch3rohz2ahveid0koo4giecho",
      "api": "s3v4",
      "path": "auto"
    }
  }
}
```

Karena Nix berinteraksi langsung dengan bucket S3, kita perlu mengatur kredensial S3 bagi
semua mesin yang memerlukan akses ke cache biner Nix.

Buat `~/.aws/credentials` dengan isi berikut (ganti `<nixbuildersecret>` dengan kata sandi
yang dihasilkan perintah `pwgen`).

```ini
[nixbuilder]
aws_access_key_id=nixbuilder
aws_secret_access_key=<nixbuildersecret>
```

## Menyiapkan Bucket S3 sebagai Cache Biner {#setting-up-s3-bucket-as-binary-cache}

Buat bucket `nix-cache` dengan klien minio:

```bash
mc mb s3/nix-cache
```

Buat pengguna `nixbuilder` untuk MinIO dan tetapkan kata sandinya:

```bash
mc admin user add s3 nixbuilder <PASSWORD>
```

Buat berkas bernama `nix-cache-write.json` dalam direktori kerja saat ini dengan isi
berikut:

```json
{
  "Id": "AuthenticatedWrite",
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AuthenticatedWrite",
      "Action": [
        "s3:AbortMultipartUpload",
        "s3:GetBucketLocation",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:ListBucketMultipartUploads",
        "s3:ListMultipartUploadParts",
        "s3:PutObject"
      ],
      "Effect": "Allow",
      "Resource": ["arn:aws:s3:::nix-cache", "arn:aws:s3:::nix-cache/*"],
      "Principal": "nixbuilder"
    }
  ]
}
```

Sekarang, buat kebijakan pengunggahan berkas ke S3 memakai berkas `nix-cache-write.json`:

```bash
mc admin policy create s3 nix-cache-write nix-cache-write.json
```

Hubungkan kebijakan S3 yang baru dibuat dengan pengguna `nixbuilder`:

```bash
mc admin policy attach s3 nix-cache-write -user nixbuilder
```

Izinkan pengguna anonim mengunduh berkas tanpa autentikasi, agar semua server Nix bisa
langsung mengambil data dari cache S3 ini:

```bash
mc anonymous set download s3/nix-cache
```

Terakhir, tambahkan berkas `nix-cache-info` ke direktori akar bucket S3. Nix memerlukan
berkas ini untuk mencatat beberapa informasi terkait cache biner:

```bash
cat > nix-cache-info <<EOF
StoreDir: /nix/store
WantMassQuery: 1
Priority: 40
EOF
# Copy `nix-cache-info` to the S3 bucket
mc cp ./nix-cache-info s3/nix-cache/nix-cache-info
```

## Menghasilkan Pasangan Kunci Tanda Tangan {#generating-signature-key-pair}

Seperti disebutkan sebelumnya, cache biner Nix memakai mekanisme tanda tangan kunci publik
untuk memverifikasi asal dan integritas data. Jadi, kita perlu menghasilkan pasangan kunci
agar mesin build Nix bisa menandatangani cache biner. Nama kunci bebas, tetapi pengembang
NixOS sangat menyarankan domain cache diikuti bilangan bulat. Jika kunci perlu dicabut
atau dihasilkan ulang, kamu cukup menaikkan angka di bagian akhirnya.

```bash
nix key generate-secret --key-name s3.homelab.local-1 > ~/.config/nix/secret.key
nix key convert-secret-to-public < ~/.config/nix/secret.key > ~/.config/nix/public.key
cat ~/.config/nix/public.key
# => s3.homelab.local-1:m0J/oDlLEuG6ezc6MzmpLCN2MYjssO3NMIlr9JdxkTs=
```

## Memakai Cache Biner S3 dalam `flake.nix` {#using-s3-binary-cache-in-flake-nix}

Tambahkan berikut ini ke `configuration.nix` atau modul NixOS kustom mana pun:

```nix
{
  nix = {
    settings = {
      # The substituter will be appended to the default substituters when fetching packages.
      extra-substituters = [
        "https://s3.homelab.local/nix-cache/"
      ];
      extra-trusted-public-keys = [
        "s3.homelab.local-1:m0J/oDlLEuG6ezc6MzmpLCN2MYjssO3NMIlr9JdxkTs="
      ];
    };
  };
}
```

Bangun ulang sistem untuk mulai memakai cache biner S3 yang baru kita buat:

```bash
sudo nixos-rebuild switch --upgrade --flake .#<HOST>
```

## Mengirim Path Store ke Cache Biner {#pushing-store-paths-to-binary-cache}

Tandatangani beberapa path dalam store lokal.

```bash
nix store sign --recursive --key-file ~/.config/nix/secret.key /run/current-system
```

Salin path-path ini ke cache:

```bash
nix copy --to 's3://nix-cache?profile=nixbuilder&endpoint=s3.homelab.local' /run/current-system
```

## Menambahkan Kebijakan Kedaluwarsa Objek Otomatis {#adding-automatic-object-expiration-policy}

```bash
mc ilm rule add s3/nix-cache --expire-days "DAYS"
# For example: mc ilm rule add s3/nix-cache --expire-days "7"
```

Ini menetapkan kebijakan kedaluwarsa bagi objek dalam bucket S3, sehingga objek otomatis
dihapus setelah jumlah hari yang ditentukan.

Ini berguna untuk menjaga ukuran cache tetap terkendali dan memastikan biner usang tidak
disimpan selamanya.

## Rujukan {#references}

- [Binary cache in the NixOS wiki](https://wiki.nixos.org/wiki/Binary_Cache)
- [Serving a Nix store via S3 in the NixOS manual](https://nixos.org/manual/nix/stable/package-management/s3-substituter.html)
- [Serving a Nix store via HTTP in the NixOS manual](https://nixos.org/manual/nix/stable/package-management/binary-cache-substituter.html)
