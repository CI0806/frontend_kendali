import network from "@/utils/network";

const cuti = {
  async create(data) {
    return network.post("/cuti/ajukan", data, {
      headers: {
        // Biarkan browser yang mengatur boundary secara otomatis
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async manual(data) {
    return network.post("/cuti/manual", data);
  },

  // Untuk Koordinator melihat antrean
  async getPendingVerifikasi() {
    const token = localStorage.getItem("token"); // Ambil token hasil login
    return network.get("/cuti/pending-verifikasi", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Untuk Pimpinan melihat antrean
  async getPendingApproval(params) {
    return network.get("/cuti/pending-approval", { params });
  },

  // Aksi Koordinator (Update Verif)
  async verify(id, data) {
    // Karena di Go Fiber kita pakai BodyParser, kirim sebagai JSON biasa
    return network.put(`/cuti/verify/${id}`, data);
  },

  // Aksi Pimpinan (Update Approve + Potong Saldo)
  async approve(id, data) {
    return network.put(`/cuti/approve/${id}`, data);
  },

  async getRiwayatSaya() {
    return network.get("/cuti/riwayat-saya"); // Backend akan cek ID dari token
  },

  // Fungsi untuk mengambil data kalender tim berdasarkan bulan dan tahun
  async getKalenderTim(month, year) {
    return network.get("/cuti/kalender-tim", {
      params: { month, year },
    });
  },

  // Fungsi baru untuk mengambil detail data cetak
  async cetak(publicId) {
    // Memanggil endpoint spesifik detail untuk di-render di form cetak
    return network.get(`/cuti/detail/${publicId}`);
  },

  async analyzeAnomaly(pegawaiId) {
    return network.get(`/cuti/anomaly/${pegawaiId}`);
  },
};

export default cuti;
