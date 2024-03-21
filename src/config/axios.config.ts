import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://todoctopus-ruxs.onrender.com/api/v1',
});

export default axiosInstance;
