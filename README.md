# PIXELAND

**A World of Learning Adventures**

Latihan interaktif kelas 1. Pilihan materi: **TIK (30 soal)**, **Latihan Tambahan TIK (30 soal)**, **Pendidikan Pancasila (11)**, **Bahasa Indonesia (13)**, **Matematika (8)**, dan **Seni Budaya/SBDP (10)**. Bahasa Arab (28 soal) juga tersedia. Materi selain TIK dan Bahasa Arab diringkas dari soal STS/PTS lokal; soal yang hanya dapat dijawab dengan gambar yang tidak tersedia tidak dimasukkan.

## Jalankan

Buka `index.html` di browser modern. Tidak ada build atau package yang diperlukan. Google Fonts dan TTS Bahasa Indonesia bergantung pada browser/voice yang tersedia; musik serta efek memakai file lokal. File latihan dan gambar disimpan lokal di repo.

## Pengalaman

- Home visual petualangan dengan tujuh tombol latihan: TIK, Latihan Tambahan TIK, Pendidikan Pancasila, Bahasa Indonesia, Matematika, SBDP, dan Bahasa Arab.
- Saat sesi pertama dibuka, popup meminta nama anak dan pilihan suara ON/OFF. Nama hanya disimpan di `sessionStorage` tab tersebut dan tidak dikirim ke mana pun.
- Urutan soal dan pilihan jawaban diacak setiap percobaan baru; pilihan ganda tetap lebih dulu, lalu isian. Percobaan yang belum selesai mempertahankan urutannya.
- Setelah memilih pelajaran, roadmap memperlihatkan seluruh titik soal. Jawaban pilihan ganda yang benar memunculkan perayaan robot (sekitar 3 detik), lalu robot berjalan ke titik berikutnya dan menunggu tombol **Lanjut**.
- Progres tersimpan otomatis selama sesi tab browser aktif (`sessionStorage`): bertahan saat halaman dimuat ulang, hilang saat tab ditutup. Tombol **Ulang dari awal** menghapus progres pelajaran tersebut.
- Jawaban salah memunculkan animasi robot jatuh dan kembali; petunjuk tampil setelah dua kali mencoba.
- Backing track `back 1.flac`, `back2.flac`, dan `back3.flac` berputar berurutan. Halaman mencoba autoplay; browser yang memblokir audio bersuara memulainya saat sentuhan/klik pertama.
- Audio tombol memakai `mixkit-select-click-1109.wav`; hasil di atas 80 memakai achievement bell dan nilai di bawah 80 memakai losing bleeps.
- Tombol besar, animasi ringan, font besar, dan pilihan suara ON/OFF.
- Soal dibacakan lewat tombol speaker; efek bunyi untuk interaksi/feedback.
- Progres soal dan latihan pilihan ganda/isian tanpa timer.
- Contoh jawaban isian dapat dibuka untuk dikerjakan bersama pendamping.

## Sumber soal

Paket TIK (`assets/data/tik-questions.js`, 25 pilihan ganda + 5 isian) mencakup benda di sekitar, hidup bersih, komunikasi, dan pengenalan komputer. Latihan Tambahan TIK (`assets/data/tik-extra-questions.js`, 25 pilihan ganda + 5 isian) berisi latihan komputer. Sebagian besar butir berasal dari [repo sumber lama](https://github.com/belvahector-ship-it/belajar-informatika-sd1/blob/main/index.html); butir ber-`origin` adalah soal baru atau adaptasi berkas lokal. Empat mapel lainnya ada di `assets/data/other-questions.js`, diringkas dari berkas dalam `Kumpulan_Soal_STS_PTS_Kelas_1_Semester_1`. Credit dan batasan materi ditampilkan di dialog “Tentang sumber soal”. Soal belum divalidasi sebagai kurikulum nasional dan status izin penggunaan tetap perlu dikonfirmasi. PIXELAND tidak menyiratkan afiliasi/endorsement sekolah mana pun.

Bank Bahasa Arab (28 soal) diambil dari `kuis_interaktif_bahasa_arab_kelas_1.html`; teks Arab, arti, pilihan, jawaban, dan penjelasan dipertahankan. Versi patch saat ini: `1.0.4`.

## Aset visual

Ilustrasi orisinal ada di `assets/images/`: dunia petualangan, robot pemandu PIXELAND, serta perangkat komputer. Animasi UI memakai CSS dan menghormati `prefers-reduced-motion`.

## Dokumen proyek

- [Brief produk & desain](GRAVITY_PROJECT_BRIEF.md)
- [Handoff engineering](CODEX_ENGINEERING_HANDOFF.md)
- [Audit sumber](PIXELAND_SOURCE_AUDIT.md)
- [Product direction](PIXELAND_PRODUCT_DIRECTION.md)

