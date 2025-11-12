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

// Academic Records API
export const academicAPI = {
  getGrades: () => api.get('/academic/grades'),
  getGradesByTerm: (semester: string, year: number) =>
    api.get('/academic/grades/term', { params: { semester, year } }),
  getCourseGrade: (courseId: number) => api.get(`/academic/grades/course/${courseId}`),
  getTranscript: () => api.get('/academic/transcript'),
  getUnofficialTranscript: () => api.get('/academic/transcript/unofficial'),
  generateTranscriptPDF: () => api.get('/academic/transcript/pdf'),
  getGPA: () => api.get('/academic/gpa'),
  getGPAHistory: () => api.get('/academic/gpa/history'),
};

// Financial API
export const financialAPI = {
  getAccount: () => api.get('/financial/account'),
  getCharges: () => api.get('/financial/charges'),
  getUnpaidCharges: () => api.get('/financial/charges/unpaid'),
  getPayments: () => api.get('/financial/payments'),
  makePayment: (data: {
    amount: number;
    method: string;
    referenceNumber: string;
  }) => api.post('/financial/payments', data),
  getStatement: (semester: string, year: number) =>
    api.get(`/financial/statement/${semester}/${year}`),
};

// Applications API
export const applicationAPI = {
  getMyApplications: () => api.get('/applications'),
  submitApplication: (data: {
    type: string;
    semester?: string;
    year?: number;
    reason: string;
    supportingDocs?: any;
  }) => api.post('/applications', data),
  getApplication: (id: number) => api.get(`/applications/${id}`),
  withdrawApplication: (id: number) => api.put(`/applications/${id}/withdraw`),
  getPendingApplications: () => api.get('/applications/admin/pending'),
  reviewApplication: (id: number, data: {
    status: string;
    decision: string;
    reviewNotes?: string;
  }) => api.put(`/applications/admin/${id}/review`, data),
};

// Personal Info API
export const personalAPI = {
  getPersonalInfo: () => api.get('/personal'),
  updatePersonalInfo: (data: any) => api.put('/personal', data),
  updateEmergencyContact: (data: {
    emergencyName?: string;
    emergencyRelation?: string;
    emergencyPhone?: string;
    emergencyEmail?: string;
  }) => api.put('/personal/emergency-contact', data),
  updateAddress: (data: {
    permanentAddress?: string;
    mailingAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }) => api.put('/personal/address', data),
};

// Planning & Advising API
export const planningAPI = {
  getDegreeAudit: () => api.get('/planning/degree-audit'),
  getRequirements: () => api.get('/planning/requirements'),
  getProgress: () => api.get('/planning/progress'),
  getAdvisor: () => api.get('/planning/advisor'),
  getCoursePlan: () => api.get('/planning/plan'),
  saveCoursePlan: (data: any) => api.post('/planning/plan', data),
};

// Faculty Center API
export const facultyAPI = {
  getMyCourses: () => api.get('/faculty/courses'),
  getRoster: (courseId: number) => api.get(`/faculty/courses/${courseId}/roster`),
  getCourseGrades: (courseId: number) => api.get(`/faculty/courses/${courseId}/grades`),
  submitGrades: (grades: Array<{
    enrollmentId: number;
    numericGrade: number;
    letterGrade: string;
    comments?: string;
  }>) => api.post('/faculty/grades/submit', { grades }),
  updateGrade: (gradeId: number, data: {
    numericGrade?: number;
    letterGrade: string;
    comments?: string;
  }) => api.put(`/faculty/grades/${gradeId}`, data),
  getAttendance: (courseId: number) => api.get(`/faculty/courses/${courseId}/attendance`),
  markAttendance: (attendanceRecords: Array<{
    enrollmentId: number;
    date: string;
    status: string;
    notes?: string;
  }>) => api.post('/faculty/attendance', { attendanceRecords }),
  getMaterials: (courseId: number) => api.get(`/faculty/courses/${courseId}/materials`),
  uploadMaterial: (courseId: number, data: {
    title: string;
    description?: string;
    type: string;
    fileUrl: string;
    fileName: string;
    fileSize?: number;
    isVisible?: boolean;
  }) => api.post(`/faculty/courses/${courseId}/materials`, data),
};

// Campus Information API
export const campusAPI = {
  getAnnouncements: () => api.get('/campus/announcements'),
  getAnnouncement: (id: number) => api.get(`/campus/announcements/${id}`),
  getEvents: (params?: {
    category?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/campus/events', { params }),
  getUpcomingEvents: () => api.get('/campus/events/upcoming'),
  registerForEvent: (id: number) => api.post(`/campus/events/${id}/register`),
};

export default api;
