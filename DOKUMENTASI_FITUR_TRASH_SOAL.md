## Fitur Manajemen Soal Terhapus - Admin Panel

### Ringkasan Fitur
Admin sekarang dapat mengelola soal yang telah di-soft delete oleh guru. Fitur ini memungkinkan admin untuk:

1. **Melihat semua soal yang dihapus** dari semua guru
2. **Filter soal berdasarkan:**
   - Keyword pertanyaan
   - Guru pemilik soal
   - Mata pelajaran (mapel)
   - Kelas yang terkait

3. **Aksi pada soal:**
   - **Kembalikan (Restore)** - Mengembalikan soal ke bank soal guru asli
   - **Hapus Permanen** - Menghapus soal secara permanen dari database

### Informasi Detail yang Ditampilkan
Setiap kartu soal menampilkan:
- ✅ Pertanyaan soal (preview)
- ✅ Tipe soal (Pilihan Ganda / Essay)
- ✅ **Nama guru pemilik soal**
- ✅ Email guru
- ✅ **Mata pelajaran (Mapel)**
- ✅ **Kelas yang terkait**
- ✅ Tanggal dan waktu penghapusan
- ✅ Preview jawaban/opsi (untuk pilihan ganda)
- ✅ Pedoman penilaian (untuk essay)

### Struktur Folder & File
```
src/
├── components/
│   └── admin/
│       └── TrashBankSoal/
│           └── TrashBankSoalView.jsx (NEW)
├── pages/
│   └── dashboard/
│       └── Admin.jsx (UPDATED)
└── Sidebar.jsx (UPDATED)
```

### File yang Diubah

#### 1. **TrashBankSoalView.jsx** (NEW)
File komponen utama untuk mengelola soal terhapus.

**Custom Hooks:**
- `useKelas()` - Mengambil daftar semua kelas
- `useMapel()` - Mengambil daftar semua mata pelajaran
- `useGuru()` - Mengambil daftar semua guru
- `useTrashBankSoal()` - Mengambil soal yang di-soft delete dengan relasi data guru, mapel, kelas

**Fitur Utama:**
- Filter soal berdasarkan keyword, guru, mapel, dan kelas
- Restore soal (mengembalikan ke bank soal guru)
- Delete permanen soal
- Informasi detail lengkap untuk setiap soal
- Animasi smooth dengan Framer Motion

#### 2. **Admin.jsx** (UPDATED)
Menambahkan:
- Import `TrashBankSoalView`
- Case baru di `renderContent()` untuk `trash_soal`
- Title dan description untuk halaman Soal Terhapus

#### 3. **Sidebar.jsx** (UPDATED)
Menambahkan:
- Import `Trash01Icon` dari hugeicons-react
- Menu item baru `trash_soal` dengan label "Soal Terhapus" dan icon Trash01Icon
- Menu item ditempatkan sebelum Settings untuk navigasi yang logis

### Cara Kerja Flow

```
Admin membuka Admin Panel
         ↓
Menu Sidebar → Klik "Soal Terhapus"
         ↓
Admin melihat daftar soal yang di-soft delete
         ↓
Admin dapat:
   ├── 🔍 Filter dengan keyword/guru/mapel/kelas
   ├── ✅ Klik "Kembalikan" untuk restore
   │       └── Soal dikembalikan ke bank soal guru asli
   └── ❌ Klik "Hapus Permanen" untuk delete permanent
           └── Soal dihapus selamanya dari database
```

### Query Basis Data yang Digunakan

**Fetch soal terhapus:**
```sql
SELECT * FROM bank_soal
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC
```

**Restore soal:**
```sql
UPDATE bank_soal
SET deleted_at = NULL
WHERE id = {id}
```

**Delete permanen:**
```sql
DELETE FROM bank_soal
WHERE id = {id}
```

### UI/UX Features
✅ Glass-morphism cards untuk design yang modern
✅ Filter toolbar yang responsif
✅ Grid layout yang responsive (1 kolom mobile, 2 tablet, 3 desktop)
✅ Info box berwarna untuk setiap informasi:
   - Biru untuk Guru
   - Hijau untuk Mapel  
   - Ungu untuk Kelas
✅ Animasi smooth saat loading dan transisi
✅ Toast notification dengan SweetAlert2 untuk feedback user
✅ Empty state yang user-friendly
✅ Loading spinner

### Validasi & Error Handling
✅ Cek akses data sebelum delete/restore
✅ Error message yang jelas jika operasi gagal
✅ Konfirmasi dialog sebelum aksi permanen
✅ Loading state saat proses

### Integrasi dengan Sistem yang Ada
- Menggunakan supabase client yang sudah ada
- Konsisten dengan design system (GlassCard, ActionButton, etc.)
- Menggunakan Select component yang sudah ada
- Menggunakan icon library hugeicons-react yang sudah ada
- Menggunakan SweetAlert2 untuk notification
- Menggunakan Framer Motion untuk animasi

### Catatan Keamanan
⚠️ Perlu ditambahkan Row Level Security (RLS) di Supabase untuk memastikan:
- Admin hanya bisa melihat soal yang benar-benar ada
- Delete/Restore hanya bisa dilakukan oleh admin
- Guru tidak bisa mengakses endpoint ini

Rekomendasi policy di Supabase:
```sql
-- Policy untuk view trash soal (admin only)
CREATE POLICY "admin_view_trash_soal" ON bank_soal
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policy untuk restore/delete trash soal (admin only)
CREATE POLICY "admin_update_trash_soal" ON bank_soal
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "admin_delete_trash_soal" ON bank_soal
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');
```
