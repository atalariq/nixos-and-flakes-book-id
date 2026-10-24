# Pertanyaan yang Sering Diajukan {#frequently-asked-questions}

## Apa Perbedaan Kemampuan Rollback NixOS dengan Rollback Snapshot Sistem btrfs/zfs? {#what-is-the-difference-between-nixos-rollback-capability-and-btrfs-zfs-system-snapshot-rollback}

Perbedaannya terletak pada sifat snapshot. Snapshot sistem yang dibuat dengan btrfs/zfs
tidak memuat 'pengetahuan' tentang cara membangunnya dari nol. Snapshot ini **tidak bisa
ditafsirkan**, dan isinya sangat terkait dengan lingkungan perangkat keras saat ini,
sehingga sulit direproduksi pada mesin lain.

Sementara itu, konfigurasi NixOS adalah "pengetahuan" yang bisa membangun OS identik dari
nol. Konfigurasi ini **bisa dijelaskan** dan bisa dibangun otomatis hanya dengan beberapa
perintah sederhana. Konfigurasi NixOS menjadi dokumentasi semua perubahan pada OS,
sekaligus dipakai untuk membangun OS itu sendiri secara otomatis.

Berkas konfigurasi NixOS seperti **kode sumber** sebuah program. Selama kode sumber utuh,
program identik mudah diubah, ditinjau, atau dibangun ulang. Sebaliknya, snapshot sistem
seperti program biner hasil kompilasi kode sumber, sehingga jauh lebih sulit diubah atau
ditinjau. Selain itu, ukuran snapshot besar, sehingga berbagi atau memindahkannya lebih
mahal dibandingkan kode sumber.

Namun, ini tidak berarti NixOS menghilangkan kebutuhan snapshot sistem. Seperti disebutkan
pada Bab 1 buku ini, NixOS hanya bisa menjamin reproduksibilitas hal-hal yang dinyatakan
dalam konfigurasi deklaratif. Bagian sistem lain di luar cakupannya tetap memerlukan
snapshot sistem atau cara pencadangan lain. Misalnya, data dinamis MySQL/PostgreSQL,
berkas unggahan pengguna, log sistem, serta video, musik, dan gambar dalam direktori home
pengguna.

## Bagaimana Perbandingan Nix dengan Alat Pengelolaan Sistem Tradisional seperti Ansible? {#how-does-nix-compare-to-traditional-system-management-tools-like-ansible}

