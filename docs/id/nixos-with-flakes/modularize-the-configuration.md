# Memodulkan Konfigurasi NixOS {#modularize-your-nixos-configuration}

Sampai di sini, kerangka seluruh sistem sudah dikonfigurasi. Struktur konfigurasi saat ini
di `/etc/nixos` semestinya seperti berikut:

```shell
$ tree
.
├── flake.lock
├── flake.nix
├── home.nix
└── configuration.nix
```

Fungsi keempat berkas ini:

- `flake.lock`: Berkas pengunci versi yang dihasilkan otomatis. Berkas ini mencatat semua
  sumber input, nilai hash, dan nomor versi keseluruhan flake untuk memastikan
  reproduksibilitas.
- `flake.nix`: Berkas titik masuk yang dikenali dan diterapkan saat menjalankan
  `sudo nixos-rebuild switch`. Lihat
  [Flakes - NixOS Wiki](https://wiki.nixos.org/wiki/Flakes) untuk semua opsi flake.nix.
- `configuration.nix`: Diimpor sebagai modul Nix dalam flake.nix. Seluruh konfigurasi
  tingkat sistem saat ini ditulis di sini. Lihat
  [Configuration - NixOS Manual](https://nixos.org/manual/nixos/unstable/index.html#ch-configuration)
  untuk semua opsi configuration.nix.
- `home.nix`: Diimpor oleh Home-Manager sebagai konfigurasi pengguna `ryan` dalam
  flake.nix. Berkas ini memuat seluruh konfigurasi `ryan` dan mengelola folder home
  `ryan`. Lihat
  [Appendix A. Configuration Options - Home-Manager](https://nix-community.github.io/home-manager/options.xhtml)
  untuk semua opsi home.nix.

Dengan mengubah berkas-berkas ini, kamu bisa mengubah keadaan sistem dan direktori home
secara deklaratif.

Namun, seiring berkembangnya konfigurasi, mengandalkan `configuration.nix` dan `home.nix`
saja bisa membuat berkas membengkak dan sulit dipelihara. Solusi yang lebih baik adalah
memakai sistem modul Nix untuk memecah konfigurasi menjadi beberapa modul Nix dan
menuliskannya secara berkelompok.

Bahasa Nix menyediakan [fungsi import](https://nix.dev/tutorials/nix-language.html#import)
dengan aturan khusus:

> Jika parameter `import` berupa path folder, fungsi ini mengembalikan hasil eksekusi
> berkas `default.nix` dalam folder tersebut.

Sistem modul Nixpkgs menyediakan parameter serupa, `imports`, yang menerima daftar berkas
`.nix` dan **menggabungkan** seluruh konfigurasi yang didefinisikan di dalamnya ke modul
Nix saat ini.

Perhatikan bahwa `imports` tidak sekadar menimpa konfigurasi yang duplikat, melainkan
menanganinya dengan lebih masuk akal. Misalnya, jika `program.packages = [...]`
didefinisikan dalam beberapa modul, `imports` akan menggabungkan semua `program.packages`
dari seluruh modul Nix menjadi satu daftar. Attribute set juga bisa digabungkan dengan
benar. Perilaku spesifiknya bisa kamu jelajahi sendiri.

> Saya hanya menemukan penjelasan `imports` dalam
> [Nixpkgs-Unstable Official Manual - evalModules Parameters](https://nixos.org/manual/nixpkgs/unstable/#module-system-lib-evalModules-parameters):
> `Daftar modul. Modul-modul ini digabungkan untuk membentuk konfigurasi akhir.` Agak
> ambigu...

Dengan bantuan `imports`, kita bisa memecah `home.nix` dan `configuration.nix` menjadi
beberapa modul Nix yang didefinisikan dalam berkas `.nix` berbeda. Mari lihat contoh modul
`packages.nix`:

```nix
{
  config,
  pkgs,
  ...
}: {
  imports = [
    (import ./special-fonts-1.nix {inherit config pkgs;}) # (1)
    ./special-fonts-2.nix # (2)
  ];

  fontconfig.enable = true;
}
```

Modul ini memuat dua modul lain pada bagian imports, yaitu `special-fonts-1.nix` dan
`special-fonts-2.nix`. Kedua berkas itu sendiri merupakan modul dan bentuknya serupa ini.

```nix
{ config, pkgs, ...}: {
  # Configuration stuff ...
}
```

Kedua pernyataan impor di atas setara dalam hal parameter yang diterima:

- Pernyataan `(1)` mengimpor fungsi dalam `special-fonts-1.nix` dan memanggilnya dengan
  meneruskan `{config = config; pkgs = pkgs}`. Pada dasarnya, nilai kembalian pemanggilan
  itu (_attribute set_ konfigurasi parsial lain) dipakai dalam daftar `imports`.

- Pernyataan `(2)` mendefinisikan path ke sebuah modul. Nix akan memuat fungsinya secara
  _otomatis_ saat menyusun konfigurasi `config`. Semua argumen yang cocok dari fungsi
  dalam `packages.nix` diteruskan ke fungsi yang dimuat dalam `special-fonts-2.nix`.
  Hasilnya adalah `import ./special-fonts-2.nix {config = config; pkgs = pkgs}`.

Berikut contoh awal pemodulan konfigurasi yang bagus, sangat disarankan:

- [Misterio77/nix-starter-configs](https://github.com/Misterio77/nix-starter-configs)

Contoh yang lebih rumit,
[ryan4yin/nix-config/i3-kickstarter](https://github.com/ryan4yin/nix-config/tree/i3-kickstarter),
adalah konfigurasi sistem NixOS saya sebelumnya yang memakai pengelola jendela i3.
Strukturnya sebagai berikut:

```shell
├── flake.lock
├── flake.nix
├── home
│   ├── default.nix         # here we import all submodules by imports = [...]
│   ├── fcitx5              # fcitx5 input method's configuration
│   │   ├── default.nix
│   │   └── rime-data-flypy
│   ├── i3                  # i3 window manager's configuration
│   │   ├── config
│   │   ├── default.nix
│   │   ├── i3blocks.conf
│   │   ├── keybindings
│   │   └── scripts
│   ├── programs
│   │   ├── browsers.nix
│   │   ├── common.nix
│   │   ├── default.nix   # here we import all modules in programs folder by imports = [...]
│   │   ├── git.nix
│   │   ├── media.nix
│   │   ├── vscode.nix
│   │   └── xdg.nix
│   ├── rofi              #  rofi launcher's configuration
│   │   ├── configs
│   │   │   ├── arc_dark_colors.rasi
│   │   │   ├── arc_dark_transparent_colors.rasi
│   │   │   ├── power-profiles.rasi
│   │   │   ├── powermenu.rasi
│   │   │   ├── rofidmenu.rasi
│   │   │   └── rofikeyhint.rasi
│   │   └── default.nix
│   └── shell             # shell/terminal related configuration
│       ├── common.nix
│       ├── default.nix
│       ├── nushell
│       │   ├── config.nu
│       │   ├── default.nix
│       │   └── env.nu
│       ├── starship.nix
│       └── terminals.nix
├── hosts
│   ├── msi-rtx4090      # My main machine's configuration
│   │   ├── default.nix  # This is the old configuration.nix, but most of the content has been split out to modules.
│   │   └── hardware-configuration.nix  # hardware & disk related configuration, autogenerated by nixos
│   └── my-nixos       # my test machine's configuration
│       ├── default.nix
│       └── hardware-configuration.nix
├── modules          # some common NixOS modules that can be reused
│   ├── i3.nix
│   └── system.nix
└── wallpaper.jpg    # wallpaper
```

Tidak perlu mengikuti struktur di atas. Kamu bisa menata konfigurasi sesukamu. Kuncinya
adalah memakai `imports` untuk mengimpor semua submodul ke modul utama.

## `lib.mkOverride`, `lib.mkDefault`, dan `lib.mkForce` {#lib-mkoverride-lib-mkdefault-and-lib-mkforce}

Dalam Nix, sebagian orang memakai `lib.mkDefault` dan `lib.mkForce` untuk mendefinisikan
nilai. Fungsi-fungsi ini dirancang untuk menetapkan nilai bawaan atau memaksakan nilai
opsi.

Kamu bisa menjelajahi kode sumber `lib.mkDefault` dan `lib.mkForce` dengan menjalankan
`nix repl -f '<nixpkgs>'`, lalu memasukkan `:e lib.mkDefault`. Untuk mempelajari
`nix repl` lebih lanjut, ketik `:?` untuk melihat bantuan.

Berikut kode sumbernya:

```nix
  # ......

  mkOverride = priority: content: {
    _type = "override";
    inherit priority content;
  };

  mkOptionDefault = mkOverride 1500; # priority of option defaults
  mkDefault = mkOverride 1000; # used in config sections of non-user modules to set a default
  defaultOverridePriority = 100;
  mkImageMediaOverride = mkOverride 60; # image media profiles can be derived by inclusion into host config, hence needing to override host config, but do allow user to mkForce
  mkForce = mkOverride 50;
  mkVMOverride = mkOverride 10; # used by ‘nixos-rebuild build-vm’

  # ......
```

Singkatnya, `lib.mkDefault` menetapkan nilai bawaan opsi dengan prioritas internal 1000,
dan `lib.mkForce` memaksakan nilai opsi dengan prioritas internal 50. Jika nilai opsi
ditetapkan langsung, prioritas bawaannya adalah 100 (didefinisikan oleh
`defaultoverridepriority`). Prioritas ini lebih tinggi daripada `lib.mkDefault`, sehingga
nilai bawaan akan ditimpa.

Semakin kecil nilai `priority`, semakin tinggi prioritas sebenarnya. Karena itu,
`lib.mkForce` memiliki prioritas lebih tinggi daripada `lib.mkDefault`. Jika kamu
mendefinisikan beberapa nilai dengan prioritas sama, Nix akan melaporkan kesalahan.

Fungsi-fungsi ini sangat membantu dalam memodulkan konfigurasi. Kamu bisa menetapkan nilai
bawaan dalam modul tingkat rendah (modul dasar) dan memaksakan nilai dalam modul tingkat
tinggi.

Misalnya, dalam konfigurasi saya di
[ryan4yin/nix-config/blob/c515ea9/modules/nixos/core-server.nix](https://github.com/ryan4yin/nix-config/blob/c515ea9/modules/nixos/core-server.nix#L32),
saya mendefinisikan nilai bawaan seperti ini:

```nix{6}
{ lib, pkgs, ... }:

{
  # ......

  nixpkgs.config.allowUnfree = lib.mkDefault false;

  # ......
}
```

Lalu, untuk mesin desktop, saya menimpa nilainya dalam
[ryan4yin/nix-config/blob/c515ea9/modules/nixos/core-desktop.nix](https://github.com/ryan4yin/nix-config/blob/c515ea9/modules/nixos/core-desktop.nix#L18)
seperti ini:

```nix{10}
{ lib, pkgs, ... }:

{
  # import the base module
  imports = [
    ./core-server.nix
  ];

  # override the default value defined in the base module
  nixpkgs.config.allowUnfree = lib.mkForce true;

  # ......
}
```

## `lib.mkOrder`, `lib.mkBefore`, dan `lib.mkAfter` {#lib-mkorder-lib-mkbefore-and-lib-mkafter}

Selain `lib.mkDefault` dan `lib.mkForce`, ada pula `lib.mkBefore` dan `lib.mkAfter`, yang
dipakai untuk menentukan urutan penggabungan **opsi bertipe daftar**. Fungsi-fungsi ini
semakin membantu pemodulan konfigurasi.

> Saya belum menemukan dokumentasi resmi tentang opsi bertipe daftar. Pemahaman sederhana
> saya: ini adalah tipe yang hasil penggabungannya dipengaruhi urutan penggabungan.
> Berdasarkan pemahaman ini, tipe `list` maupun `string` termasuk opsi bertipe daftar.
> Dalam praktiknya, fungsi-fungsi ini memang bisa dipakai pada kedua tipe tersebut.

Seperti disebutkan sebelumnya, jika kamu mendefinisikan beberapa nilai dengan **prioritas
penimpaan** yang sama, Nix akan melaporkan kesalahan. Namun, dengan `lib.mkOrder`,
`lib.mkBefore`, atau `lib.mkAfter`, kamu bisa mendefinisikan beberapa nilai dengan
prioritas penimpaan sama, dan nilainya akan digabungkan sesuai urutan yang ditentukan.

Untuk memeriksa kode sumber `lib.mkBefore`, jalankan `nix repl -f '<nixpkgs>'`, lalu
masukkan `:e lib.mkBefore`. Untuk mempelajari `nix repl` lebih lanjut, ketik `:?` untuk
melihat bantuan:

```nix
  # ......

  mkOrder = priority: content:
    { _type = "order";
      inherit priority content;
    };

  mkBefore = mkOrder 500;
  defaultOrderPriority = 1000;
  mkAfter = mkOrder 1500;

  # ......
```

Jadi, `lib.mkBefore` adalah bentuk singkat `lib.mkOrder 500`, dan `lib.mkAfter` adalah
bentuk singkat `lib.mkOrder 1500`.

Untuk menguji penggunaan `lib.mkBefore` dan `lib.mkAfter`, mari buat proyek Flake
sederhana:

```nix{8-36}
# flake.nix
{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
  outputs = {nixpkgs, ...}: {
    nixosConfigurations = {
      "my-nixos" = nixpkgs.lib.nixosSystem {
        modules = [
          ({lib, ...}: {
            programs.bash.shellInit = lib.mkBefore ''
              echo 'insert before default'
            '';
            programs.zsh.shellInit = lib.mkBefore "echo 'insert before default';";
            nix.settings.substituters = lib.mkBefore [
              "https://nix-community.cachix.org"
            ];
          })

          ({lib, ...}: {
            programs.bash.shellInit = lib.mkAfter ''
              echo 'insert after default'
            '';
            programs.zsh.shellInit = lib.mkAfter "echo 'insert after default';";
            nix.settings.substituters = lib.mkAfter [
              "https://ryan4yin.cachix.org"
            ];
          })

          ({lib, ...}: {
            programs.bash.shellInit = ''
              echo 'this is default'
            '';
            programs.zsh.shellInit = "echo 'this is default';";
            nix.settings.substituters = [
              "https://nix-community.cachix.org"
            ];
          })
        ];
      };
    };
  };
}
```

Flake di atas memuat penggunaan `lib.mkBefore` dan `lib.mkAfter` pada string multibaris,
string satu baris, dan daftar. Mari uji hasilnya:

```bash
# Example 1: multiline string merging
› echo $(nix eval .#nixosConfigurations.my-nixos.config.programs.bash.shellInit)
trace: warning: system.stateVersion is not set, defaulting to 26.05. Read why this matters on https://nixos.org/manual/nixos/stable/options.html#opt-system.stateVersio
n.
"echo 'insert before default'

echo 'this is default'

if [ -z \"$__NIXOS_SET_ENVIRONMENT_DONE\" ]; then
 . /nix/store/60882lm9znqdmbssxqsd5bgnb7gybaf2-set-environment
fi



echo 'insert after default'
"

# example 2: single-line string merging
› echo $(nix eval .#nixosConfigurations.my-nixos.config.programs.zsh.shellInit)
"echo 'insert before default';
echo 'this is default';
echo 'insert after default';"

# Example 3: list merging
› nix eval .#nixosConfigurations.my-nixos.config.nix.settings.substituters
[ "https://nix-community.cachix.org" "https://nix-community.cachix.org" "https://cache.nixos.org/" "https://ryan4yin.cachix.org" ]

```

Seperti terlihat, `lib.mkBefore` dan `lib.mkAfter` bisa menentukan urutan penggabungan
string multibaris, string satu baris, dan daftar. Urutan penggabungannya sama dengan
urutan definisinya.

> Untuk pengantar sistem modul yang lebih mendalam, lihat
> [Sistem Modul & Opsi Kustom](../other-usage-of-flakes/module-system.md).

## Rujukan {#references}

- [Nix modules: Improving Nix's discoverability and usability](http://web.archive.org/web/20230606000903/https://cfp.nixcon.org/nixcon2020/talk/K89WJY/)
- [Module System - Nixpkgs](https://github.com/NixOS/nixpkgs/blob/nixos-26.05/doc/module-system/module-system.chapter.md)
