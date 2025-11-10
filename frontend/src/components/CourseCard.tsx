import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CourseCardProps {
  course: {
    id: number;
    courseCode: string;
    courseName: string;
    credits: number;
    department: string;
    maxCapacity: number;
    currentEnrollment: number;
    description: string | null;
    prerequisites: string | null;
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

export function CourseCard({ course }: CourseCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const seatsAvailable = course.maxCapacity - course.currentEnrollment;
  const isFull = seatsAvailable <= 0;
  const fillPercentage = (course.currentEnrollment / course.maxCapacity) * 100;

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/enrollments', {
        courseId: course.id,
      });
      return response.data;
    },
    onSuccess: (data) => {
      const jobId = data.data.jobId;
      setEnrollmentStatus('Processing enrollment...');
      setIsPolling(true);
      pollEnrollmentStatus(jobId);
    },
    onError: (error: any) => {
      setEnrollmentStatus(
        error.response?.data?.error || 'Failed to enroll in course'
      );
      setTimeout(() => setEnrollmentStatus(null), 5000);
    },
  });

  const pollEnrollmentStatus = async (jobId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await api.get(`/enrollments/status/${jobId}`);
        const status = response.data.data.status;

        if (status === 'completed') {
          setEnrollmentStatus('Successfully enrolled!');
          setIsPolling(false);
          queryClient.invalidateQueries({ queryKey: ['courses'] });
          queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
          setTimeout(() => setEnrollmentStatus(null), 3000);
        } else if (status === 'failed') {
          setEnrollmentStatus(
            response.data.data.error || 'Enrollment failed'
          );
          setIsPolling(false);
          setTimeout(() => setEnrollmentStatus(null), 5000);
        } else if (status === 'waiting' || status === 'active') {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 1000);
          } else {
            setEnrollmentStatus('Enrollment is taking longer than expected...');
            setIsPolling(false);
            setTimeout(() => setEnrollmentStatus(null), 5000);
          }
        }
      } catch (error) {
        setEnrollmentStatus('Error checking enrollment status');
        setIsPolling(false);
        setTimeout(() => setEnrollmentStatus(null), 5000);
      }
    };

    poll();
  };

  const handleEnroll = () => {
    if (user?.role !== 'STUDENT') {
      setEnrollmentStatus('Only students can enroll in courses');
      setTimeout(() => setEnrollmentStatus(null), 3000);
      return;
    }
    enrollMutation.mutate();
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {course.courseCode}
          </h3>
          <p className="text-gray-700 font-medium">{course.courseName}</p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          {course.credits} Credits
        </span>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center text-gray-600">
          <span className="font-medium w-24">Instructor:</span>
          <span>{course.instructor.fullName}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <span className="font-medium w-24">Department:</span>
          <span>{course.department}</span>
        </div>
        {course.prerequisites && (
          <div className="flex items-start text-gray-600">
            <span className="font-medium w-24 flex-shrink-0">Prerequisites:</span>
            <span className="flex-1">{course.prerequisites}</span>
          </div>
        )}
      </div>

      {/* Time Slots */}
      {course.timeSlots.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Schedule:</p>
          <div className="space-y-1">
            {course.timeSlots.map((slot, index) => (
              <div
                key={index}
                className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded"
              >
                <span className="font-medium">{slot.dayOfWeek}</span> {slot.startTime} -{' '}
                {slot.endTime} • {slot.location}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {course.description && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-3">
            {course.description}
          </p>
        </div>
      )}

      {/* Capacity Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Enrollment</span>
          <span className={`font-medium ${isFull ? 'text-red-600' : 'text-gray-900'}`}>
            {course.currentEnrollment} / {course.maxCapacity}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              fillPercentage >= 100
                ? 'bg-red-500'
                : fillPercentage >= 80
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(fillPercentage, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {isFull ? 'Course is full - will be added to waitlist' : `${seatsAvailable} seats available`}
        </p>
      </div>

      {/* Enrollment Status Message */}
      {enrollmentStatus && (
        <div
          className={`mb-4 px-4 py-2 rounded text-sm ${
            enrollmentStatus.includes('Success')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : enrollmentStatus.includes('Processing')
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {enrollmentStatus}
        </div>
      )}

      {/* Enroll Button */}
      {user?.role === 'STUDENT' && (
        <button
          onClick={handleEnroll}
          disabled={enrollMutation.isPending || isPolling}
          className={`btn-primary w-full ${
            enrollMutation.isPending || isPolling
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
        >
          {enrollMutation.isPending || isPolling ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Enroll in Course'
          )}
        </button>
      )}
    </div>
  );
}
