import network from "@/utils/network";

const pegawai = {
  async allpegawai(params) {
    return network.get("/pegawai", {
      params,
    });
  },

  async updatePassword(data) {
    return network.post("/pegawai/update-password", data);
  },

  async getMyProfile() {
    return network.get("/pegawai/my-profile");
  },

  async cariAtasan(params) {
    return network.get("/pegawai/search-atasan", { params });
  },

  async create(data) {
    return network.post("/pegawai", data);
  },

  async update(id, data) {
    return network.put(`/pegawai/${id}`, data);
  },

  async delete(id) {
    return network.delete(`/pegawai/${id}`);
  },

  async kuotaUpdate(data) {
    return network.post("/pegawai/update-kuota", data);
  },

  async updateProfile(formData) {
    return network.put("/pegawai/update-profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export default pegawai;
