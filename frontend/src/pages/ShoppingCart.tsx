import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface CartItem {
  id: number;
  addedAt: string;
  notes: string | null;
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
      id: number;
      fullName: string;
    } | null;
    timeSlots: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      location: string | null;
    }>;
  };
  term: {
    id: number;
    name: string;
    code: string;
  };
}

interface CartSummary {
  courseCount: number;
  totalCredits: number;
}

export function ShoppingCart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [enrollingAll, setEnrollingAll] = useState(false);
  const selectedTermId = localStorage.getItem('selectedTermId');

  const { data: cartItems, isLoading } = useQuery<CartItem[]>({
    queryKey: ['cart', selectedTermId],
    queryFn: async () => {
      const params = selectedTermId ? `?termId=${selectedTermId}` : '';
      const response = await api.get(`/cart${params}`);
      return response.data.data;
    },
  });

  const { data: summary } = useQuery<CartSummary>({
    queryKey: ['cart-summary', selectedTermId],
    queryFn: async () => {
      const params = selectedTermId ? `?termId=${selectedTermId}` : '';
      const response = await api.get(`/cart/summary${params}`);
      return response.data.data;
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      await api.delete(`/cart/${cartItemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-summary'] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const params = selectedTermId ? `?termId=${selectedTermId}` : '';
      await api.delete(`/cart${params}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-summary'] });
    },
  });

  const handleRemoveFromCart = async (cartItemId: number) => {
    if (confirm('Remove this course from your shopping cart?')) {
      await removeFromCartMutation.mutateAsync(cartItemId);
    }
  };

  const handleClearCart = async () => {
    if (confirm('Remove all courses from your shopping cart?')) {
      await clearCartMutation.mutateAsync();
    }
  };

  const handleEnrollAll = async () => {
    if (!cartItems || cartItems.length === 0) {
      alert('Your shopping cart is empty');
      return;
    }

    if (confirm(`Enroll in all ${cartItems.length} courses in your cart?`)) {
      setEnrollingAll(true);
      try {
        // Enroll in each course one by one
        for (const item of cartItems) {
          await api.post('/enrollments', {
            courseId: item.course.id,
          });
        }

        // Clear cart after successful enrollment
        await clearCartMutation.mutateAsync();

        alert('Successfully enrolled in all courses!');
        navigate('/my-enrollments');
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to enroll in some courses');
      } finally {
        setEnrollingAll(false);
      }
    }
  };

  const formatTimeSlot = (slot: any) => {
    return `${slot.dayOfWeek.substring(0, 3)} ${slot.startTime}-${slot.endTime}`;
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h2>
            <p className="text-gray-600">
              Review and enroll in your selected courses
            </p>
          </div>

          {cartItems && cartItems.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={handleClearCart}
                disabled={clearCartMutation.isPending}
                className="btn-secondary"
              >
                Clear Cart
              </button>
              <button
                onClick={handleEnrollAll}
                disabled={enrollingAll}
                className="btn-primary"
              >
                {enrollingAll ? 'Enrolling...' : `Enroll in All (${summary?.courseCount || 0})`}
              </button>
            </div>
          )}
        </div>

        {/* Cart Summary */}
        {summary && summary.courseCount > 0 && (
          <div className="card mb-6 bg-blue-50 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Cart Summary</h3>
                <p className="text-blue-700 mt-1">
                  {summary.courseCount} course{summary.courseCount !== 1 ? 's' : ''} • {summary.totalCredits} total credits
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cart Items */}
        {cartItems && cartItems.length > 0 ? (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {item.course.courseCode} - {item.course.courseName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.course.department} • {item.course.credits} credits
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        disabled={removeFromCartMutation.isPending}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    {item.course.instructor && (
                      <p className="text-sm text-gray-600 mb-2">
                        👤 Instructor: {item.course.instructor.fullName}
                      </p>
                    )}

                    {/* Time Slots */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.course.timeSlots.map((slot, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          📅 {formatTimeSlot(slot)}
                          {slot.location && ` @ ${slot.location}`}
                        </span>
                      ))}
                    </div>

                    {/* Prerequisites */}
                    {item.course.prerequisites && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-700">Prerequisites: </span>
                        <span className="text-sm text-gray-600">{item.course.prerequisites}</span>
                      </div>
                    )}

                    {/* Enrollment Status */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        Seats: {item.course.currentEnrollment}/{item.course.maxCapacity}
                      </span>
                      {item.course.currentEnrollment >= item.course.maxCapacity && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                          Full - Will be added to waitlist
                        </span>
                      )}
                    </div>

                    {/* Notes */}
                    {item.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Notes: </span>
                          {item.notes}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-3">
                      Added on {new Date(item.addedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 card">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">
              Browse courses and add them to your cart to get started
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="btn-primary"
            >
              Browse Courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
