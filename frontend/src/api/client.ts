import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5199/api';

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
      // Сервер ответил с ошибкой (4xx, 5xx)
      const status = error.response.status;
      const data = error.response.data;
      
      let message = 'Произошла ошибка';
      
      if (status === 400) message = data?.message || 'Неверный запрос';
      else if (status === 401) message = 'Необходима авторизация';
      else if (status === 404) message = 'Ресурс не найден';
      else if (status === 500) message = 'Ошибка сервера';
      
      error.displayMessage = message;
    } else if (error.request) {
      // Запрос был отправлен, но ответа нет
      error.displayMessage = 'Сервер не отвечает. Проверьте подключение.';
    } else {
      // Ошибка при настройке запроса
      error.displayMessage = 'Ошибка при отправке запроса';
    }
    
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Добавить в headers, если есть токен
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});