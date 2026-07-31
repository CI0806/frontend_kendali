import network from "@/utils/network";

const lokasi = {
  async create(data) {
    return network.post("/lokasi", data);
  },

  async getall() {
    return network.get("/lokasi");
  },

  async update(id, data) {
    return network.put(`/lokasi/${id}`, data);
  },

  async delete(id) {
    return network.delete(`/lokasi/${id}`);
  }
};

export default lokasi;
