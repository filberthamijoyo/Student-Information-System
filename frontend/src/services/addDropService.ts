import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface AddDropRequest {
  id: number;
  student_id: number;
  course_id: number;
  request_type: 'ADD' | 'DROP';
  request_date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  is_late_request: boolean;
  approved_by?: number;
  approved_date?: string;
  rejection_reason?: string;
  course_code?: string;
  course_name?: string;
  department?: string;
  credits?: number;
  semester?: string;
  year?: number;
  approver_name?: string;
  student_name?: string;
  major?: string;
  year_level?: number;
}

export interface SubmitRequestData {
  student_id: number;
  course_id: number;
  request_type: 'ADD' | 'DROP';
  reason: string;
  is_late_request?: boolean;
}

export interface ApproveRequestData {
  approved_by: number;
}

export interface RejectRequestData {
  approved_by: number;
  rejection_reason: string;
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const addDropService = {
  async submitRequest(data: SubmitRequestData): Promise<AddDropRequest> {
    const response = await axios.post(`${API_BASE_URL}/add-drop/request`, data, {
      headers: getAuthHeader()
    });
    return response.data.data;
  },

  async getMyRequests(studentId: number): Promise<AddDropRequest[]> {
    const response = await axios.get(`${API_BASE_URL}/add-drop/my-requests/${studentId}`, {
      headers: getAuthHeader()
    });
    return response.data.data;
  },

  async getPendingRequests(): Promise<AddDropRequest[]> {
    const response = await axios.get(`${API_BASE_URL}/add-drop/pending-requests`, {
      headers: getAuthHeader()
    });
    return response.data.data;
  },

  async approveRequest(requestId: number, data: ApproveRequestData): Promise<void> {
    const response = await axios.put(
      `${API_BASE_URL}/add-drop/approve/${requestId}`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  async rejectRequest(requestId: number, data: RejectRequestData): Promise<void> {
    const response = await axios.put(
      `${API_BASE_URL}/add-drop/reject/${requestId}`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  }
};