Nix tidak hanya dipakai untuk mengelola lingkungan desktop, tetapi juga banyak digunakan
untuk mengelola server cloud secara massal.
[colmena](https://github.com/nix-community/colmena) dan
[deploy-rs](https://github.com/serokell/deploy-rs), yang sama-sama dikembangkan komunitas,
merupakan alat yang dirancang khusus untuk penggunaan ini.

Dibandingkan alat tradisional yang banyak dipakai seperti Ansible, Nix memiliki keunggulan
utama berikut:

1. Salah satu masalah terbesar Ansible adalah setiap deployment didasarkan pada perubahan
   bertahap terhadap keadaan sistem saat ini. Keadaan sistem, seperti snapshot yang
   disebutkan di atas, tidak bisa ditafsirkan dan sulit direproduksi. NixOS menyatakan
   keadaan tujuan sistem melalui berkas konfigurasi. Jadi, hasil deployment tidak
   bergantung pada keadaan sistem saat ini, dan deployment berulang tidak menimbulkan
   masalah.
2. Nix Flakes memakai berkas pengunci versi `flake.lock` untuk mengunci nilai hash, nomor
   versi, sumber data, dan informasi lain semua dependensi. Ini sangat meningkatkan
   reproduksibilitas sistem. Alat tradisional seperti Ansible tidak memiliki fitur ini,
   sehingga reproduksibilitasnya kurang baik.
   1. Inilah alasan Docker begitu populer: dengan biaya jauh lebih rendah, Docker
      menyediakan **lingkungan sistem yang dapat direproduksi pada beragam mesin**, yang
      tidak disediakan alat Ops tradisional seperti Ansible.
3. Nix memudahkan penyesuaian sistem dengan menyembunyikan detail implementasi di balik
   lapisan abstraksi deklaratif, sehingga pengguna cukup memikirkan kebutuhan intinya.
   Abstraksi alat seperti Ansible jauh lebih lemah.
   1. Jika pernah memakai alat konfigurasi deklaratif seperti terraform/kubernetes, ini
      semestinya mudah dipahami. Semakin rumit kebutuhannya, semakin besar manfaat
      konfigurasi deklaratif.

## Apa Keunggulan Nix dibandingkan Teknologi Kontainer Docker? {#what-are-the-advantages-of-nix-compared-to-docker-container-technology}

Nix dan teknologi kontainer seperti Docker memang memiliki penggunaan yang tumpang tindih,
misalnya:

1. Banyak orang memakai Nix untuk mengelola lingkungan pengembangan dan build, seperti
   dibahas dalam buku ini. Di sisi lain, teknologi seperti
   [Dev Containers](https://github.com/devcontainers/spec), yang membangun lingkungan
   pengembangan berbasis kontainer, juga populer.
2. Bidang DevOps/SRE saat ini didominasi teknologi kontainer berbasis Dockerfile.
   Distribusi umum seperti Ubuntu/Debian sering dipakai dalam kontainer, dan pilihan
   matang untuk mesin host juga tersedia. Dalam konteks ini, apa keuntungan berarti dari
   beralih ke NixOS?

Mengenai poin pertama, "mengelola lingkungan pengembangan dan build", Nix memberikan
pengalaman yang sangat mirip dengan bekerja langsung pada mesin host. Ini menawarkan
beberapa keuntungan dibandingkan Dev Containers, seperti berikut:

1. Nix tidak memakai namespace untuk isolasi sistem berkas dan jaringan. Lingkungan
   pengembangan buatan Nix bisa mudah berinteraksi dengan sistem berkas host (termasuk
   /dev untuk perangkat eksternal) dan lingkungan jaringannya. Sebaliknya, kontainer
   memerlukan berbagai pemetaan agar bisa berkomunikasi dengan sistem berkas host, yang
   terkadang menimbulkan masalah izin berkas.
2. Karena tidak ada isolasi kuat, lingkungan pengembangan Nix tidak bermasalah mendukung
   aplikasi GUI. Menjalankan program GUI di dalamnya semulus menjalankannya dalam
   lingkungan sistem.

Dengan kata lain, Nix memberikan pengalaman pengembangan yang paling dekat dengan mesin
host, tanpa isolasi kuat. Pengembang bisa memakai alat pengembangan dan debugging yang
sudah dikenal, dan pengalaman pengembangan sebelumnya bisa diterapkan dengan mulus.
Sebaliknya, jika memakai Dev Containers, pengembang mungkin menemui berbagai masalah
komunikasi sistem berkas, lingkungan jaringan, dan izin pengguna. Alat debugging GUI pun
mungkin tidak bisa dipakai akibat isolasi kuat.

Jika kita memutuskan memakai Nix untuk mengelola seluruh lingkungan pengembangan,
membangun kontainer Docker berbasis Nix akan memberikan konsistensi tertinggi. Selain itu,
memakai arsitektur teknologi yang seragam untuk semua lingkungan sangat mengurangi biaya
pemeliharaan infrastruktur. Ini menjawab poin kedua tadi: jika lingkungan pengembangan
sudah dikelola dengan Nix, memakai NixOS untuk image dasar kontainer dan server cloud
memberikan keuntungan tersendiri.

## error: collision between `...` and `...` {#error-collision-between-and}

Kesalahan ini muncul saat kamu memasang dua paket yang bergantung pada pustaka sama dengan
versi berbeda dalam profil yang sama (modul home atau modul nixos).

Misalnya, jika konfigurasinya sebagai berikut:

```nix
{
   # as a nixos module
   # environment.systemPackages = with pkgs; [
   #
   # or as a home manager module
   home.packages = with pkgs; [
     lldb

     (python311.withPackages (ps:
       with ps; [
         ipython
         pandas
         requests
         pyquery
         pyyaml
       ]
     ))
   ];
}
```

ini akan menyebabkan kesalahan berikut:

```bash
error: builder for '/nix/store/n3scj3s7v9jsb6y3v0fhndw35a9hdbs6-home-manager-path.drv' failed with exit code 25;
       last 1 log lines:
       > error: collision between `/nix/store/kvq0gvz6jwggarrcn9a8ramsfhyh1h9d-lldb-14.0.6/lib/python3.11/site-packages/six.py'
and `/nix/store/370s8inz4fc9k9lqk4qzj5vyr60q166w-python3-3.11.6-env/lib/python3.11/site-packages/six.py'
       For full logs, run 'nix log /nix/store/n3scj3s7v9jsb6y3v0fhndw35a9hdbs6-home-manager-path.drv'.
```

Berikut beberapa solusinya:

1. Pisahkan kedua paket ke dua **profil** berbeda. Misalnya, pasang `lldb` melalui
   `environment.systemPackages` dan `python311` melalui `home.packages`.
2. Versi Python3 berbeda dianggap sebagai paket berbeda. Jadi, kamu bisa mengubah versi
   Python3 kustom menjadi `python310` untuk menghindari konflik.
3. Pakai `override` untuk menimpa versi pustaka yang dipakai paket agar konsisten dengan
   versi yang dipakai paket lainnya.

```nix
{
  # as a nixos module
  # environment.systemPackages = with pkgs; [
  #
  # or as a home manager module
  home.packages = let
    custom-python3 = (pkgs.python311.withPackages (ps:
      with ps; [
        ipython
        pandas
        requests
        pyquery
        pyyaml
      ]
    ));
  in
    with pkgs; [
      # override the version of python3
      # NOTE: This will trigger a rebuild of lldb, it takes time
      (lldb.override {
        python3 = custom-python3;
      })

      custom-python3
  ];
}
```
