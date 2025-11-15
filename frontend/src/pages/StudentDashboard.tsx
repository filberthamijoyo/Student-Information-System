import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { academicAPI, financialAPI, planningAPI, campusAPI } from '../services/api';
import { academicCalendarService } from '../services/academicCalendarService';
import { courseEvaluationService } from '../services/courseEvaluationService';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  BookOpen,
  BarChart3,
  CreditCard,
  UserCircle,
  Target,
  Info,
  Calendar,
  Edit3,
  RotateCcw,
  Star,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  Clock,
  Award,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '../lib/utils';

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

  const { data: addDropStatus } = useQuery({
    queryKey: ['add-drop-status'],
    queryFn: () => academicCalendarService.getAddDropStatus(),
  });

  const quickStats = [
    {
      label: 'Cumulative GPA',
      value: gpaData ? gpaData.cumulativeGPA.toFixed(2) : '—',
      subtitle: gpaData?.academicStanding || 'Loading...',
      icon: TrendingUp,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/5',
      iconBg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10',
      progress: gpaData ? (gpaData.cumulativeGPA / 4.0) * 100 : 0,
    },
    {
      label: 'Credits Earned',
      value: progress ? progress.totalCreditsEarned : '—',
      subtitle: `of ${progress?.totalCreditsRequired || 120} required`,
      icon: BookOpen,
      gradient: 'from-emerald-500 to-green-500',
      bgGradient: 'from-emerald-500/10 to-green-500/5',
      iconBg: 'bg-gradient-to-br from-emerald-500/20 to-green-500/10',
      progress: progress ? (progress.totalCreditsEarned / (progress.totalCreditsRequired || 120)) * 100 : 0,
    },
    {
      label: 'Degree Progress',
      value: progress ? `${progress.percentageComplete.toFixed(0)}%` : '—',
      subtitle: 'Completion',
      icon: Award,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/5',
      iconBg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/10',
      progress: progress?.percentageComplete || 0,
    },
    {
      label: 'Account Balance',
      value: financialAccount ? `¥${Math.abs(financialAccount.balance).toLocaleString()}` : '—',
      subtitle: financialAccount && financialAccount.balance < 0 ? 'Payment Due' : 'Current Balance',
      icon: CreditCard,
      gradient: financialAccount && financialAccount.balance < 0 ? 'from-red-500 to-orange-500' : 'from-amber-500 to-yellow-500',
      bgGradient: financialAccount && financialAccount.balance < 0 ? 'from-red-500/10 to-orange-500/5' : 'from-amber-500/10 to-yellow-500/5',
      iconBg: financialAccount && financialAccount.balance < 0 ? 'bg-gradient-to-br from-red-500/20 to-orange-500/10' : 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10',
      isNegative: financialAccount && financialAccount.balance < 0,
    },
  ];

  const modules = [
    {
      title: 'Course Search',
      description: 'Browse and enroll in available courses',
      icon: BookOpen,
      link: '/courses',
      gradient: 'from-blue-600 to-cyan-600',
      bgPattern: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      title: 'My Enrollments',
      description: 'View and manage your enrolled courses',
      icon: Edit3,
      link: '/enrollments',
      gradient: 'from-emerald-600 to-green-600',
      bgPattern: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: 'Shopping Cart',
      description: 'Review courses before enrolling',
      icon: Target,
      link: '/cart',
      gradient: 'from-purple-600 to-pink-600',
      bgPattern: 'bg-purple-50 dark:bg-purple-950/30',
      badge: '4 courses',
    },
    {
      title: 'My Grades',
      description: 'View your grades and academic performance',
      icon: BarChart3,
      link: '/academic/grades',
      gradient: 'from-indigo-600 to-blue-600',
      bgPattern: 'bg-indigo-50 dark:bg-indigo-950/30',
      stat: gpaData && `${gpaData.cumulativeGPA.toFixed(2)} GPA`,
    },
    {
      title: 'Degree Planning',
      description: 'Track your degree requirements',
      icon: Target,
      link: '/planning',
      gradient: 'from-pink-600 to-rose-600',
      bgPattern: 'bg-pink-50 dark:bg-pink-950/30',
      stat: progress && `${progress.percentageComplete.toFixed(0)}% Complete`,
    },
    {
      title: 'Financial Info',
      description: 'Manage payments and view charges',
      icon: CreditCard,
      link: '/financial',
      gradient: 'from-amber-600 to-orange-600',
      bgPattern: 'bg-amber-50 dark:bg-amber-950/30',
      stat: financialAccount && `¥${financialAccount.balance.toLocaleString()}`,
      alert: financialAccount && financialAccount.balance < 0,
    },
  ];

  return (
    <div className="min-h-screen gradient-mesh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Header */}
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <span className="text-gradient-primary">
                  Welcome back, {user?.fullName?.split(' ')[0] || user?.fullName}!
                </span>
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </h1>
              <p className="text-lg text-muted-foreground">
                Here's your academic overview for Fall 2024
              </p>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-foreground">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="stat-card group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("p-3 rounded-xl", stat.iconBg)}>
                    <Icon className={cn("h-6 w-6 bg-gradient-to-br bg-clip-text text-transparent", stat.gradient)} />
                  </div>
                  {stat.progress !== undefined && (
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-semibold text-muted-foreground">
                        {Math.round(stat.progress)}%
                      </div>
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", stat.gradient)}
                          style={{ width: `${stat.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                  <p className={cn(
                    "text-3xl font-bold mb-1 bg-gradient-to-br bg-clip-text text-transparent",
                    stat.gradient
                  )}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Alerts and Notifications */}
        {(addDropStatus?.isOpen || (pendingEvaluations && pendingEvaluations.length > 0) || (upcomingEvents && upcomingEvents.length > 0)) && (
          <div className="space-y-4">
            {/* Add/Drop Period Alert */}
            {addDropStatus?.isOpen && (
              <Card className="border-success/50 bg-gradient-to-br from-success/5 to-transparent overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-success/10 to-transparent rounded-full blur-3xl" />
                <CardContent className="pt-6 relative">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                        <Zap className="h-6 w-6 text-success" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-foreground text-lg">Add/Drop Period is Open</h3>
                        <Badge variant="success" className="animate-pulse">Active Now</Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">
                        You can add or drop courses until{' '}
                        {addDropStatus.period?.end_date && new Date(addDropStatus.period.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <Link to="/add-drop">
                        <Button size="sm" className="shadow-lg shadow-success/20">
                          Go to Add/Drop <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Evaluations */}
            {pendingEvaluations && pendingEvaluations.length > 0 && (
              <Card className="border-warning/50 bg-gradient-to-br from-warning/5 to-transparent">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                        <Star className="h-6 w-6 text-warning" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-1">Course Evaluations Pending</h3>
                      <p className="text-muted-foreground mb-4">
                        {pendingEvaluations.length} course{pendingEvaluations.length !== 1 ? 's' : ''} waiting for your feedback
                      </p>
                      <Link to="/evaluations">
                        <Button size="sm" variant="outline">
                          Complete Evaluations <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Quick Access Modules */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Quick Access</h2>
            <Link to="/courses" className="text-primary hover:text-primary/80 text-sm font-semibold flex items-center gap-1">
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <Link key={module.title} to={module.link}>
                  <Card
                    hover
                    className="h-full group overflow-hidden"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="pt-6 relative">
                      <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-30", module.bgPattern)} />
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn("p-3 rounded-xl bg-gradient-to-br", module.gradient, "text-white shadow-lg")}>
                            <Icon className="h-6 w-6" />
                          </div>
                          {(module.stat || module.badge) && (
                            <Badge variant={module.alert ? 'warning' : 'secondary'} className="shadow-sm">
                              {module.stat || module.badge}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-foreground mb-2 text-lg">{module.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                        <div className="flex items-center text-sm text-primary font-semibold group-hover:gap-2 transition-all">
                          Access <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Latest Announcement */}
        {announcements && announcements.length > 0 && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <Info className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-foreground">Latest Announcement</h3>
                    <Badge variant="info" className="text-xs">New</Badge>
                  </div>
                  <p className="font-semibold text-foreground mb-2">{announcements[0].title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {announcements[0].content}
                  </p>
                  <Link to="/campus">
                    <Button size="sm" variant="ghost">
                      View All Announcements <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
