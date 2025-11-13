import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface AcademicEvent {
  id: number;
  event_type: string;
  term: 'FALL' | 'SPRING' | 'SUMMER';
  year: number;
  start_date: string;
  end_date?: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface AddDropStatus {
  isOpen: boolean;
  period: AcademicEvent | null;
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const academicCalendarService = {
  async getEvents(term?: string, year?: number): Promise<AcademicEvent[]> {
    const params = new URLSearchParams();
    if (term) params.append('term', term);
    if (year) params.append('year', year.toString());

    const response = await axios.get(
      `${API_BASE_URL}/academic-calendar/events${params.toString() ? `?${params}` : ''}`,
      { headers: getAuthHeader() }
    );
    return response.data.data;
  },

  async getAddDropStatus(): Promise<AddDropStatus> {
    const response = await axios.get(`${API_BASE_URL}/academic-calendar/add-drop-status`, {
      headers: getAuthHeader()
    });
    return response.data.data;
  },

  async getUpcomingEvents(limit = 5): Promise<AcademicEvent[]> {
    const response = await axios.get(
      `${API_BASE_URL}/academic-calendar/upcoming-events?limit=${limit}`,
      { headers: getAuthHeader() }
    );
    return response.data.data;
  },

  async getHolidays(term?: string, year?: number): Promise<AcademicEvent[]> {
    const params = new URLSearchParams();
    if (term) params.append('term', term);
    if (year) params.append('year', year.toString());

    const response = await axios.get(
      `${API_BASE_URL}/academic-calendar/holidays${params.toString() ? `?${params}` : ''}`,
      { headers: getAuthHeader() }
    );
    return response.data.data;
  }
};
