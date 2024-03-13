import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://todo-app-pz34.onrender.com/api/v1',
  timeout: 10000,
});

export default axiosInstance;
