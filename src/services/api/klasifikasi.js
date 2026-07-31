import network from "@/utils/network";

const klasifikasi = {
  async create(data) {
    return network.post("/klasifikasi", data);
  },

  async autoCreate(data) {
    return network.post("/klasifikasi/auto-create", data);
  },

  async getTree() {
    return network.get("/klasifikasi/tree");
  },

  // Tambahkan fungsi ini
  async update(id, data) {
    return network.put(`/klasifikasi/${id}`, data);
  },

  // Tambahkan juga fungsi hapus jika nanti diperlukan
  async delete(id) {
    return network.delete(`/klasifikasi/${id}`);
  },
};

export default klasifikasi;
