import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { academicAPI } from '../services/api';

export function MyGrades() {
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  const { data: gradesData, isLoading } = useQuery({
    queryKey: ['grades'],
    queryFn: () => academicAPI.getGrades().then(res => res.data.data),
  });

  const { data: gpaData } = useQuery({
    queryKey: ['gpa'],
    queryFn: () => academicAPI.getGPA().then(res => res.data.data),
  });

  // Group grades by term
  const gradesByTerm = gradesData?.reduce((acc: any, grade: any) => {
    const termKey = `${grade.semester} ${grade.year}`;
    if (!acc[termKey]) {
      acc[termKey] = [];
    }
    acc[termKey].push(grade);
    return acc;
  }, {}) || {};

  const getGradeColor = (letterGrade: string) => {
    if (letterGrade.startsWith('A')) return 'text-green-600 font-semibold';
    if (letterGrade.startsWith('B')) return 'text-blue-600 font-semibold';
    if (letterGrade.startsWith('C')) return 'text-yellow-600 font-semibold';
    if (letterGrade.startsWith('D')) return 'text-orange-600 font-semibold';
    if (letterGrade === 'F') return 'text-red-600 font-bold';
    return 'text-gray-600';
  };

  const calculateTermGPA = (grades: any[]) => {
    if (!grades.length) return 0;
    const totalPoints = grades.reduce((sum, g) => sum + (g.gradePoints || 0), 0);
    return (totalPoints / grades.length).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Grades</h1>
        <p className="mt-2 text-gray-600">View your grades and academic performance</p>
      </div>

      {/* GPA Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90">Cumulative GPA</div>
          <div className="mt-2 text-4xl font-bold">
            {gpaData?.cumulativeGPA.toFixed(2) || '—'}
          </div>
          <div className="mt-1 text-sm opacity-90">{gpaData?.academicStanding}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600">Current Term GPA</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {gpaData?.currentTermGPA.toFixed(2) || '—'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="text-sm font-medium text-gray-600">Total Credits</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {gpaData?.totalCredits || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
          <div className="text-sm font-medium text-gray-600">Quality Points</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {gpaData?.qualityPoints?.toFixed(1) || 0}
          </div>
        </div>
      </div>

      {/* Grades by Term */}
      <div className="space-y-8">
        {Object.entries(gradesByTerm).reverse().map(([term, grades]: [string, any]) => {
          const termGrades = grades as any[];
          const termGPA = calculateTermGPA(termGrades.filter(g => g.status === 'PUBLISHED'));

          return (
            <div key={term} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{term}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {termGrades.length} courses
                  </p>
                </div>
                {termGPA > 0 && (
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-600">Term GPA</div>
                    <div className="text-2xl font-bold text-gray-900">{termGPA}</div>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Name
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credits
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Numeric Grade
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Letter Grade
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade Points
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {termGrades.map((grade: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {grade.courseCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {grade.courseName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {grade.credits}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {grade.numericGrade ? grade.numericGrade.toFixed(1) : '—'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${getGradeColor(grade.letterGrade)}`}>
                          {grade.letterGrade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {grade.gradePoints ? grade.gradePoints.toFixed(2) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            grade.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {grade.status === 'PUBLISHED' ? 'Final' : 'In Progress'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {Object.keys(gradesByTerm).length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No grades yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Grades will appear here once they are published by your instructors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
