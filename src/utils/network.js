import axios from 'axios';

import session from './session';

const network = axios.create({
  baseURL: 'https://api.pkmkarjotarakan.com/api/v1',
  //baseURL: 'http://localhost:3000/api/v1',
  // http://localhost:3000/api/v1
});

network.interceptors.request.use(
  (config) => {
    const token = session.getToken();
    //console.log("Token yang dikirim:", token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

network.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      //console.warn("Mendapat 401 dari:", error.config.url);
      session.clearSession();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default network;
