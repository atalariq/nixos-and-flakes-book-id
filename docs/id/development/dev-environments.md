# Lingkungan Pengembangan {#dev-environments}

Di NixOS, ada berbagai cara menyiapkan lingkungan pengembangan. Yang paling ideal adalah
mendefinisikan seluruh lingkungan pengembangan setiap proyek melalui `flake.nix` miliknya
sendiri. Namun, dalam praktiknya ini bisa agak merepotkan: kamu harus menulis `flake.nix`
dan menjalankan `nix develop` setiap kali. Untuk proyek sementara atau sekadar melihat
kode, pendekatan ini terasa berlebihan.

Jalan tengahnya adalah membagi lingkungan pengembangan menjadi tiga lapisan:

1. **Lingkungan Global**: Biasanya merujuk pada lingkungan pengguna yang dikelola
   home-manager.
   - Alat pengembangan umum: `git`, `vim`, `emacs`, `tmux`, dan sejenisnya.
   - SDK bahasa dan pengelola paket yang umum: `rust`, `openjdk`, `python`, `go`, dan
     lainnya.
2. **Lingkungan IDE**:
   - Ambil contoh neovim. home-manager membuat pembungkus neovim yang menempatkan
     dependensinya dalam lingkungan sendiri, sehingga tidak mencemari lingkungan global.
   - Dependensi plugin neovim bisa ditambahkan ke lingkungannya melalui parameter
     `programs.neovim.extraPackages`, sehingga IDE berjalan lancar.
   - Namun, jika memakai beberapa IDE (seperti emacs dan neovim), keduanya sering
     bergantung pada banyak program yang sama (seperti lsp, tree-sitter, debugger,
     formatter, dan lainnya). Agar mudah dikelola, dependensi bersama ini bisa ditempatkan
     dalam lingkungan global. Waspadai kemungkinan konflik dependensi dengan program lain
     di lingkungan global, terutama paket python yang rentan konflik.
3. **Lingkungan Proyek**: Setiap proyek bisa mendefinisikan lingkungan pengembangannya
   sendiri (`devShells`) melalui `flake.nix`.
   - Agar lebih mudah, kamu bisa menyiapkan templat `flake.nix` umum untuk bahasa yang
     sering dipakai, lalu menyalin dan mengubahnya sesuai kebutuhan.
   - Lingkungan proyek memiliki prioritas tertinggi (ditambahkan ke awal PATH), sehingga
     dependensinya menimpa dependensi bernama sama di lingkungan global. Jadi, versi
     dependensi proyek bisa dikendalikan melalui `flake.nix` proyek, tanpa dipengaruhi
     lingkungan global.

## Templat Lingkungan Pengembangan {#templates-for-development-environments}

Kita sudah belajar membangun lingkungan pengembangan, tetapi menulis `flake.nix` untuk
setiap proyek agak melelahkan.

Untungnya, beberapa orang di komunitas sudah mengerjakannya untuk kita. Repositori berikut
memuat templat lingkungan pengembangan untuk sebagian besar bahasa pemrograman. Cukup
salin dan tempel:

