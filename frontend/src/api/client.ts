import axios from 'axios';
import { API_BASE_URL } from '../utils/media';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      let message = 'Произошла ошибка';
      if (status === 400) message = data?.message || 'Неверный запрос';
      else if (status === 401) message = 'Необходима авторизация';
      else if (status === 404) message = 'Ресурс не найден';
      else if (status === 500) message = 'Ошибка сервера';
      error.displayMessage = message;
    } else if (error.request) {
      error.displayMessage = 'Сервер не отвечает. Проверьте подключение.';
    } else {
      error.displayMessage = 'Ошибка при отправке запроса';
    }
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});