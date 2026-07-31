import network from "@/utils/network";

const arsip = {
  async create(data) {
    return network.post("/arsip/upload", data, {
      headers: {
        // Biarkan browser yang mengatur boundary secara otomatis
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async getall() {
    return network.get("/arsip/all");
  },

  async update(id, data) {
    // Ini untuk update perihal atau tgl_arsip
    return network.put(`/arsip/${id}`, data);
  },

  async updateLokasi(id, lokasiID) {
    return network.patch(`/arsip/${id}/lokasi`, {
      lokasi_id: lokasiID,
    });
  },

  async getByKlasifikasi(id) {
    return network.get(`/arsip/klasifikasi/${id}`);
  },

  async delete(payload) {
    // Mengarah ke endpoint DELETE /arsip/:id
    return network.post("/arsip/delete-batch", payload);
  },

  async createFromFolder(data) {
    // Kita gunakan endpoint baru yang sudah kita daftarkan di routes.go
    return network.post("/arsip/upload-folder", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async uploadVersion(id, data) {
    return network.post(`/arsip/${id}/version`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async getVersions(id) {
    return network.get(`/arsip/${id}/version`);
  },

  async analyze(id) {
    return network.get(`/arsip/${id}/analyze`);
  },
};

export default arsip;
