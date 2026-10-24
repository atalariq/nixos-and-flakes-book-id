# Debugging Derivation dan Ekspresi Nix {#debugging-derivations-and-nix-expressions}

## Menampilkan Pesan Kesalahan Terperinci {#show-detailed-error-messages}

Jika menemui kesalahan selama deployment, kamu selalu bisa mencoba menambahkan
`--show-trace --print-build-logs --verbose` ke perintah `nixos-rebuild` untuk memperoleh
pesan kesalahan yang terperinci. Misalnya:

```bash
cd /etc/nixos
sudo nixos-rebuild switch --flake .#myhost --show-trace --print-build-logs --verbose

# A more concise version
sudo nixos-rebuild switch --flake .#myhost --show-trace -L -v
```

## Debugging dengan `nix repl` {#debugging-with-nix-repl}

> CATATAN: Jika menonaktifkan `NIX_PATH`, kamu tidak bisa memakai sintaks seperti
> `<nixpkgs>`. Sebagai gantinya, gunakan `nix repl -f flake:nixpkgs` untuk memuat nixpkgs.

Sepanjang panduan ini, kita sering memakai nix repl `<nixpkgs>` untuk memeriksa kode
sumber. Ini alat yang andal untuk membantu memahami cara kerja berbagai hal dalam Nix.

Mari lihat lebih dekat pesan bantuan nix repl:

```shell
› nix repl -f '<nixpkgs>'
Welcome to Nix 2.13.3. Type :? for help.

Loading installable ''...
Added 17755 variables.
nix-repl> :?
The following commands are available:

  <expr>        Evaluate and print expression
  <x> = <expr>  Bind expression to variable
  :a <expr>     Add attributes from resulting set to scope
  :b <expr>     Build a derivation
  :bl <expr>    Build a derivation, creating GC roots in the working directory
  :e <expr>     Open package or function in $EDITOR
  :i <expr>     Build derivation, then install result into current profile
  :l <path>     Load Nix expression and add it to scope
  :lf <ref>     Load Nix flake and add it to scope
  :p <expr>     Evaluate and print expression recursively
  :q            Exit nix-repl
  :r            Reload all files
  :sh <expr>    Build dependencies of derivation, then start nix-shell
  :t <expr>     Describe result of evaluation
  :u <expr>     Build derivation, then start nix-shell
  :doc <expr>   Show documentation of a builtin function
  :log <expr>   Show logs for a derivation
  :te [bool]    Enable, disable or toggle showing traces for errors
```

Ada beberapa ekspresi yang sering saya pakai: `:lf <ref>` dan `:e <expr>`.

Perintah `:e <expr>` sangat mudah dipahami, jadi saya tidak akan membahasnya secara
terperinci. Sebagai gantinya, mari berfokus pada `:lf <ref>`:

```shell
# cd into my nix-config repo(you should replace it with your own nix-config repo)
› cd ~/nix-config/

# enter nix repl
› nix repl
Welcome to Nix 2.13.3. Type :? for help.

# load my nix flake and add it to scope
nix-repl> :lf .
Added 16 variables.

# press <TAB> to see what we have in scope
nix-repl><TAB>
# ......omit some outputs
__isInt                          nixosConfigurations
__isList                         null
__isPath                         outPath
__isString                       outputs
__langVersion                    packages
# ......omit some outputs


# check what's in inputs
nix-repl> inputs.<TAB>
inputs.agenix            inputs.nixpkgs
inputs.darwin            inputs.nixpkgs-darwin
inputs.home-manager      inputs.nixpkgs-unstable
inputs.hyprland          inputs.nixpkgs-wayland
inputs.nil
inputs.nixos-generators

# check what's in inputs.nil
nix-repl> inputs.nil.packages.
inputs.nil.packages.aarch64-darwin
inputs.nil.packages.aarch64-linux
inputs.nil.packages.x86_64-darwin
inputs.nil.packages.x86_64-linux

# check the outputs of my nix flake
nix-repl> outputs.nixosConfigurations.<TAB>
outputs.nixosConfigurations.ai
outputs.nixosConfigurations.aquamarine
outputs.nixosConfigurations.kana
outputs.nixosConfigurations.ruby

nix-repl> outputs.nixosConfigurations.ai.<TAB>
outputs.nixosConfigurations.ai._module
outputs.nixosConfigurations.ai._type
outputs.nixosConfigurations.ai.class
outputs.nixosConfigurations.ai.config
outputs.nixosConfigurations.ai.extendModules
outputs.nixosConfigurations.ai.extraArgs
outputs.nixosConfigurations.ai.options
outputs.nixosConfigurations.ai.pkgs
outputs.nixosConfigurations.ai.type

nix-repl> outputs.nixosConfigurations.ai.config.
outputs.nixosConfigurations.ai.config.age
outputs.nixosConfigurations.ai.config.appstream
outputs.nixosConfigurations.ai.config.assertions
outputs.nixosConfigurations.ai.config.boot
outputs.nixosConfigurations.ai.config.console
outputs.nixosConfigurations.ai.config.containers
# ......omit other outputs

nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.activation
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.activationPackage
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.emptyActivationPath
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.enableDebugInfo
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.enableNixpkgsReleaseCheck
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraActivationPath
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraBuilderCommands
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraOutputsToInstall
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraProfileCommands
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file
# ......omit other outputs


nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.BROWSER
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.DELTA_PAGER
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.EDITOR
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.TERM
# ......omit other outputs

# check the value of `TERM`
nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.TERM
"xterm-256color"


# check all files defined by `home.file`
nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..bash_profile
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..bashrc
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/fcitx5/profile
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/fcitx5/profile-bak
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/config
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/i3blocks.conf
#......
```

Seperti terlihat, setelah memuat flake Nix ke REPL, kamu bisa memeriksa setiap atribut
flake tersebut. Kemampuan ini sangat praktis untuk debugging.

## Fungsi Debugging yang Disediakan nixpkgs {#debugging-functions-provided-by-nixpkgs}

Belum dikerjakan

## Debugging dengan `NIX_DEBUG` dalam Derivation {#debugging-by-using-nix-debug-in-derivation}

Belum dikerjakan

## Rujukan {#references}

- [How to make nix build display all commands executed by make?](https://www.reddit.com/r/NixOS/comments/14stdgy/how_to_make_nix_build_display_all_commands/)
  - pakai `NIX_DEBUG=7` dalam derivation
- [Collection of functions useful for debugging broken nix expressions.](https://github.com/NixOS/nixpkgs/blob/nixos-26.05/lib/debug.nix)
