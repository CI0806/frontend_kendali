import network from "@/utils/network";

const dokumen = {
  async create(data) {
    return network.post("/dokumen/ajukan", data, {
      headers: {
        // Biarkan browser yang mengatur boundary secara otomatis
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async getRiwayatDokumen() {
    return network.get("/dokumen/riwayat-saya");
  },

  async getPendingApproval() {
    return network.get("/dokumen/data-dokumen")
  },

  async verify(id, data) {
    return network.put(`/dokumen/verify/${id}`, data);
  },

  async approve(id, data) {
    return network.put(`/dokumen/approve/${id}`, data);
  },

  async analyze(id) {
    return network.get(`/dokumen/${id}/analyze`);
  },
};

export default dokumen;
