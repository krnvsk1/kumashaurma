import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  // Пытаемся достать токен из хранилища Zustand (первоисточник)
  let token = localStorage.getItem('token');
  
  if (!token) {
    const authStorage = localStorage.getItem('kumashaurma-auth');
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage);
        token = authData.state?.accessToken;
      } catch (e) {
        console.error('Error parsing auth storage', e);
      }
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Добавляем обработку 401 ошибки
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('kumashaurma-auth'); // Очищаем и Zustand storage
      // Мы не можем напрямую вызвать useAuthStore.getState().logout() здесь из-за циклической зависимости,
      // но очистка localStorage поможет при следующей загрузке или проверке состояния.
      // В идеале здесь нужно событие или колбэк.
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
