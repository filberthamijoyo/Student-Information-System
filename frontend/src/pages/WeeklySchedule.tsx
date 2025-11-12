import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

interface ScheduleItem {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  location: string | null;
  course: {
    id: number;
    courseCode: string;
    courseName: string;
    credits: number;
    instructor: {
      id: number;
      fullName: string;
    } | null;
  };
  enrollmentStatus?: string;
}

interface WeeklyGrid {
  MONDAY: ScheduleItem[];
  TUESDAY: ScheduleItem[];
  WEDNESDAY: ScheduleItem[];
  THURSDAY: ScheduleItem[];
  FRIDAY: ScheduleItem[];
  SATURDAY: ScheduleItem[];
  SUNDAY: ScheduleItem[];
}

interface CreditSummary {
  totalCredits: number;
  courseCount: number;
}

export function WeeklySchedule() {
  const selectedTermId = localStorage.getItem('selectedTermId');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: scheduleGrid, isLoading: gridLoading } = useQuery<WeeklyGrid>({
    queryKey: ['schedule-grid', selectedTermId],
    queryFn: async () => {
      const params = selectedTermId ? `?termId=${selectedTermId}` : '';
      const response = await api.get(`/schedule/grid${params}`);
      return response.data.data;
    },
    enabled: viewMode === 'grid',
  });

  const { data: scheduleList, isLoading: listLoading } = useQuery<ScheduleItem[]>({
    queryKey: ['schedule-weekly', selectedTermId],
    queryFn: async () => {
      const params = selectedTermId ? `?termId=${selectedTermId}` : '';
      const response = await api.get(`/schedule/weekly${params}`);
      return response.data.data;
    },
    enabled: viewMode === 'list',
  });

  const { data: creditSummary } = useQuery<CreditSummary>({
    queryKey: ['schedule-credits', selectedTermId],
    queryFn: async () => {
      const params = selectedTermId ? `?termId=${selectedTermId}` : '';
      const response = await api.get(`/schedule/credits${params}`);
      return response.data.data;
    },
  });

  const days: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const displayDays: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const getItemsForDayAndTime = (day: DayOfWeek, time: string): ScheduleItem[] => {
    if (!scheduleGrid) return [];

    const items = scheduleGrid[day] || [];
    return items.filter(item => {
      const itemStartHour = parseInt(item.startTime.split(':')[0]);
      const slotHour = parseInt(time.split(':')[0]);
      const itemEndHour = parseInt(item.endTime.split(':')[0]);
      return itemStartHour <= slotHour && itemEndHour > slotHour;
    });
  };

  const getStatusColor = (status?: string) => {
    if (status === 'CONFIRMED') return 'bg-blue-100 border-blue-400 text-blue-900';
    if (status === 'WAITLISTED') return 'bg-yellow-100 border-yellow-400 text-yellow-900';
    return 'bg-gray-100 border-gray-400 text-gray-900';
  };

  const isLoading = viewMode === 'grid' ? gridLoading : listLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Weekly Schedule</h2>
            <p className="text-gray-600">Your enrolled courses schedule</p>
          </div>

          <div className="flex gap-3 items-center">
            {creditSummary && (
              <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">{creditSummary.courseCount}</span> courses •
                  <span className="font-semibold ml-1">{creditSummary.totalCredits}</span> credits
                </p>
              </div>
            )}

            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Grid View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List View
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'grid' ? (
          /* Grid View */
          <div className="card overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-6 border-b border-gray-200">
                <div className="p-2 bg-gray-50 font-semibold text-sm text-gray-700 border-r border-gray-200">
                  Time
                </div>
                {displayDays.map(day => (
                  <div key={day} className="p-2 bg-gray-50 font-semibold text-sm text-gray-700 text-center border-r border-gray-200 last:border-r-0">
                    {day.substring(0, 3)}
                  </div>
                ))}
              </div>

              {timeSlots.map(time => (
                <div key={time} className="grid grid-cols-6 border-b border-gray-200 last:border-b-0">
                  <div className="p-2 bg-gray-50 text-sm text-gray-600 border-r border-gray-200">
                    {time}
                  </div>
                  {displayDays.map(day => {
                    const items = getItemsForDayAndTime(day, time);
                    return (
                      <div key={day} className="p-1 border-r border-gray-200 last:border-r-0 min-h-[60px]">
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded border-l-2 mb-1 ${getStatusColor(item.enrollmentStatus)}`}
                          >
                            <p className="text-xs font-semibold truncate">{item.course.courseCode}</p>
                            <p className="text-xs truncate">{item.course.courseName}</p>
                            {item.location && (
                              <p className="text-xs truncate mt-1">📍 {item.location}</p>
                            )}
                            <p className="text-xs mt-1">{item.startTime} - {item.endTime}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {displayDays.map(day => {
              const dayItems = scheduleList?.filter(item => item.dayOfWeek === day) || [];

              if (dayItems.length === 0) return null;

              return (
                <div key={day} className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                    {day}
                  </h3>
                  <div className="space-y-3">
                    {dayItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-l-4 ${getStatusColor(item.enrollmentStatus)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {item.course.courseCode} - {item.course.courseName}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {item.course.credits} credits
                            </p>
                            {item.course.instructor && (
                              <p className="text-sm text-gray-600">
                                👤 {item.course.instructor.fullName}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-medium text-gray-900">
                              {item.startTime} - {item.endTime}
                            </p>
                            {item.location && (
                              <p className="text-gray-600">📍 {item.location}</p>
                            )}
                            {item.enrollmentStatus === 'WAITLISTED' && (
                              <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                Waitlisted
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {scheduleList && scheduleList.length === 0 && (
              <div className="text-center py-12 card">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes scheduled</h3>
                <p className="text-gray-600">
                  Enroll in courses to see your weekly schedule
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
