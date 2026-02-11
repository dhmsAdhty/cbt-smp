# 🎓 CBT Sekolah - Aplikasi Ujian Online Modern

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

Aplikasi **Computer Based Test (CBT)** berbasis web yang dirancang untuk memudahkan sekolah dalam melaksanakan ujian secara digital. Aplikasi ini mendukung multi-role (Admin, Guru, Siswa) dengan keamanan data terintegrasi menggunakan Supabase RLS.

---

## 🚀 Fitur Utama

### 👨‍💼 Panel Admin
- **Dashboard Statistik:** Ringkasan jumlah user, guru, siswa, mapel, dan kelas.
- **Manajemen User:** Tambah akun Guru, Siswa, dan Admin baru (Otomatis terdaftar di Auth & Database).
- **Manajemen Akademik:** CRUD (Create, Read, Update, Delete) Data Kelas dan Mata Pelajaran.
- **Keamanan:** Menggunakan *Service Role* untuk manajemen user tingkat lanjut.

### 👩‍🏫 Panel Guru
- **Bank Soal:** Input soal ujian (Pilihan Ganda).
- **Monitoring:** Melihat rekap nilai siswa per mata pelajaran.
- **Manajemen Ujian:** Mengaktifkan atau menonaktifkan ujian.

### 👨‍🎓 Panel Siswa
- **Ujian Online:** Antarmuka pengerjaan soal yang responsif dan *real-time*.
- **Sistem Nilai:** Perhitungan skor otomatis setelah ujian selesai.
- **Riwayat:** Melihat histori ujian yang pernah dikerjakan.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend:** React.js (Vite Build Tool)
- **Styling:** Tailwind CSS (Modern UI/UX)
- **Backend & Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Email/Password)
- **Routing:** React Router DOM (Protected Routes)
- **Alerts:** SweetAlert2

---
