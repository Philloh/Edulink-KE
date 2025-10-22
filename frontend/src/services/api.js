import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  teacherVerify: (verificationData) => api.post('/auth/teacher/verify', verificationData),
  teacherComplete: (completionData) => api.post('/auth/teacher/complete', completionData),
}

// Messages API
export const messagesAPI = {
  getMessages: (params) => api.get('/messages', { params }),
  getInbox: (params) => api.get('/messages/inbox', { params }),
  getSent: (params) => api.get('/messages/sent', { params }),
  getMessage: (id) => api.get(`/messages/${id}`),
  sendMessage: (messageData) => api.post('/messages', messageData),
  markAsRead: (id) => api.put(`/messages/${id}/read`),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
  getStats: () => api.get('/messages/stats'),
}

// Progress API
export const progressAPI = {
  getProgress: (params) => api.get('/progress', { params }),
  getProgressById: (id) => api.get(`/progress/${id}`),
  createProgress: (progressData) => api.post('/progress', progressData),
  updateProgress: (id, progressData) => api.put(`/progress/${id}`, progressData),
  publishProgress: (id) => api.put(`/progress/${id}/publish`),
  addFeedback: (id, feedback) => api.post(`/progress/${id}/feedback`, { parentFeedback: feedback }),
  getStats: () => api.get('/progress/stats/overview'),
}

// Resources API
export const resourcesAPI = {
  getResources: (params) => api.get('/resources', { params }),
  getResource: (id) => api.get(`/resources/${id}`),
  createResource: (resourceData) => api.post('/resources', resourceData),
  updateResource: (id, resourceData) => api.put(`/resources/${id}`, resourceData),
  deleteResource: (id) => api.delete(`/resources/${id}`),
  getCategories: () => api.get('/resources/categories'),
  getStats: () => api.get('/resources/stats/overview'),
}

// Users API
export const usersAPI = {
  getStudents: () => api.get('/users/students'),
  getTeachers: () => api.get('/users/teachers'),
}

// Schools API
export const schoolsAPI = {
  createSchool: (schoolData) => api.post('/schools', schoolData),
  getSchools: (params) => api.get('/schools', { params }),
}

export default api
