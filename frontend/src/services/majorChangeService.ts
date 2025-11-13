import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface MajorChangeRequest {
  id: number;
  student_id: number;
  current_major?: string;
  requested_major: string;
  current_school?: string;
  requested_school: string;
  gpa: number;
  units_completed: number;
  request_date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  supporting_documents?: string;
  approval_decision?: string;
  decision_date?: string;
  student_name?: string;
  student_email?: string;
  year_level?: number;
  approver_name?: string;
}

export interface SubmitMajorChangeData {
  student_id: number;
  requested_major: string;
  requested_school: string;
  gpa: number;
  units_completed: number;
  supporting_documents?: string;
}

export interface DecideMajorChangeData {
  status: 'APPROVED' | 'REJECTED';
  approval_decision: string;
  approver_id: number;
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const majorChangeService = {
  async submitRequest(data: SubmitMajorChangeData): Promise<MajorChangeRequest> {
    const response = await axios.post(`${API_BASE_URL}/major-change/request`, data, {
      headers: getAuthHeader()
    });
    return response.data.data;
  },

  async getMyRequests(studentId: number): Promise<MajorChangeRequest[]> {
    const response = await axios.get(`${API_BASE_URL}/major-change/my-requests/${studentId}`, {
      headers: getAuthHeader()
    });
    return response.data.data;
  },

  async getPendingRequests(): Promise<MajorChangeRequest[]> {
    const response = await axios.get(`${API_BASE_URL}/major-change/pending-requests`, {
      headers: getAuthHeader()
    });
    return response.data.data;
  },

  async decideRequest(requestId: number, data: DecideMajorChangeData): Promise<MajorChangeRequest> {
    const response = await axios.put(
      `${API_BASE_URL}/major-change/decide/${requestId}`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data.data;
  }
};
