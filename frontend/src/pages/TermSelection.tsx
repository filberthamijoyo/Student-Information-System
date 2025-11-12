import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Term {
  id: number;
  name: string;
  code: string;
  type: 'FALL' | 'SPRING' | 'SUMMER';
  status: 'UPCOMING' | 'ENROLLMENT' | 'ACTIVE' | 'COMPLETED';
  academicYear: string;
  enrollmentStart: string;
  enrollmentEnd: string;
  termStart: string;
  termEnd: string;
  _count: {
    courses: number;
    enrollments: number;
  };
}

export function TermSelection() {
  const navigate = useNavigate();
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);

  const { data: terms, isLoading } = useQuery<Term[]>({
    queryKey: ['terms'],
    queryFn: async () => {
      const response = await api.get('/terms');
      return response.data.data;
    },
  });

  const { data: activeTerm } = useQuery<Term>({
    queryKey: ['active-term'],
    queryFn: async () => {
      const response = await api.get('/terms/active');
      return response.data.data;
    },
  });

  const handleTermSelect = (termId: number) => {
    setSelectedTermId(termId);
    // Store selected term in localStorage for use across the app
    localStorage.setItem('selectedTermId', termId.toString());
    // Navigate to course list with the selected term
    navigate(`/courses?termId=${termId}`);
  };

  const getStatusBadge = (status: Term['status']) => {
    const badges = {
      UPCOMING: 'bg-gray-100 text-gray-800',
      ENROLLMENT: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-600',
    };
    return badges[status] || badges.UPCOMING;
  };

  const getTypeBadge = (type: Term['type']) => {
    const badges = {
      FALL: 'bg-orange-100 text-orange-800',
      SPRING: 'bg-green-100 text-green-800',
      SUMMER: 'bg-yellow-100 text-yellow-800',
    };
    return badges[type];
  };

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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Term</h2>
          <p className="text-gray-600">
            Choose the academic term you want to browse and enroll in courses
          </p>
        </div>

        {/* Active Term Highlight */}
        {activeTerm && (
          <div className="mb-6 card border-l-4 border-blue-600 bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  📅 Current Enrollment Period
                </h3>
                <p className="text-blue-700 mt-1">
                  {activeTerm.name} - Enrollment open until{' '}
                  {new Date(activeTerm.enrollmentEnd).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleTermSelect(activeTerm.id)}
                className="btn-primary"
              >
                Start Enrolling
              </button>
            </div>
          </div>
        )}

        {/* All Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {terms?.map((term) => (
            <div
              key={term.id}
              className={`card hover:shadow-lg transition-shadow cursor-pointer ${
                selectedTermId === term.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleTermSelect(term.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {term.name}
                  </h3>
                  <p className="text-sm text-gray-500">{term.code}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeBadge(term.type)}`}>
                  {term.type}
                </span>
              </div>

              <div className="mb-4">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(term.status)}`}>
                  {term.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <span className="font-medium w-32">Enrollment:</span>
                  <span>
                    {new Date(term.enrollmentStart).toLocaleDateString()} -{' '}
                    {new Date(term.enrollmentEnd).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium w-32">Term Period:</span>
                  <span>
                    {new Date(term.termStart).toLocaleDateString()} -{' '}
                    {new Date(term.termEnd).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between text-sm">
                <div>
                  <span className="text-gray-500">Courses:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {term._count.courses}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Enrollments:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {term._count.enrollments}
                  </span>
                </div>
              </div>

              <button
                className="mt-4 w-full btn-secondary text-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTermSelect(term.id);
                }}
              >
                View Courses
              </button>
            </div>
          ))}
        </div>

        {/* No Terms Message */}
        {terms && terms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No academic terms available</p>
          </div>
        )}
      </div>
    </div>
  );
}
