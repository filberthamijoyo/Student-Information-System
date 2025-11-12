import { useQuery } from '@tanstack/react-query';
import { academicAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function Transcript() {
  const { user } = useAuth();

  const { data: transcript, isLoading } = useQuery({
    queryKey: ['transcript'],
    queryFn: () => academicAPI.getTranscript().then(res => res.data.data),
  });

  const handleDownloadPDF = () => {
    // In a real implementation, this would download the PDF
    alert('PDF download functionality would be implemented here. The backend endpoint is ready at /api/academic/transcript/pdf');
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Academic Transcript</h1>
          <p className="mt-2 text-gray-600">Your official academic record</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </button>
      </div>

      {transcript && transcript.length > 0 ? (
        <div className="space-y-6">
          {/* Student Information Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-900 text-center">
                The Chinese University of Hong Kong, Shenzhen
              </h2>
              <h3 className="text-lg text-gray-700 text-center mt-2">Official Academic Transcript</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Student Name</div>
                    <div className="text-base font-semibold text-gray-900">{user?.fullName}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Student ID</div>
                    <div className="text-base font-semibold text-gray-900">{user?.userIdentifier}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Email</div>
                    <div className="text-base text-gray-900">{user?.email}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Major</div>
                    <div className="text-base font-semibold text-gray-900">{user?.major || 'Undeclared'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Year Level</div>
                    <div className="text-base font-semibold text-gray-900">Year {user?.yearLevel || 1}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Date Generated</div>
                    <div className="text-base text-gray-900">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Summary */}
          {transcript[transcript.length - 1] && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <div className="text-sm font-medium opacity-90">Cumulative GPA</div>
                <div className="mt-2 text-4xl font-bold">
                  {transcript[transcript.length - 1].gpa?.toFixed(2) || '0.00'}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="text-sm font-medium text-gray-600">Total Credits</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {transcript[transcript.length - 1].totalCredits || 0}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <div className="text-sm font-medium text-gray-600">Quality Points</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {transcript[transcript.length - 1].qualityPoints?.toFixed(1) || '0.0'}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
                <div className="text-sm font-medium text-gray-600">Academic Standing</div>
                <div className="mt-2 text-xl font-bold text-gray-900">
                  {transcript[transcript.length - 1].academicStanding || 'Good Standing'}
                </div>
              </div>
            </div>
          )}

          {/* Term-by-Term Transcript */}
          {transcript.map((term: any, index: number) => (
            <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {term.semester} {term.year}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Term GPA</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {term.termGPA?.toFixed(2) || '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Title
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credits
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {term.courses && term.courses.map((course: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {course.courseCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {course.courseName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {course.credits}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`font-semibold ${
                            course.letterGrade?.startsWith('A')
                              ? 'text-green-600'
                              : course.letterGrade?.startsWith('B')
                              ? 'text-blue-600'
                              : course.letterGrade?.startsWith('C')
                              ? 'text-yellow-600'
                              : course.letterGrade === 'F'
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}>
                            {course.letterGrade || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {course.gradePoints?.toFixed(2) || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td colSpan={2} className="px-6 py-3 text-sm text-gray-900">
                        Term Totals
                      </td>
                      <td className="px-6 py-3 text-sm text-center text-gray-900">
                        {term.termCredits || 0}
                      </td>
                      <td className="px-6 py-3 text-sm text-center text-gray-900">
                        GPA: {term.termGPA?.toFixed(2) || '—'}
                      </td>
                      <td className="px-6 py-3 text-sm text-center text-gray-900">
                        {term.termQualityPoints?.toFixed(1) || '—'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Cumulative Summary for this term */}
              <div className="bg-blue-50 px-6 py-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Cumulative Credits: </span>
                    <span className="font-semibold text-gray-900">{term.totalCredits || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cumulative GPA: </span>
                    <span className="font-semibold text-gray-900">{term.gpa?.toFixed(2) || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Academic Standing: </span>
                    <span className="font-semibold text-gray-900">{term.academicStanding || 'Good Standing'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grading Scale</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-600">A+, A</span>
                <span className="text-gray-600"> = 4.0</span>
              </div>
              <div>
                <span className="font-medium text-green-600">A-</span>
                <span className="text-gray-600"> = 3.7</span>
              </div>
              <div>
                <span className="font-medium text-blue-600">B+</span>
                <span className="text-gray-600"> = 3.3</span>
              </div>
              <div>
                <span className="font-medium text-blue-600">B</span>
                <span className="text-gray-600"> = 3.0</span>
              </div>
              <div>
                <span className="font-medium text-blue-600">B-</span>
                <span className="text-gray-600"> = 2.7</span>
              </div>
              <div>
                <span className="font-medium text-yellow-600">C+</span>
                <span className="text-gray-600"> = 2.3</span>
              </div>
              <div>
                <span className="font-medium text-yellow-600">C</span>
                <span className="text-gray-600"> = 2.0</span>
              </div>
              <div>
                <span className="font-medium text-yellow-600">C-</span>
                <span className="text-gray-600"> = 1.7</span>
              </div>
              <div>
                <span className="font-medium text-orange-600">D</span>
                <span className="text-gray-600"> = 1.0</span>
              </div>
              <div>
                <span className="font-medium text-red-600">F</span>
                <span className="text-gray-600"> = 0.0</span>
              </div>
            </div>
          </div>

          {/* Official Notice */}
          <div className="bg-gray-50 border-l-4 border-gray-500 p-6 rounded">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Official Transcript Notice</h4>
            <p className="text-sm text-gray-700">
              This is an unofficial transcript for your personal records. For official transcripts, please submit a request through the Registrar's Office. Official transcripts are sealed and sent directly to the requesting institution.
            </p>
            <p className="text-sm text-gray-700 mt-2">
              Generated on: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No transcript available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your transcript will be available once grades are posted.
          </p>
        </div>
      )}
    </div>
  );
}
