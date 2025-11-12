import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  CUHK Course Selection
                </h1>
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/')
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </Link>
                {user?.role === 'STUDENT' && (
                  <>
                    <Link
                      to="/terms"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/terms')
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Select Term
                    </Link>
                    <Link
                      to="/courses"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/courses')
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Courses
                    </Link>
                    <Link
                      to="/cart"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/cart')
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      🛒 Cart
                    </Link>
                    <Link
                      to="/enrollments"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/enrollments')
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      My Enrollments
                    </Link>
                    <Link
                      to="/schedule"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/schedule')
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Schedule
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                <strong>{user?.fullName}</strong>
                <span className="text-gray-500 ml-2">({user?.role})</span>
              </span>
              <button onClick={logout} className="btn-secondary text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
