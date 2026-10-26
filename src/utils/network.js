import axios from 'axios';

import session from './session';

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const defaultBaseURL = isLocalhost ? 'http://localhost:3000/api/v1' : 'https://api.pkmkarjotarakan.com/api/v1';

const network = axios.create({
  baseURL: defaultBaseURL,
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
