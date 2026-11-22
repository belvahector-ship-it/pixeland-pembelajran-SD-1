# PIXELAND

**A World of Learning Adventures**

Latihan interaktif kelas 1. Pilihan materi: **TIK (27 soal)**, **Pendidikan Pancasila (11)**, **Bahasa Indonesia (13)**, **Matematika (8)**, dan **Seni Budaya/SBDP (10)**. Materi selain TIK diringkas dari soal STS/PTS lokal; soal yang hanya dapat dijawab dengan gambar yang tidak tersedia tidak dimasukkan.

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

Data TIK ada di `assets/data/tik-questions.js`, dari [repo sumber lama](https://github.com/belvahector-ship-it/belajar-informatika-sd1/blob/main/index.html). Empat mapel lainnya ada di `assets/data/other-questions.js`, diringkas dari berkas dalam `Kumpulan_Soal_STS_PTS_Kelas_1_Semester_1`. Credit dan batasan materi ditampilkan di dialog “Tentang sumber soal”. Soal belum divalidasi sebagai kurikulum nasional dan status izin penggunaan tetap perlu dikonfirmasi. PIXELAND tidak menyiratkan afiliasi/endorsement sekolah mana pun.

## Aset visual

Ilustrasi orisinal ada di `assets/images/`: dunia petualangan, robot pemandu PIXELAND, serta perangkat komputer. Animasi UI memakai CSS dan menghormati `prefers-reduced-motion`.

## Dokumen proyek

- [Brief produk & desain](GRAVITY_PROJECT_BRIEF.md)
- [Handoff engineering](CODEX_ENGINEERING_HANDOFF.md)
- [Audit sumber](PIXELAND_SOURCE_AUDIT.md)
- [Product direction](PIXELAND_PRODUCT_DIRECTION.md)

