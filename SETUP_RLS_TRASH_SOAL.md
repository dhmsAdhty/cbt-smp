## Setup Row Level Security (RLS) untuk Fitur Trash Soal

Jika soal yang soft delete belum muncul di menu "Soal Terhapus", kemungkinan masalahnya adalah **Row Level Security (RLS) policy** yang membatasi akses.

### Langkah-langkah Setup RLS di Supabase:

1. **Buka Supabase Console**
   - Kunjungi https://supabase.com/dashboard
   - Pilih project Anda

2. **Navigasi ke Authentication Settings**
   - Klik menu `SQL Editor` (atau buka langsung query editor)

3. **Jalankan query berikut untuk setup RLS Policy:**

```sql
-- Disable RLS untuk testing (jika diperlukan)
-- ALTER TABLE bank_soal DISABLE ROW LEVEL SECURITY;

-- Atau setup policy yang tepat untuk admin:

-- 1. Policy untuk admin view semua soal (termasuk yang deleted)
CREATE POLICY "admin_view_all_soal_including_trash" 
ON bank_soal 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 2. Policy untuk guru view soal mereka sendiri
CREATE POLICY "guru_view_own_soal" 
ON bank_soal 
FOR SELECT 
USING (
  guru_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 3. Policy untuk admin restore/update soal
CREATE POLICY "admin_update_soal" 
ON bank_soal 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 4. Policy untuk admin delete soal (permanent)
CREATE POLICY "admin_delete_soal" 
ON bank_soal 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);
```

### Jika Tetap Tidak Muncul:

**Cek di Console Browser (F12):**
- Buka DevTools → Console tab
- Lihat console log untuk debug message
- Akan terlihat:
  - "Sample of all soal data:" - data soal yang ada di DB
  - "Trashed soals fetched:" - soal yang sudah dihapus
  - "Error fetching trashed soal:" - jika ada error

**Kemungkinan masalah:**

1. **RLS Policy terlalu ketat**
   - Solusi: Gunakan query di atas untuk update policy

2. **Soal belum benar-benar soft delete**
   - Verifikasi: Cek di Supabase console apakah `deleted_at` sudah terisi
   - Buka tabel `bank_soal` → lihat kolom `deleted_at`

3. **Auth token tidak valid**
   - Solusi: Logout dan login kembali

4. **Column name berbeda**
   - Verifikasi nama column `deleted_at`, `guru_id`, `mapel_id`, `kelas_id`
   - Jika berbeda, update query di `TrashBankSoalView.jsx`

### Testing:

**Untuk test tanpa RLS:**
```sql
-- Temporary disable RLS (HANYA untuk testing)
ALTER TABLE bank_soal DISABLE ROW LEVEL SECURITY;

-- Setelah test, aktifkan kembali:
ALTER TABLE bank_soal ENABLE ROW LEVEL SECURITY;
```

### Debugging Steps:

1. Buka browser Console (F12 → Console)
2. Klik "Soal Terhapus" di admin panel
3. Lihat console log:
   - Jika ada "Sample of all soal data: []" → database kosong
   - Jika ada "Trashed soals fetched: []" tapi ada data normal → RLS blocking
   - Jika ada error detail → copy error dan cek dokumentasi Supabase

---

**Catatan:** Real-time subscription sudah disetup, jadi data akan auto-refresh saat ada perubahan di database.
