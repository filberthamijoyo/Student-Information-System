import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Menu, X, GraduationCap, ChevronDown, LogOut, User } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '../../lib/utils';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';

interface NavbarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export function Navbar({ onMenuClick, isSidebarOpen }: NavbarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Main navigation items (visible on desktop)
  const mainNavItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/courses', label: 'Courses' },
    { path: '/enrollments', label: 'My Enrollments' },
    { path: '/planning', label: 'Planning' },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left section: Logo and main nav */}
          <div className="flex items-center gap-6">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-foreground">CUHK-SZ SIS</h1>
                <p className="text-xs text-muted-foreground">Student Information System</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.path)
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right section: Theme toggle and user menu */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <HeadlessMenu as="div" className="relative">
              <HeadlessMenu.Button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-foreground">{user?.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {user?.role === 'INSTRUCTOR' ? 'Faculty' : user?.role}
                  </span>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {user?.fullName?.charAt(0) || <User className="h-4 w-4" />}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </HeadlessMenu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <HeadlessMenu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-card border border-border shadow-lg focus:outline-none">
                  <div className="p-1">
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email || user?.userIdentifier}</p>
                    </div>
                    <HeadlessMenu.Item>
                      {({ active }) => (
                        <Link
                          to="/personal"
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                            active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                          )}
                        >
                          <User className="h-4 w-4" />
                          Profile Settings
                        </Link>
                      )}
                    </HeadlessMenu.Item>
                    <HeadlessMenu.Item>
                      {({ active }) => (
                        <button
                          onClick={logout}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                            active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                          )}
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      )}
                    </HeadlessMenu.Item>
                  </div>
                </HeadlessMenu.Items>
              </Transition>
            </HeadlessMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
