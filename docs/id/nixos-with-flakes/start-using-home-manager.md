# Mulai Menggunakan Home Manager {#getting-started-with-home-manager}

Seperti disebutkan sebelumnya, NixOS hanya bisa mengelola konfigurasi tingkat sistem.
Untuk mengelola konfigurasi tingkat pengguna dalam direktori Home, kita perlu memasang
Home Manager.

Menurut [Home Manager Manual](https://nix-community.github.io/home-manager/index.xhtml)
resmi, untuk memasang Home Manager sebagai modul NixOS, kita perlu terlebih dahulu membuat
`/etc/nixos/home.nix`. Berikut contoh isinya:

```nix
{ config, pkgs, ... }:

{
  # Import files from the current configuration directory into the Nix store,
  # and create symbolic links pointing to those store files in the Home directory.

  # home.file.".config/i3/wallpaper.jpg".source = ./wallpaper.jpg;

  # Import the scripts directory into the Nix store,
  # and recursively generate symbolic links in the Home directory pointing to the files in the store.
  # home.file.".config/i3/scripts" = {
  #   source = ./scripts;
  #   recursive = true;   # link recursively
  #   executable = true;  # make all files executable
  # };

  # encode the file content in nix configuration file directly
  # home.file.".xxx".text = ''
  #     xxx
  # '';

  # set cursor size and dpi for 4k monitor
  xresources.properties = {
    "Xcursor.size" = 16;
    "Xft.dpi" = 172;
  };

  # Packages that should be installed to the user profile.
  home.packages = with pkgs; [
    # here is some command line tools I use frequently
    # feel free to add your own or remove some of them

    neofetch
    nnn # terminal file manager

    # archives
    zip
    xz
    unzip
    p7zip

    # utils
    ripgrep # recursively searches directories for a regex pattern
    jq # A lightweight and flexible command-line JSON processor
    yq-go # yaml processor https://github.com/mikefarah/yq
    eza # A modern replacement for ‘ls’
    fzf # A command-line fuzzy finder

    # networking tools
    mtr # A network diagnostic tool
    iperf3
    dnsutils  # `dig` + `nslookup`
    ldns # replacement of `dig`, it provide the command `drill`
    aria2 # A lightweight multi-protocol & multi-source command-line download utility
    socat # replacement of openbsd-netcat
    nmap # A utility for network discovery and security auditing
    ipcalc  # it is a calculator for the IPv4/v6 addresses

    # misc
    cowsay
    file
    which
    tree
    gnused
    gnutar
    gawk
    zstd
    gnupg

    # nix related
    #
    # it provides the command `nom` works just like `nix`
    # with more details log output
    nix-output-monitor

    # productivity
    hugo # static site generator
    glow # markdown previewer in terminal

    btop  # replacement of htop/nmon
    iotop # io monitoring
    iftop # network monitoring

    # system call monitoring
    strace # system call monitoring
    ltrace # library call monitoring
    lsof # list open files

    # system tools
    sysstat
    lm_sensors # for `sensors` command
    ethtool
    pciutils # lspci
    usbutils # lsusb
  ];

  # basic configuration of git, please change to your own
  programs.git = {
    enable = true;
    settings.user = {
      name = "ryan";
      email = "ryan@example.com";
    };
  };

  # starship - an customizable prompt for any shell
  programs.starship = {
    enable = true;
    # custom settings
    settings = {
      add_newline = false;
      aws.disabled = true;
      gcloud.disabled = true;
      line_break.disabled = true;
    };
  };

  # alacritty - a cross-platform, GPU-accelerated terminal emulator
  programs.alacritty = {
    enable = true;
    # custom settings
    settings = {
      env.TERM = "xterm-256color";
      font = {
        size = 12;
        draw_bold_text_with_bright_colors = true;
      };
      scrolling.multiplier = 5;
      selection.save_to_clipboard = true;
    };
  };

  programs.bash = {
    enable = true;
    enableCompletion = true;
    # TODO add your custom bashrc here
    bashrcExtra = ''
      export PATH="$PATH:$HOME/bin:$HOME/.local/bin:$HOME/go/bin"
    '';

    # set some aliases, feel free to add more or remove some
    shellAliases = {
      k = "kubectl";
      urldecode = "python3 -c 'import sys, urllib.parse as ul; print(ul.unquote_plus(sys.stdin.read()))'";
      urlencode = "python3 -c 'import sys, urllib.parse as ul; print(ul.quote_plus(sys.stdin.read()))'";
    };
  };

  # This value determines the home Manager release that your
  # configuration is compatible with. This helps avoid breakage
  # when a new home Manager release introduces backwards
  # incompatible changes.
  #
  # You can update home Manager without changing this value. See
  # the home Manager release notes for a list of state version
  # changes in each release.
  home.stateVersion = "26.05";
}
```

Setelah menambahkan `/etc/nixos/home.nix`, kamu perlu mengimpor berkas konfigurasi baru
ini dalam `/etc/nixos/flake.nix` agar bisa dipakai. Gunakan perintah berikut untuk
menghasilkan contoh di folder saat ini sebagai rujukan:

```shell
nix flake new example -t github:nix-community/home-manager#nixos
```

Setelah parameternya disesuaikan, isi `/etc/nixos/flake.nix` menjadi seperti berikut:

```nix
{
  description = "NixOS configuration";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
    # home-manager, used for managing user configuration
    home-manager = {
      url = "github:nix-community/home-manager/release-26.05";
      # The `follows` keyword in inputs is used for inheritance.
      # Here, `inputs.nixpkgs` of home-manager is kept consistent with
      # the `inputs.nixpkgs` of the current flake,
      # to avoid problems caused by different versions of nixpkgs.
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs@{ nixpkgs, home-manager, ... }: {
    nixosConfigurations = {
      # TODO please change the hostname to your own
      my-nixos = nixpkgs.lib.nixosSystem {
        modules = [
          ./configuration.nix

          # make home-manager as a module of nixos
          # so that home-manager configuration will be deployed automatically when executing `nixos-rebuild switch`
          home-manager.nixosModules.home-manager
          {
            home-manager.useGlobalPkgs = true;
            home-manager.useUserPackages = true;

            # TODO replace ryan with your own username
            home-manager.users.ryan = import ./home.nix;

            # Use home-manager.extraSpecialArgs to pass custom arguments to ./home.nix
            # Uncomment the next line to make all flake inputs available in home.nix
            # home-manager.extraSpecialArgs = inputs;
          }
        ];
      };
    };
  };
}
```

`home-manager.users.ryan` harus cocok dengan pengguna yang dideklarasikan dalam
konfigurasi NixOS. Jika pengguna itu belum dibuat, tambahkan ke `configuration.nix`
sebelum beralih:

```nix
users.users.ryan = {
  isNormalUser = true;
  extraGroups = [ "wheel" ];
};
```

Lalu jalankan `sudo nixos-rebuild switch` untuk menerapkan konfigurasi, dan home-manager
akan dipasang otomatis.

> Jika konfigurasi berada dalam repositori Git, jalankan `git add home.nix` terlebih
> dahulu. Dengan Flakes, Nix hanya melihat berkas yang dilacak Git. `home.nix` yang belum
> dilacak akan menyebabkan kesalahan `path '.../home.nix' does not exist`. Lihat
> [Mengelola Konfigurasi dengan Git](./other-useful-tips.md).

> Jika hostname sistemmu bukan `my-nixos`, ubah nama `nixosConfigurations` dalam
> `flake.nix`, atau gunakan `--flake /etc/nixos#my-nixos` untuk menentukan nama
> konfigurasi.

Setelah instalasi, seluruh paket dan konfigurasi tingkat pengguna bisa dikelola melalui
`/etc/nixos/home.nix`. Saat menjalankan `sudo nixos-rebuild switch`, konfigurasi
home-manager akan diterapkan otomatis. (**Tidak perlu menjalankan `home-manager switch`
secara manual**!)

Untuk menemukan opsi yang bisa dipakai dalam `home.nix`, rujuk dokumen berikut:

- [Home Manager - Appendix A. Configuration Options](https://nix-community.github.io/home-manager/options.xhtml):
  Daftar semua opsi. Sebaiknya cari kata kunci di dalamnya.
  - [Home Manager Option Search](https://home-manager-options.extranix.com/) adalah alat
    pencarian opsi lain dengan antarmuka yang lebih baik.
- [home-manager](https://github.com/nix-community/home-manager): Beberapa opsi tidak
  tercantum dalam dokumentasi resmi, atau dokumentasinya kurang jelas. Kamu bisa langsung
  mencari dan membaca kode sumber yang bersesuaian dalam repositori home-manager ini.

## Home Manager vs NixOS {#home-manager-vs-nixos}

Banyak paket perangkat lunak atau konfigurasi bisa diatur melalui Modul NixOS
(`configuration.nix`) maupun Home Manager (`home.nix`). Ini menimbulkan dilema pilihan:
**Apa perbedaan menempatkan paket perangkat lunak atau berkas konfigurasi dalam Modul
NixOS dibandingkan Home Manager, dan bagaimana sebaiknya memilih?**

Pertama, mari lihat perbedaannya. Paket perangkat lunak dan berkas konfigurasi yang
dipasang melalui Modul NixOS berlaku global untuk seluruh sistem. Konfigurasi global
biasanya disimpan di `/etc`, dan perangkat lunak yang dipasang untuk seluruh sistem bisa
diakses dalam lingkungan pengguna mana pun.

Sementara itu, konfigurasi dan perangkat lunak yang dipasang melalui Home Manager akan
ditautkan ke direktori Home pengguna yang bersangkutan. Perangkat lunaknya hanya tersedia
dalam lingkungan pengguna tersebut dan tidak bisa dipakai saat beralih ke pengguna lain.

Berdasarkan ciri-ciri tersebut, penggunaan yang umumnya disarankan adalah:

- Modul NixOS: Pasang komponen inti sistem serta paket perangkat lunak atau konfigurasi
  lain yang diperlukan semua pengguna.
  - Misalnya, jika ingin paket tetap bisa dipakai saat beralih ke pengguna root, atau
    konfigurasi berlaku di seluruh sistem, pasang melalui Modul NixOS.
- Home Manager: Gunakan Home Manager untuk semua konfigurasi dan perangkat lunak lainnya.

Manfaat pendekatan ini:

1. Perangkat lunak dan layanan latar belakang yang dipasang pada tingkat sistem sering
   berjalan dengan hak akses root. Menghindari instalasi perangkat lunak yang tidak perlu
   pada tingkat sistem bisa mengurangi risiko keamanan sistem.
1. Banyak konfigurasi Home Manager berlaku untuk NixOS, macOS, dan distribusi Linux
   lainnya. Memilih Home Manager untuk memasang perangkat lunak dan mengonfigurasi sistem
   bisa meningkatkan portabilitas konfigurasi.
1. Jika memerlukan dukungan banyak pengguna, perangkat lunak dan konfigurasi yang dipasang
   melalui Home Manager bisa mengisolasi lingkungan pengguna dengan lebih baik. Ini
   mencegah konflik konfigurasi dan versi perangkat lunak antar-pengguna.

## Bagaimana Memakai Paket yang Dipasang Home Manager dengan Hak Akses Istimewa? {#how-to-use-packages-installed-by-home-manager-with-privileged-access}

Hal pertama yang terpikir adalah beralih ke `root`. Namun, paket yang dipasang pengguna
saat ini melalui `home.nix` akan menjadi tidak tersedia. Ambil contoh `kubectl` (sudah
dipasang melalui `home.nix`):

```sh
# 1. kubectl is available
› kubectl | head
kubectl controls the Kubernetes cluster manager.

 Find more information at: https://kubernetes.io/docs/reference/kubectl/
......

# 2. switch user to `root`
› sudo su

# 3. kubectl is no longer available
> kubectl
Error: nu::shell::external_command

  × External command failed
   ╭─[entry #1:1:1]
 1 │ kubectl
   · ───┬───
   ·    ╰── executable was not found
   ╰────
  help: No such file or directory (os error 2)


/home/ryan/nix-config> exit
```

`sudo` menjalankan perintah sebagai pengguna lain (`root`), dengan terlebih dahulu
mencarinya dalam `PATH` pengguna sendiri. Karena Home Manager mengelola `PATH`-mu,
`sudo kubectl` tetap bisa menemukan `kubectl`. Ini bergantung pada konfigurasi `sudo`
NixOS. Pada distribusi lain, `sudo` mungkin mereset `PATH` dan tetap gagal menemukan
perintahnya:

```sh
› sudo kubectl
kubectl controls the Kubernetes cluster manager.
...
```
