# PIXELAND

**A World of Learning Adventures**

Latihan TIK interaktif untuk Informatika kelas 1. Prototype sekarang memakai **27 soal bertopik komputer/TIK** dari bank soal lama: 23 pilihan ganda dan 4 isian. Materi tampil dengan atribusi sumber dan masih menunggu validasi kualitas/izin.

## Jalankan

Buka `index.html` di browser modern. Tidak ada build atau package yang diperlukan. Google Fonts dan TTS Bahasa Indonesia bergantung pada browser/voice yang tersedia; musik serta efek memakai file lokal. File latihan dan gambar disimpan lokal di repo.

## Pengalaman

- Home visual petualangan dengan karakter dan gambar perangkat.
- Backing track `back 1.flac`, `back2.flac`, dan `back3.flac` berputar berurutan. Halaman mencoba autoplay; browser yang memblokir audio bersuara memulainya saat sentuhan/klik pertama.
- Audio tombol memakai `mixkit-select-click-1109.wav`; hasil di atas 80 memakai achievement bell dan nilai di bawah 80 memakai losing bleeps.
- Tombol besar, animasi ringan, font besar, dan pilihan suara ON/OFF.
- Soal dibacakan lewat tombol speaker; efek bunyi untuk interaksi/feedback.
- Progres soal dan latihan pilihan ganda/isian tanpa timer.
- Contoh jawaban isian dapat dibuka untuk dikerjakan bersama pendamping.

## Sumber soal

Subset data ada di `assets/data/tik-questions.js`, diambil dari [repo sumber lama](https://github.com/belvahector-ship-it/belajar-informatika-sd1/blob/main/index.html). Credit sumber ditampilkan di dialog “Tentang sumber soal”. Materi belum divalidasi sebagai kurikulum nasional Informatika kelas 1 dan status izin penggunaan masih perlu dikonfirmasi. PIXELAND tidak menyiratkan afiliasi/endorsement SD Al Huda Semarang.

## Aset visual

Ilustrasi orisinal ada di `assets/images/`: dunia petualangan, robot pemandu PIXELAND, serta perangkat komputer. Animasi UI memakai CSS dan menghormati `prefers-reduced-motion`.

## Dokumen proyek

- [Brief produk & desain](GRAVITY_PROJECT_BRIEF.md)
- [Handoff engineering](CODEX_ENGINEERING_HANDOFF.md)
- [Audit sumber](PIXELAND_SOURCE_AUDIT.md)
- [Product direction](PIXELAND_PRODUCT_DIRECTION.md)

