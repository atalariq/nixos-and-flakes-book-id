# Penggunaan CLI Baru {#usage-of-the-new-cli}

Setelah mengaktifkan fitur `nix-command` dan `flakes`, kamu bisa mulai memakai alat baris
perintah Nix generasi baru yang disediakan oleh [New Nix Commands][New Nix Commands]. Di
bagian ini, kita akan berfokus pada dua perintah: `nix shell` dan `nix run`. Perintah
penting lain seperti `nix build` akan dibahas secara terperinci dalam
[`nix develop` & `pkgs.mkShell`](../development/intro.md)

## `nix shell` {#nix-shell}

Perintah `nix shell` memungkinkanmu memasuki lingkungan dengan paket Nix yang ditentukan
dan membuka shell interaktif di dalam lingkungan tersebut:

```shell
# hello is not available
› hello
hello: command not found

# Enter an environment with the 'hello' and `cowsay` package
› nix shell nixpkgs#hello nixpkgs#cowsay

# hello is now available
› hello
Hello, world!

# cowsay is also available
› cowsay "Hello, world!"
 _______
< hello >
 -------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

## `nix run` {#nix-run}

Sementara itu, `nix run` membuat lingkungan dengan paket Nix yang ditentukan dan langsung
menjalankan paket itu di dalamnya (tanpa memasangnya ke lingkungan sistem):

```shell
# hello is not available
› hello
hello: command not found

# Create an environment with the 'hello' package and run it
› nix run nixpkgs#hello
Hello, world!
```

Karena `nix run` langsung menjalankan paket Nix, paket yang ditentukan sebagai argumen
harus menghasilkan program yang bisa dieksekusi.

Menurut dokumentasi `nix run --help`, `nix run` menjalankan perintah `<out>/bin/<name>`,
dengan `<out>` sebagai direktori akar derivation dan `<name>` dipilih dengan urutan
berikut:

- Atribut `meta.mainProgram` dari derivation
- Atribut `pname` dari derivation
- Isi atribut `name` dari derivation setelah nomor versinya dihapus

Misalnya, untuk paket 'hello' yang kita uji sebelumnya, `nix run` sebenarnya menjalankan
program `$out/bin/hello`.

Berikut dua contoh lain dengan penjelasan terperinci tentang parameter terkait:

```bash
# Explanation of the command:
#   `nixpkgs#ponysay` means the 'ponysay' package in the 'nixpkgs' flake.
#   `nixpkgs` is a flake registry id, and Nix will find the corresponding GitHub repository address
#   from <https://github.com/NixOS/flake-registry/blob/master/flake-registry.json>.
# Therefore, this command creates a new environment, installs, and runs the 'ponysay' package provided by the 'nixpkgs' flake.
#   Note: It has been mentioned earlier that a Nix package is one of the outputs of a flake.
echo "Hello Nix" | nix run "nixpkgs#ponysay"

# This command has the same effect as the previous one, but it uses the complete flake URI instead of the flake registry id.
echo "Hello Nix" | nix run "github:NixOS/nixpkgs/nixos-unstable#ponysay"
```

## Penggunaan Umum `nix run` dan `nix shell` {#common-use-cases-for-nix-run-and-nix-shell}

Perintah-perintah ini umum dipakai untuk menjalankan program sementara. Misalnya, saya
ingin mengkloning repositori konfigurasi dengan Git pada host NixOS baru yang belum
memiliki Git. Saya bisa memakai perintah berikut:

```bash
nix run nixpkgs#git clone git@github.com:ryan4yin/nix-config.git
```

Sebagai alternatif, saya bisa memakai `nix shell` untuk memasuki lingkungan dengan Git,
lalu menjalankan perintah `git clone`:

```bash
nix shell nixpkgs#git
git clone git@github.com:ryan4yin/nix-config.git
```

[New Nix Commands]: https://nixos.org/manual/nix/stable/command-ref/new-cli/nix.html