- [the-nix-way/dev-templates](https://github.com/the-nix-way/dev-templates)

Jika struktur `flake.nix` masih terasa terlalu rumit dan kamu menginginkan cara lebih
sederhana, pertimbangkan proyek berikut. Proyek ini membungkus Nix lebih menyeluruh dan
memberikan bentuk definisi yang lebih sederhana kepada pengguna:

- [cachix/devenv](https://github.com/cachix/devenv)

Jika tidak ingin menulis satu baris kode nix pun dan hanya menginginkan lingkungan
pengembangan yang dapat direproduksi dengan usaha minimal, alat ini mungkin cocok:

- [jetify-com/devbox](https://github.com/jetify-com/devbox)

## Lingkungan Pengembangan Python {#dev-environment-for-python}

Lingkungan pengembangan Python jauh lebih merepotkan dibandingkan bahasa seperti Java atau
Go, karena secara bawaan perangkat lunak dipasang dalam lingkungan global. Untuk memasang
perangkat lunak bagi proyek saat ini, kamu harus membuat lingkungan virtual terlebih
dahulu. (Berbeda dengan bahasa seperti JavaScript atau Go yang tidak memerlukan lingkungan
virtual.) Perilaku ini sangat tidak ramah bagi Nix.

Secara bawaan, pip dalam Python memasang perangkat lunak secara global. Di NixOS, langsung
menjalankan `pip install` menghasilkan kesalahan:

```bash
› pip install -r requirements.txt
error: externally-managed-environment

× This environment is externally managed
╰─> This command has been disabled as it tries to modify the immutable
    `/nix/store` filesystem.

    To use Python with Nix and nixpkgs, have a look at the online documentation:
    <https://nixos.org/manual/nixpkgs/stable/#python>.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
```

Berdasarkan pesan kesalahannya, `pip install` langsung dinonaktifkan oleh NixOS. Bahkan
`pip install --user` juga dinonaktifkan.

Pembatasan ini berasal dari [PEP 668](https://peps.python.org/pep-0668/). pip menolak
memasang paket ke lingkungan Python yang ditandai sebagai _externally managed_ (dikelola
secara eksternal). Artinya, paketnya dipelihara oleh pengelola paket eksternal, seperti
distribusi OS. Aturan ini lahir dari pengalaman pahit di distribusi tradisional:
mencampurkan `pip install` dengan berkas Python yang dikelola OS pernah merusak alat
sistem. Banyak alat ini sendiri merupakan program Python, termasuk `yum` dan `dnf` Fedora.
Jadi, satu `sudo pip install` yang ceroboh bisa merusak pengelola paket itu sendiri.

NixOS juga mengaktifkannya. Python bawaannya menyertakan berkas penanda
`EXTERNALLY-MANAGED`, dan pesan khusus tentang `/nix/store` pada kesalahan di atas
merupakan isi berkas tersebut.

Untuk proyek baru, kami langsung menyarankan [uv](https://github.com/astral-sh/uv).
`uv venv` membuat lingkungan virtual, sedangkan `uv add` / `uv run` mengelola dependensi
dan menjalankan perintah. uv juga kompatibel dengan pip: `uv pip install` bekerja dalam
lingkungan virtual seperti pip. uv sendiri tersedia sebagai paket dalam nixpkgs.

Jika ingin lingkungan virtualnya sendiri dapat direproduksi, Nix bisa membangunnya dalam
`/nix/store` sebagai artefak yang tidak bisa diubah. Dependensi yang dinyatakan dalam
`pyproject.toml` dan `uv.lock` dipasang saat build. Alat yang saat ini aktif dipelihara
untuk keperluan ini adalah [uv2nix](https://github.com/pyproject-nix/uv2nix):

> Ingat, bahkan dalam lingkungan semacam ini, langsung menjalankan perintah seperti
> `pip install` tetap akan gagal. Dependensi Python harus dipasang melalui `flake.nix`,
> karena datanya berada dalam direktori `/nix/store`. Perintah perubahan ini hanya bisa
> dijalankan selama tahap build Nix.

Keunggulannya, mekanisme penguncian Nix Flakes dipakai untuk meningkatkan
reproduksibilitas. Namun, kekurangannya adalah tambahan lapisan abstraksi yang membuat
sistem di baliknya lebih rumit.

`uvx` langsung mengatasi masalah yang disebutkan sebelumnya: alat CLI Python tidak bisa
dipasang dalam lingkungan global. Cara kerjanya seperti `npx` dalam dunia Node.js:
`uvx <tool>` (setara dengan `uv tool run <tool>`) mengunduh alat ke lingkungan terisolasi
lalu langsung menjalankannya, tanpa menyentuh Python sistem. `uv tool install <tool>`
membuat alat tersebut tersedia secara persisten.

Untuk proyek lama dengan skrip instalasi dan pengelolaan dependensi berbasis pip, tidak
banyak yang bisa dilakukan selain membuat lingkungan virtual terlebih dahulu:

```shell
python -m venv ./env
source ./env/bin/activate
```

Untuk proyek yang bahkan tidak bisa ditangani lingkungan virtual atau lingkungan FHS,
jalan terakhir adalah kontainer seperti Docker atau Podman, yang menjalankan
Ubuntu/Debian/Alpine biasa di dalamnya. Kontainer memiliki lebih sedikit batasan daripada
Nix dan bisa memberikan kompatibilitas terbaik.
