import axios from 'axios'
import useAuthStore from '../store/authStore'

const apiClient = axios.create({
  // Use build-time REACT_APP_API_URL or fall back to relative '/api' so
  // browser requests are proxied by top-level nginx to the backend.
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Normalize duplicate "/api" when both baseURL and request paths include it.
    if (config && config.baseURL && config.url) {
      try {
        const base = String(config.baseURL)
        if (base.endsWith('/api') && config.url.startsWith('/api')) {
          config.url = config.url.replace(/^\/api/, '')
        }
      } catch (e) {
        // ignore normalization errors
      }
    }

    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling (e.g. 401 logout)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export default apiClient
