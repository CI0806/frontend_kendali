import network from '@/utils/network';

const penomoran = {
  generate: (data) => network.post('/penomoran/generate', data),
  getAll: () => network.get('/penomoran'),
  update: (id, data) => network.put(`/penomoran/${id}`, data),
  delete: (id) => network.delete(`/penomoran/${id}`),
};

export default penomoran;
