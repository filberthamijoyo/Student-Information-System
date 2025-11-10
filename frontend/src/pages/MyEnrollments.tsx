import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Enrollment {
  id: number;
  status: string;
  enrolledAt: string;
  course: {
    id: number;
    courseCode: string;
    courseName: string;
    credits: number;
    department: string;
    instructor: {
      fullName: string;
    };
    timeSlots: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      location: string;
    }>;
  };
}

export function MyEnrollments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dropMessage, setDropMessage] = useState<{ enrollmentId: number; message: string } | null>(
    null
  );

  const { data: enrollments, isLoading } = useQuery<Enrollment[]>({
    queryKey: ['my-enrollments'],
    queryFn: async () => {
      const response = await api.get('/enrollments/my-courses');
      return response.data.data;
    },
  });

  const dropMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      await api.delete(`/enrollments/${enrollmentId}`);
    },
    onSuccess: (_, enrollmentId) => {
      setDropMessage({
        enrollmentId,
        message: 'Successfully dropped course',
      });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setTimeout(() => setDropMessage(null), 3000);
    },
    onError: (error: any, enrollmentId) => {
      setDropMessage({
        enrollmentId,
        message: error.response?.data?.error || 'Failed to drop course',
      });
      setTimeout(() => setDropMessage(null), 5000);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const confirmedEnrollments = enrollments?.filter((e) => e.status === 'CONFIRMED') || [];
  const waitlistedEnrollments = enrollments?.filter((e) => e.status === 'WAITLISTED') || [];

  const totalCredits = confirmedEnrollments.reduce(
    (sum, enrollment) => sum + enrollment.course.credits,
    0
  );

  const handleDrop = (enrollmentId: number) => {
    if (window.confirm('Are you sure you want to drop this course?')) {
      dropMutation.mutate(enrollmentId);
    }
  };

  // Build schedule view
  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const scheduleByDay: Record<string, Array<{ course: string; time: string; location: string }>> =
    {};

  confirmedEnrollments.forEach((enrollment) => {
    enrollment.course.timeSlots.forEach((slot) => {
      if (!scheduleByDay[slot.dayOfWeek]) {
        scheduleByDay[slot.dayOfWeek] = [];
      }
      scheduleByDay[slot.dayOfWeek].push({
        course: `${enrollment.course.courseCode} - ${enrollment.course.courseName}`,
        time: `${slot.startTime} - ${slot.endTime}`,
        location: slot.location,
      });
    });
  });

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Enrollments</h2>
          <p className="text-gray-600">
            {user?.fullName} • {confirmedEnrollments.length} courses enrolled • {totalCredits}{' '}
            credits
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Enrolled Courses</p>
                <p className="text-3xl font-bold text-green-900">{confirmedEnrollments.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Credits</p>
                <p className="text-3xl font-bold text-blue-900">{totalCredits}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-medium">Waitlisted</p>
                <p className="text-3xl font-bold text-yellow-900">{waitlistedEnrollments.length}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        {confirmedEnrollments.length > 0 && (
          <div className="card mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Weekly Schedule</h3>
            <div className="space-y-4">
              {daysOfWeek.map((day) => {
                const daySchedule = scheduleByDay[day];
                if (!daySchedule || daySchedule.length === 0) return null;

                return (
                  <div key={day} className="border-l-4 border-primary-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{day}</h4>
                    <div className="space-y-2">
                      {daySchedule.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded">
                          <p className="font-medium text-gray-900">{item.course}</p>
                          <p className="text-sm text-gray-600">
                            {item.time} • {item.location}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Enrolled Courses */}
        {confirmedEnrollments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Enrolled Courses</h3>
            <div className="space-y-4">
              {confirmedEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">
                          {enrollment.course.courseCode}
                        </h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Enrolled
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {enrollment.course.credits} Credits
                        </span>
                      </div>
                      <p className="text-gray-700 font-medium mb-2">
                        {enrollment.course.courseName}
                      </p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Instructor:</span>{' '}
                          {enrollment.course.instructor.fullName}
                        </p>
                        <p>
                          <span className="font-medium">Department:</span>{' '}
                          {enrollment.course.department}
                        </p>
                        <p>
                          <span className="font-medium">Enrolled:</span>{' '}
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDrop(enrollment.id)}
                      disabled={dropMutation.isPending}
                      className="btn-secondary text-red-600 hover:bg-red-50 ml-4"
                    >
                      Drop Course
                    </button>
                  </div>

                  {dropMessage?.enrollmentId === enrollment.id && (
                    <div
                      className={`mt-4 px-4 py-2 rounded text-sm ${
                        dropMessage.message.includes('Success')
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {dropMessage.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waitlisted Courses */}
        {waitlistedEnrollments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Waitlisted Courses</h3>
            <div className="space-y-4">
              {waitlistedEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="card bg-yellow-50 border-yellow-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">
                          {enrollment.course.courseCode}
                        </h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Waitlisted
                        </span>
                      </div>
                      <p className="text-gray-700 font-medium mb-2">
                        {enrollment.course.courseName}
                      </p>
                      <p className="text-sm text-yellow-700">
                        You will be automatically enrolled when a seat becomes available.
                      </p>
                    </div>
                    <button
                      onClick={() => handleDrop(enrollment.id)}
                      disabled={dropMutation.isPending}
                      className="btn-secondary text-red-600 hover:bg-red-50 ml-4"
                    >
                      Leave Waitlist
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {enrollments?.length === 0 && (
          <div className="card text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No enrollments yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by browsing available courses and enrolling in classes you're interested in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
