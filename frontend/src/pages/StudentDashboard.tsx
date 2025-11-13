import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { academicAPI, financialAPI, planningAPI, campusAPI } from '../services/api';
import { academicCalendarService } from '../services/academicCalendarService';
import { courseEvaluationService } from '../services/courseEvaluationService';
import { addDropService } from '../services/addDropService';
import { Link } from 'react-router-dom';

export function StudentDashboard() {
  const { user } = useAuth();
  const { data: gpaData } = useQuery({
    queryKey: ['gpa'],
    queryFn: () => academicAPI.getGPA().then(res => res.data.data),
  });

  const { data: financialAccount } = useQuery({
    queryKey: ['financial-account'],
    queryFn: () => financialAPI.getAccount().then(res => res.data.data),
  });

  const { data: progress } = useQuery({
    queryKey: ['degree-progress'],
    queryFn: () => planningAPI.getProgress().then(res => res.data.data),
  });

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => campusAPI.getAnnouncements().then(res => res.data.data),
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: () => academicCalendarService.getUpcomingEvents(),
    enabled: !!user,
  });

  const { data: pendingEvaluations } = useQuery({
    queryKey: ['pending-evaluations', user?.id],
    queryFn: () => courseEvaluationService.getPendingEvaluations(user!.id),
    enabled: !!user,
  });

  const { data: myAddDropRequests } = useQuery({
    queryKey: ['my-add-drop-requests', user?.id],
    queryFn: () => addDropService.getMyRequests(user!.id),
    enabled: !!user,
  });

  const { data: addDropStatus } = useQuery({
    queryKey: ['add-drop-status'],
    queryFn: () => academicCalendarService.getAddDropStatus(),
  });

  const modules = [
    {
      title: 'Enrollment',
      description: 'Browse courses, manage enrollments, view schedule',
      icon: '📚',
      link: '/courses',
      color: 'bg-blue-50 border-blue-200',
      items: ['Course Search', 'My Enrollments', 'Weekly Schedule'],
    },
    {
      title: 'Academic Records',
      description: 'View grades, transcripts, and GPA',
      icon: '📊',
      link: '/academic/grades',
      color: 'bg-green-50 border-green-200',
      items: ['My Grades', 'Transcript', 'GPA History'],
      stat: gpaData && `GPA: ${gpaData.cumulativeGPA.toFixed(2)}`,
    },
    {
      title: 'Financial Information',
      description: 'Account balance, payments, and billing',
      icon: '💳',
      link: '/financial',
      color: 'bg-yellow-50 border-yellow-200',
      items: ['Account Summary', 'Make Payment', 'View Charges'],
      stat: financialAccount && `Balance: ¥${financialAccount.balance.toLocaleString()}`,
      alert: financialAccount && financialAccount.balance < 0,
    },
    {
      title: 'Personal Information',
      description: 'Update contact info and emergency contacts',
      icon: '👤',
      link: '/personal',
      color: 'bg-purple-50 border-purple-200',
      items: ['Contact Info', 'Emergency Contact', 'Address'],
    },
    {
      title: 'Degree Planning',
      description: 'Track degree progress and view requirements',
      icon: '🎓',
      link: '/planning',
      color: 'bg-indigo-50 border-indigo-200',
      items: ['Degree Audit', 'Requirements', 'Advisor Info'],
      stat: progress && `${progress.percentageComplete.toFixed(0)}% Complete`,
    },
    {
      title: 'Applications',
      description: 'Submit and track academic petitions',
      icon: '✉️',
      link: '/applications',
      color: 'bg-pink-50 border-pink-200',
      items: ['New Application', 'Track Status'],
    },
    {
      title: 'Campus Information',
      description: 'Announcements, events, and resources',
      icon: '📢',
      link: '/campus',
      color: 'bg-orange-50 border-orange-200',
      items: ['Announcements', 'Events Calendar', 'Campus Resources'],
    },
    {
      title: 'Academic Calendar',
      description: 'View important dates and academic events',
      icon: '📅',
      link: '/academic-calendar',
      color: 'bg-teal-50 border-teal-200',
      items: ['Calendar View', 'Upcoming Events', 'Add/Drop Periods'],
      stat: upcomingEvents && upcomingEvents.length > 0 && `${upcomingEvents.length} upcoming events`,
    },
    {
      title: 'Add/Drop Courses',
      description: 'Request to add or drop courses',
      icon: '📝',
      link: '/add-drop',
      color: 'bg-cyan-50 border-cyan-200',
      items: ['Add Course', 'Drop Course', 'My Requests'],
      stat: addDropStatus?.isOpen ? 'Add/Drop is OPEN' : 'Add/Drop is CLOSED',
      alert: addDropStatus?.isOpen,
    },
    {
      title: 'Major Change',
      description: 'Request to change your major or school',
      icon: '🎯',
      link: '/major-change',
      color: 'bg-lime-50 border-lime-200',
      items: ['Submit Request', 'Request History'],
    },
    {
      title: 'Course Evaluations',
      description: 'Evaluate courses and view feedback',
      icon: '⭐',
      link: '/evaluations',
      color: 'bg-amber-50 border-amber-200',
      items: ['Pending Evaluations', 'My Evaluations', 'Course Stats'],
      stat: pendingEvaluations && pendingEvaluations.length > 0 && `${pendingEvaluations.length} pending`,
      alert: pendingEvaluations && pendingEvaluations.length > 0,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.fullName}
        </h1>
        <p className="mt-2 text-gray-600">
          Student Self-Service Portal
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600">Cumulative GPA</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {gpaData ? gpaData.cumulativeGPA.toFixed(2) : '—'}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {gpaData?.academicStanding || 'Loading...'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600">Credits Earned</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {progress ? progress.totalCreditsEarned : '—'}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            of {progress?.totalCreditsRequired || 120} required
          </div>
        </div>

        <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${
          financialAccount && financialAccount.balance < 0 ? 'border-red-500' : 'border-gray-300'
        }`}>
          <div className="text-sm font-medium text-gray-600">Account Balance</div>
          <div className={`mt-2 text-3xl font-bold ${
            financialAccount && financialAccount.balance < 0 ? 'text-red-600' : 'text-gray-900'
          }`}>
            ¥{financialAccount ? financialAccount.balance.toLocaleString() : '—'}
          </div>
          {financialAccount && financialAccount.balance < 0 && (
            <div className="mt-1 text-sm text-red-500">Payment Due</div>
          )}
        </div>
      </div>

      {/* Notifications and Alerts */}
      <div className="space-y-4 mb-8">
        {/* Add/Drop Period Alert */}
        {addDropStatus?.isOpen && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-green-800">
                  Add/Drop Period is Open
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    You can add or drop courses until{' '}
                    {addDropStatus.period && new Date(addDropStatus.period.end_date!).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-2">
                  <Link
                    to="/add-drop"
                    className="text-sm font-medium text-green-600 hover:text-green-500"
                  >
                    Go to Add/Drop →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Evaluations Alert */}
        {pendingEvaluations && pendingEvaluations.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-amber-800">
                  Pending Course Evaluations
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    You have {pendingEvaluations.length} course{pendingEvaluations.length !== 1 ? 's' : ''} waiting for evaluation.
                    Your feedback helps improve education quality.
                  </p>
                </div>
                <div className="mt-2">
                  <Link
                    to="/evaluations"
                    className="text-sm font-medium text-amber-600 hover:text-amber-500"
                  >
                    Complete evaluations →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents && upcomingEvents.length > 0 && (
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">📅</span>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-purple-800">
                  Upcoming Academic Events
                </h3>
                <div className="mt-2 text-sm text-purple-700">
                  <p className="font-semibold">{upcomingEvents[0].name}</p>
                  <p className="mt-1">
                    {new Date(upcomingEvents[0].start_date).toLocaleDateString()} - {upcomingEvents[0].event_type}
                  </p>
                  {upcomingEvents.length > 1 && (
                    <p className="mt-1">+ {upcomingEvents.length - 1} more upcoming events</p>
                  )}
                </div>
                <div className="mt-2">
                  <Link
                    to="/academic-calendar"
                    className="text-sm font-medium text-purple-600 hover:text-purple-500"
                  >
                    View calendar →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Announcements */}
        {announcements && announcements.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">📢</span>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Latest Announcement
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p className="font-semibold">{announcements[0].title}</p>
                  <p className="mt-1">{announcements[0].content.substring(0, 150)}...</p>
                </div>
                <div className="mt-2">
                  <Link
                    to="/campus"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    View all announcements →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Link
            key={module.title}
            to={module.link}
            className={`block ${module.color} border-2 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{module.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {module.title}
                    </h3>
                    {module.stat && (
                      <div className={`text-sm font-medium ${
                        module.alert ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        {module.stat}
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  {module.description}
                </p>
                <ul className="mt-4 space-y-1">
                  {module.items.map((item) => (
                    <li key={item} className="text-sm text-gray-600 flex items-center">
                      <span className="mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
