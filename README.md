# Aplikasi Akuntansi Bisnis

Aplikasi web modern untuk mengelola transaksi keuangan bisnis dengan dukungan multi-akun (contoh: Kas, Bank, E-Wallet, dll). Aplikasi ini berjalan sepenuhnya di sisi klien (client-side) dan **tidak menggunakan database server**, sehingga semua data keuangan Anda tetap aman di perangkat Anda sendiri.

> **Keunggulan**: Aplikasi ini menggunakan format Excel yang standar, sehingga data Anda tidak terkunci dalam sistem. Anda dapat:
> - Membuka file Excel yang ada langsung di aplikasi
> - Mengekspor data kapan saja ke format Excel standar
> - Melanjutkan pengeditan di Microsoft Excel, Google Sheets, atau aplikasi spreadsheet lainnya
> - Tidak ada ketergantungan pada platform ini - data Anda tetap dapat diakses bahkan tanpa aplikasi ini

> **Penting**: Aplikasi ini tidak menyimpan data sensitif Anda di server manapun. Semua data diproses di browser Anda. Pastikan untuk mengekspor (export) data Anda secara berkala untuk menghindari kehilangan data saat menutup browser atau me-refresh halaman.

## ✨ Fitur Utama

- **Manajemen Multi-Akun**: Dukungan untuk beberapa akun dengan tipe yang dapat disesuaikan (contoh: Kas, Bank, E-Wallet, dll)
- **Template Excel**: Unduh template Excel yang sudah diformat dengan standar akuntansi
- **Unggah Data**: Unggah file Excel dengan validasi data yang komprehensif
- **Editor Transaksi**: 
  - Tambah, edit, dan hapus transaksi
  - Hitung saldo berjalan (running balance) otomatis
  - Kategori transaksi yang dinamis
- **Manajemen Kategori**: 
  - Tambah/edit/hapus kategori penerimaan dan pengeluaran
  - Filter transaksi berdasarkan kategori
- **Laporan Keuangan**: 
  - Ringkasan keuangan harian/bulanan/tahunan
  - Visualisasi data dengan grafik interaktif
  - Ekspor laporan ke Excel/PDF
- **Pengingat Ekspor**: 
  - Notifikasi pengingat untuk mengekspor data secara berkala
  - Pengaturan interval yang dapat disesuaikan
- **Antarmuka Responsif**: Dapat digunakan di berbagai perangkat (desktop/tablet/mobile)

## 🛠️ Teknologi yang Digunakan

### Backend
- **Python 3.11+**: Bahasa pemrograman utama
- **FastAPI**: Framework web modern untuk membangun API
- **Pandas + openpyxl**: Manipulasi data dan operasi Excel
- **Uvicorn**: ASGI server untuk menjalankan FastAPI
- **Pydantic**: Validasi data dan manajemen pengaturan

### Frontend
- **React 18**: Library untuk membangun antarmuka pengguna
- **TypeScript**: JavaScript dengan tipe data yang ketat
- **Vite**: Build tool dan development server yang cepat
- **Tailwind CSS**: Framework CSS utility-first
- **Recharts**: Library untuk visualisasi data
- **React Table**: Tabel data yang dapat diedit
- **React Hot Toast**: Notifikasi yang informatif
- **Heroicons**: Koleksi ikon yang modern

## 🚀 Memulai

### Persyaratan Sistem

