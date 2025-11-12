import { useQuery } from '@tanstack/react-query';
import { planningAPI } from '../services/api';

export function DegreePlanning() {
  const { data: degreeAudit, isLoading: auditLoading } = useQuery({
    queryKey: ['degree-audit'],
    queryFn: () => planningAPI.getDegreeAudit().then(res => res.data.data),
  });

  const { data: requirements, isLoading: reqLoading } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => planningAPI.getRequirements().then(res => res.data.data),
  });

  const { data: progress } = useQuery({
    queryKey: ['progress'],
    queryFn: () => planningAPI.getProgress().then(res => res.data.data),
  });

  const { data: advisor } = useQuery({
    queryKey: ['advisor'],
    queryFn: () => planningAPI.getAdvisor().then(res => res.data.data),
  });

  const isLoading = auditLoading || reqLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'NOT_STARTED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'CORE': '📚',
      'MAJOR': '🎓',
      'ELECTIVE': '📖',
      'GENERAL_ED': '🌐',
      'OTHER': '📝',
    };
    return icons[category] || '📝';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Degree Planning & Advising</h1>
        <p className="mt-2 text-gray-600">Track your progress towards degree completion</p>
      </div>

      {/* Overall Progress */}
      {progress && (
        <div className="mb-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Degree Progress</h2>
              <p className="text-blue-100 mt-1">{progress.majorName}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{progress.percentageComplete.toFixed(0)}%</div>
              <div className="text-blue-100 text-sm">Complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative pt-1">
            <div className="overflow-hidden h-4 text-xs flex rounded-full bg-blue-300">
              <div
                style={{ width: `${progress.percentageComplete}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white transition-all duration-500"
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div>
              <div className="text-blue-100 text-sm">Credits Earned</div>
              <div className="text-2xl font-bold">{progress.totalCreditsEarned}</div>
            </div>
            <div>
              <div className="text-blue-100 text-sm">Credits Required</div>
              <div className="text-2xl font-bold">{progress.totalCreditsRequired}</div>
            </div>
            <div>
              <div className="text-blue-100 text-sm">Remaining</div>
              <div className="text-2xl font-bold">{progress.creditsRemaining}</div>
            </div>
            <div>
              <div className="text-blue-100 text-sm">GPA</div>
              <div className="text-2xl font-bold">{progress.currentGPA?.toFixed(2) || '—'}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Degree Audit */}
        <div className="lg:col-span-2 space-y-6">
          {/* Requirements by Category */}
          {requirements && requirements.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Degree Requirements</h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {requirements.map((req: any) => {
                    const completedCount = req.completedCourses?.length || 0;
                    const totalCount = req.requiredCourses?.length || 0;
                    const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                    return (
                      <div key={req.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{getCategoryIcon(req.category)}</span>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">{req.name}</h4>
                              {req.description && (
                                <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(req.status)}`}>
                            {req.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Progress for this requirement */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">
                              {completedCount} of {totalCount} courses completed
                            </span>
                            <span className="font-medium text-gray-900">
                              {req.creditsEarned || 0} / {req.creditsRequired} credits
                            </span>
                          </div>
                          <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
                            <div
                              style={{ width: `${progressPercent}%` }}
                              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                                req.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'
                              } transition-all duration-500`}
                            ></div>
                          </div>
                        </div>

                        {/* Course list */}
                        {req.requiredCourses && req.requiredCourses.length > 0 && (
                          <div className="mt-3">
                            <details className="text-sm">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                                View required courses
                              </summary>
                              <div className="mt-3 space-y-2">
                                {req.requiredCourses.map((course: string, idx: number) => {
                                  const isCompleted = req.completedCourses?.includes(course);
                                  return (
                                    <div
                                      key={idx}
                                      className={`flex items-center px-3 py-2 rounded ${
                                        isCompleted ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-700'
                                      }`}
                                    >
                                      {isCompleted ? (
                                        <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <svg className="h-5 w-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                      <span className="font-mono font-medium">{course}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Degree Audit Summary */}
          {degreeAudit && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Degree Audit</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Major</div>
                      <div className="text-lg font-semibold text-gray-900">{degreeAudit.majorName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Degree Type</div>
                      <div className="text-lg font-semibold text-gray-900">{degreeAudit.degreeType}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Academic Standing</div>
                      <div className="text-xl font-bold text-gray-900">{degreeAudit.academicStanding || 'Good Standing'}</div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Expected Graduation</div>
                      <div className="text-xl font-bold text-gray-900">
                        {degreeAudit.expectedGraduation || 'TBD'}
                      </div>
                    </div>
                  </div>

                  {degreeAudit.missingRequirements && degreeAudit.missingRequirements.length > 0 && (
                    <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">Outstanding Requirements</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <ul className="list-disc list-inside space-y-1">
                              {degreeAudit.missingRequirements.map((req: string, idx: number) => (
                                <li key={idx}>{req}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Advisor Info */}
        <div className="lg:col-span-1">
          {advisor && (
            <div className="bg-white rounded-lg shadow sticky top-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Academic Advisor</h3>
              </div>
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-600 text-3xl font-bold mb-3">
                    {advisor.fullName ? advisor.fullName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">{advisor.fullName}</h4>
                  <p className="text-sm text-gray-600">{advisor.title || 'Academic Advisor'}</p>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Email</div>
                      <a href={`mailto:${advisor.email}`} className="text-sm text-blue-600 hover:text-blue-700">
                        {advisor.email}
                      </a>
                    </div>
                  </div>

                  {advisor.phone && (
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <div className="text-sm font-medium text-gray-700">Phone</div>
                        <a href={`tel:${advisor.phone}`} className="text-sm text-blue-600 hover:text-blue-700">
                          {advisor.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {advisor.office && (
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <div className="text-sm font-medium text-gray-700">Office</div>
                        <div className="text-sm text-gray-600">{advisor.office}</div>
                      </div>
                    </div>
                  )}

                  {advisor.officeHours && (
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="text-sm font-medium text-gray-700">Office Hours</div>
                        <div className="text-sm text-gray-600">{advisor.officeHours}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <a
                    href={`mailto:${advisor.email}?subject=Advising Appointment Request`}
                    className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Schedule Appointment
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="mt-6 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Links</h3>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <a
                  href="/courses"
                  className="flex items-center p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Course Search
                </a>
                <a
                  href="/academic/grades"
                  className="flex items-center p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Transcript
                </a>
                <a
                  href="/applications"
                  className="flex items-center p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Submit Petition
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
