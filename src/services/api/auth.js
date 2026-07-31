import network from '@/utils/network';

const auth = {
  login(payload) {
    return network.post('/auth/login', payload);
  },

  // signup
};

export default auth;