- **Node.js 18+** - [Unduh](https://nodejs.org/)
- **Python 3.11+** - [Unduh](https://www.python.org/downloads/)
- **npm** (sudah termasuk dengan Node.js) atau **yarn** (direkomendasikan)
- **Git** - [Unduh](https://git-scm.com/)
- **GitHub CLI** (opsional) - Untuk deployment

### 🛠️ Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/business-accounting-app.git
   cd business-accounting-app
   ```

2. **Set up Python virtual environment**
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Environment Variables**
   Create a `.env` file in the project root:
   ```env
   # Server Configuration
   PORT=8000
   HOST=0.0.0.0
   
   # Development Settings
   DEBUG=true
   
   # CORS (Comma-separated origins)
   CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

5. **Start the backend server**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000 
   ```
   - API Base URL: `http://localhost:8000`

### 💻 Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   # Using npm
   npm install

3. **Environment Variables**
   Create a `.env` file in the `frontend` directory:
   ```env
   # API Configuration
   VITE_API_BASE_URL=http://localhost:8000
   
   # App Configuration
   NODE_ENV=development
   DEBUG=true
   ```

4. **Start the development server**
   ```bash
   # Using npm
   npm run dev
   
   # Or using yarn
   yarn dev
   ```
   - Application: `http://localhost:3000`
   - Vite Dev Server: `http://localhost:3000`

5. **Build for Production**
   ```bash
   # Build the app
   npm run build
   
   # Preview the production build
   npm run preview
   ```

### Endpoint yang Tersedia

- `GET /` - Cek status API
- `GET /health` - Health check endpoint
- `GET /template` - Unduh template Excel
- `POST /upload` - Unggah file data keuangan
- `POST /save` - Simpan perubahan transaksi
- `GET /reports/summary` - Ringkasan laporan keuangan
- `GET /reports/monthly` - Laporan bulanan
- `GET /reports/yearly` - Laporan tahunan

## 🏗️ Struktur Proyek

```
Business-Accounting-App/
├── frontend/               # Aplikasi React frontend
│   ├── public/             # Aset statis
│   ├── src/
│   │   ├── @types/         # Definisi tipe TypeScript
│   │   ├── components/     # Komponen UI yang dapat digunakan ulang
│   │   │   ├── common/     # Komponen umum (tombol, input, dll.)
│   │   │   ├── layout/     # Komponen tata letak
│   │   │   └── reports/    # Komponen khusus laporan
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Halaman aplikasi
│   │   │   ├── EditorPage/   # Halaman editor transaksi
│   │   │   ├── UploadPage/   # Halaman unggah file
│   │   │   └── ReportsPage/  # Halaman laporan
│   │   ├── services/       # Layanan API
│   │   ├── types/          # Definisi tipe TypeScript
│   │   ├── utils/          # Fungsi utilitas
│   │   ├── App.tsx         # Komponen App utama
│   │   └── main.tsx        # Entry point aplikasi
│   ├── .env                # Variabel lingkungan
│   ├── index.html          # Template HTML
│   ├── package.json        # Dependensi dan skrip
│   ├── tsconfig.json       # Konfigurasi TypeScript
│   ├── tailwind.config.js  # Konfigurasi Tailwind CSS
│   └── vite.config.ts      # Konfigurasi Vite
│
├── excels/                 # File Excel yang diunggah
├── output/                # File output yang dihasilkan
├── .venv/                 # Lingkungan virtual Python
├── .env                   # Variabel lingkungan
├── main.py                # Aplikasi FastAPI
├── generate_template.py    # Pembuatan template Excel
├── requirements.txt        # Dependensi Python
├── render.yaml            # Konfigurasi deployment Render
├── README.md              # File ini
└── .gitignore             # File git ignore
```


## 🌐 Deployment

Aplikasi ini dapat di-deploy dengan mudah menggunakan layanan berikut:

### Frontend (Vercel)
1. Push kode ke repository GitHub
2. Buat proyek baru di Vercel
3. Hubungkan ke repository GitHub
4. Atur variabel lingkungan yang diperlukan
5. Deploy!

### Backend (Render)
1. Push kode ke repository GitHub
2. Buat layanan Web Service baru di Render
3. Pilih repository GitHub
4. Konfigurasi:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment Variables: Sesuaikan dengan kebutuhan

## 👥 Berkontribusi

Kontribusi sangat diterima! Silakan ikuti langkah-langkah berikut:

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b fitur/namafitur`)
3. Commit perubahan Anda (`git commit -m 'Menambahkan fitur baru'`)
4. Push ke branch (`git push origin fitur/namafitur`)
5. Buka Pull Request

## 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT - lihat file [LICENSE](LICENSE) untuk detailnya.

## 🙏 Ucapan Terima Kasih

- [FastAPI](https://fastapi.tiangolo.com/) - Framework web yang digunakan
- [React](https://reactjs.org/) - Library frontend
- [Tailwind CSS](https://tailwindcss.com/) - Untuk styling
- [Vite](https://vitejs.dev/) - Untuk tooling frontend
- [Recharts](https://recharts.org/) - Untuk visualisasi data
