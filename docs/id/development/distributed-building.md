# Build Terdistribusi {#distributed-building}

Build terdistribusi bisa sangat mempercepat proses build dengan memanfaatkan beberapa
mesin. Namun, bagi pengguna NixOS biasa, ini mungkin tidak terlalu berguna karena
`cache.nixos.org` menyediakan sebagian besar cache untuk arsitektur `x86_64`.

Build terdistribusi sangat berguna saat cache tidak tersedia, misalnya:

1. Pengguna arsitektur `RISC-V` atau `ARM64`, terutama `RISC-V`, karena cache untuk
   arsitektur ini sangat sedikit dalam repositori cache resmi. Kompilasi lokal sering
   diperlukan.
2. Pengguna yang banyak menyesuaikan sistemnya. Paket dalam repositori cache resmi
   dibangun dengan konfigurasi bawaan. Jika parameter build diubah, cache resmi tidak
   berlaku dan kompilasi lokal diperlukan. Misalnya, dalam sistem embedded, penyesuaian
   kernel, driver, dan komponen dasar lain sering diperlukan, sehingga kompilasi lokal
   dibutuhkan.

## Mengonfigurasi Build Terdistribusi {#configuring-distributed-building}

Saat ini, belum ada dokumentasi resmi untuk build terdistribusi. Namun, saya menyediakan
contoh konfigurasinya (modul NixOS) di bawah, beserta beberapa dokumen rujukan yang
disarankan pada akhir bagian ini.

```nix
{ ... }: {

  ####################################################################
  #
  #  NixOS's Configuration for Remote Building / Distributed Building
  #
  ####################################################################

  # Set local's max-jobs to 0 to force remote building (disable local building).
  # nix.settings.max-jobs = 0;
  nix.distributedBuilds = true;
  nix.buildMachines =
    let
      sshUser = "ryan";
      # Path to the SSH key on the local machine.
      sshKey = "/home/ryan/.ssh/ai-idols";
      systems = [
        # Native architecture.
        "x86_64-linux"

        # Emulated architecture using binfmt_misc and qemu-user.
        "aarch64-linux"
        "riscv64-linux"
      ];
      # All available system features are poorly documented here:
      # https://github.com/NixOS/nix/blob/e503ead/src/libstore/globals.hh#L673-L687
      supportedFeatures = [
        "benchmark"
        "big-parallel"
        "kvm"
      ];
    in
      [
        # Nix seems to always prioritize remote building.
        # To make use of the local machine's high-performance CPU, do not set the remote builder's maxJobs too high.
        {
          # Some of my remote builders are running NixOS
          # and have the same sshUser, sshKey, systems, etc.
          inherit sshUser sshKey systems supportedFeatures;

          # The hostName should be:
          #   1. A hostname that can be resolved by DNS.
          #   2. The IP address of the remote builder.
          #   3. A host alias defined globally in /etc/ssh/ssh_config.
          hostName = "aquamarine";
          # Remote builder's max-jobs.
          maxJobs = 3;
          # SpeedFactor is a signed integer,
          # but it seems that it's not used by Nix and has no effect.
          speedFactor = 1;
        }
        {
          inherit sshUser sshKey systems supportedFeatures;
          hostName = "ruby";
          maxJobs = 2;
          speedFactor = 1;
        }
        {
          inherit sshUser sshKey systems supportedFeatures;
          hostName = "kana";
          maxJobs = 2;
          speedFactor = 1;
        }
      ];
  # Optional: Useful when the builder has a faster internet connection than yours.
  nix.extraOptions = ''
    builders-use-substitutes = true
  '';

  # Define the host aliases for remote builders.
  # This configuration will be written to /etc/ssh/ssh_config.
  programs.ssh.extraConfig = ''
    Host ai
      HostName 192.168.5.100
      Port 22

    Host aquamarine
      HostName 192.168.5.101
      Port 22

    Host ruby
      HostName 192.168.5.102
      Port 22

    Host kana
      HostName 192.168.5.103
      Port 22
  '';

  # Define the host keys for remote builders so that Nix can verify all the remote builders.
  # This configuration will be written to /etc/ssh/ssh_known_hosts.
  programs.ssh.knownHosts = {
    # 星野 愛久愛海, Hoshino Aquamarine
    aquamarine = {
      hostNames = [ "aquamarine" "192.168.5.101" ];
      publicKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDnCQXlllHoLX5EvU+t6yP/npsmuxKt0skHVeJashizE";
    };

    # 星野 瑠美衣, Hoshino Rubii
    ruby = {
      hostNames = [ "ruby" "192.168.5.102" ];
      publicKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIE7n11XxB8B3HjdyAsL3PuLVDZxWCzEOUTJAY8+goQmW";
    };

    # 有馬 かな, Arima Kana
    kana = {
      hostNames = [ "kana" "192.168.5.103" ];
      publicKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ3dDLOZERP1nZfRz3zIeVDm1q2Trer+fWFVvVXrgXM1";
    };
  };
}
```

## Keterbatasan {#limitations}

Berikut beberapa masalah dan keterbatasan yang teramati:

1. Kamu tidak bisa menentukan host yang dipakai saat build. Kamu hanya bisa menentukan
   daftar host dalam berkas konfigurasi, dan Nix otomatis memilih host yang tersedia.
2. Saat memilih host, Nix selalu mengutamakan host jarak jauh daripada host lokal, meski
   kinerja host lokal lebih baik. Akibatnya, CPU host lokal bisa kurang dimanfaatkan.
3. Satuan terkecil build terdistribusi adalah derivation. Saat membangun paket besar,
   mesin lain mungkin lama menganggur sambil menunggu paket itu selesai. Ini bisa membuang
   sumber daya.

## Rujukan {#references}

- [Distributed build - NixOS Wiki](https://wiki.nixos.org/wiki/Distributed_build)
- [Document available system features - nix#7380](https://github.com/NixOS/nix/issues/7380)
- [Distributed builds seem to disable local builds - nix#2589](https://github.com/NixOS/nix/issues/2589)
- [Offloading NixOS builds to a faster machine](https://sgt.hootr.club/molten-matter/nix-distributed-builds/)
- [tests/nixos/remote-builds.nix - Nix Source Code](https://github.com/NixOS/nix/blob/713836112/tests/nixos/remote-builds.nix#L46)
