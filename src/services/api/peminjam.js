import network from "@/utils/network";

const peminjaman = {
  async getall() {
    return network.get("/peminjaman");
  },

  async create(data) {
    return network.post("/peminjaman", data);
  },

  async returnDocument(id) {
    return network.put(`/peminjaman/return/${id}`);
  },
  
  async approve(id) {
    return network.put(`/peminjaman/approve/${id}`);
  },

  async history() {
    return network.get("/peminjaman/history");
  },

  async getById(id) {
    return network.get(`/peminjaman/${id}`);
  },
};

export default peminjaman;
