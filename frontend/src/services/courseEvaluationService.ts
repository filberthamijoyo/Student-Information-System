import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface CourseEvaluation {
  id: number;
  student_id: number;
  course_id: number;
  term: 'FALL' | 'SPRING' | 'SUMMER';
  year: number;
  overall_rating: number;
  instructor_rating: number;
  course_content_rating: number;
  workload_rating: number;
  comments?: string;
  is_anonymous: boolean;
  submitted_at: string;
  course_code?: string;
  course_name?: string;
  department?: string;
}

export interface SubmitEvaluationData {
  student_id: number;
  course_id: number;
  term: 'FALL' | 'SPRING' | 'SUMMER';
  year: number;
  overall_rating: number;
  instructor_rating: number;
  course_content_rating: number;
  workload_rating: number;
  comments?: string;
  is_anonymous?: boolean;
}

export interface CourseStats {
  course: {
    course_code: string;
    course_name: string;
    department: string;
  };
  statistics: {
    total_responses: number;
    average_overall_rating: string;
    average_instructor_rating: string;
    average_course_content_rating: string;
    average_workload_rating: string;
  };
  comments: Array<{
    comments: string;
    submitted_at: string;
    student_name: string;
  }>;
}

export interface PendingEvaluation {
  id: number;
  course_code: string;
  course_name: string;
  department: string;
  semester: string;
  year: number;
  credits: number;
  instructor_name?: string;
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const courseEvaluationService = {
  async submitEvaluation(data: SubmitEvaluationData): Promise<CourseEvaluation> {
    const response = await axios.post(`${API_BASE_URL}/course-evaluation/submit`, data, {
      headers: getAuthHeader()
    });
    return response.data.data;
  },

  async getMyEvaluations(studentId: number): Promise<CourseEvaluation[]> {
    const response = await axios.get(`${API_BASE_URL}/course-evaluation/my-evaluations/${studentId}`, {
      headers: getAuthHeader()
    });
    return response.data.data;
  },

  async getCourseStats(courseId: number): Promise<CourseStats> {
    const response = await axios.get(`${API_BASE_URL}/course-evaluation/course-stats/${courseId}`, {
      headers: getAuthHeader()
    });
    return response.data.data;
  },

  async getPendingEvaluations(studentId: number): Promise<PendingEvaluation[]> {
    const response = await axios.get(`${API_BASE_URL}/course-evaluation/pending/${studentId}`, {
      headers: getAuthHeader()
    });
    return response.data.data;
  }
};
