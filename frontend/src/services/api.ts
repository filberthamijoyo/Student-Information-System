import axios from 'axios';

/**
 * API Service Layer
 * Handles all HTTP requests to the backend
 */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface LoginData {
  userIdentifier?: string;
  email?: string;
  password: string;
}

export interface RegisterData {
  userIdentifier: string;
  email: string;
  password: string;
  fullName: string;
  role?: string;
  major?: string;
  yearLevel?: number;
}

export interface CourseFilters {
  search?: string;
  department?: string;
  semester?: string;
  year?: number;
  credits?: number;
  availableOnly?: boolean;
}

// Auth API
export const authAPI = {
  register: (data: RegisterData) => api.post('/auth/register', data),
  login: (data: LoginData) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

// Course API
export const courseAPI = {
  getAll: (params?: CourseFilters) => api.get('/courses', { params }),
  getById: (id: number) => api.get(`/courses/${id}`),
  search: (query: string) => api.get('/courses/search', { params: { q: query } }),
  getDepartments: () => api.get('/courses/departments'),
};

// Enrollment API
export const enrollmentAPI = {
  enroll: (courseId: number) => api.post('/enrollments', { courseId }),
  getMyCourses: () => api.get('/enrollments/my-courses'),
  drop: (enrollmentId: number) => api.delete(`/enrollments/${enrollmentId}`),
  getStatus: (jobId: string) => api.get(`/enrollments/status/${jobId}`),
  getWaitlist: (courseId: number) => api.get(`/enrollments/waitlist/${courseId}`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAllEnrollments: () => api.get('/admin/enrollments'),
  updateEnrollment: (id: number, data: any) => api.put(`/admin/enrollments/${id}`, data),
};

export default api;
