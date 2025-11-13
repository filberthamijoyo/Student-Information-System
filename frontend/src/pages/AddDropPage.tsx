import React from 'react';
import { useAuth } from '../context/AuthContext';
import AddDropCourse from '../components/AddDropCourse';

const AddDropPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
            Please log in to access add/drop course requests.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add/Drop Courses</h1>
          <p className="mt-2 text-gray-600">
            Submit requests to add or drop courses for the current term
          </p>
        </div>

        {/* Add/Drop Component */}
        <AddDropCourse currentUser={user} />
      </div>
    </div>
  );
};

export default AddDropPage;
