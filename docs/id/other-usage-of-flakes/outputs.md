# Output Flake {#flake-outputs}

Dalam `flake.nix`, bagian `outputs` mendefinisikan berbagai output yang bisa dihasilkan
flake selama proses build. Flake bisa memiliki beberapa output sekaligus, termasuk tetapi
tidak terbatas pada:

- Paket Nix: Dinamai `apps.<system>.<name>`, `packages.<system>.<name>`, atau
  `legacyPackages.<system>.<name>`. Kamu bisa membangun paket tertentu dengan perintah
  `nix build .#<name>`.
- Fungsi pembantu Nix: Dinamai `lib.<name>` dan berfungsi sebagai pustaka untuk dipakai
  flake lain.
- Lingkungan pengembangan Nix: Dinamai `devShells` dan menyediakan lingkungan pengembangan
  terisolasi. Lingkungan ini bisa diakses dengan perintah `nix develop`.
- Konfigurasi NixOS: Dinamai `nixosConfiguration` dan mewakili konfigurasi sistem NixOS
  tertentu. Kamu bisa mengaktifkan konfigurasi dengan perintah
  `nixos-rebuild switch --flake .#<name>`.
- Templat Nix: Dinamai `templates` dan bisa dipakai sebagai titik awal pembuatan proyek
  baru. Kamu bisa menghasilkan proyek dengan perintah
  `nix flake init --template <reference>`.
- Output lain yang ditentukan pengguna: Output ini bisa didefinisikan pengguna dan mungkin
  dipakai oleh alat lain yang terkait dengan Nix.

Lihat dokumentasi resmi untuk rinciannya — [Nix flakes - Nix Manual].

Berikut cuplikan contoh dari NixOS Wiki yang memperlihatkan struktur bagian `outputs`:

```nix
{
  inputs = {
    # ......
  };

  outputs = { self, ... }@inputs: {
    # Executed by `nix flake check`
    checks."<system>"."<name>" = derivation;
    # Executed by `nix build .#<name>`
    packages."<system>"."<name>" = derivation;
    # Executed by `nix build .`
    packages."<system>".default = derivation;
    # Executed by `nix run .#<name>`
    apps."<system>"."<name>" = {
      type = "app";
      program = "<store-path>";
    };
    # Executed by `nix run . -- <args?>`
    apps."<system>".default = { type = "app"; program = "..."; };

    # Formatter (alejandra, nixfmt or nixpkgs-fmt)
    formatter."<system>" = derivation;
    # Used for nixpkgs packages, also accessible via `nix build .#<name>`
    legacyPackages."<system>"."<name>" = derivation;
    # Overlay, consumed by other flakes
    overlays."<name>" = final: prev: { };
    # Default overlay
    overlays.default = {};
    # Nixos module, consumed by other flakes
    nixosModules."<name>" = { config }: { options = {}; config = {}; };
    # Default module
    nixosModules.default = {};
    # Used with `nixos-rebuild --flake .#<hostname>`
    # nixosConfigurations."<hostname>".config.system.build.toplevel must be a derivation
    nixosConfigurations."<hostname>" = {};
    # Used by `nix develop .#<name>`
    devShells."<system>"."<name>" = derivation;
    # Used by `nix develop`
    devShells."<system>".default = derivation;
    # Hydra build jobs
    hydraJobs."<attr>"."<system>" = derivation;
    # Used by `nix flake init -t <flake>#<name>`
    templates."<name>" = {
      path = "<store-path>";
      description = "template description goes here?";
    };
    # Used by `nix flake init -t <flake>`
    templates.default = { path = "<store-path>"; description = ""; };
  };
}
```

## Rujukan {#references}

- [Nix flakes - Nix Manual]

[Nix flakes - Nix Manual]:
  https://nix.dev/manual/nix/stable/command-ref/new-cli/nix3-flake.html#flake-outputs
