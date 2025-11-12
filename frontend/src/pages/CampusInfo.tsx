import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { campusAPI } from '../services/api';

type ViewType = 'announcements' | 'events';

export function CampusInfo() {
  const [activeView, setActiveView] = useState<ViewType>('announcements');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: announcements, isLoading: announcementsLoading } = useQuery({
    queryKey: ['campus-announcements'],
    queryFn: () => campusAPI.getAnnouncements().then(res => res.data.data),
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['campus-events', selectedCategory],
    queryFn: () => campusAPI.getEvents(selectedCategory ? { category: selectedCategory } : undefined).then(res => res.data.data),
  });

  const registerMutation = useMutation({
    mutationFn: (eventId: number) => campusAPI.registerForEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campus-events'] });
      alert('Successfully registered for event!');
    },
    onError: () => {
      alert('Failed to register for event. You may already be registered.');
    },
  });

  const handleRegister = (eventId: number) => {
    if (window.confirm('Would you like to register for this event?')) {
      registerMutation.mutate(eventId);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'ACADEMIC': 'bg-blue-100 text-blue-800',
      'SOCIAL': 'bg-pink-100 text-pink-800',
      'CAREER': 'bg-green-100 text-green-800',
      'SPORTS': 'bg-orange-100 text-orange-800',
      'CULTURAL': 'bg-purple-100 text-purple-800',
      'GENERAL': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'ACADEMIC': '📚',
      'SOCIAL': '🎉',
      'CAREER': '💼',
      'SPORTS': '⚽',
      'CULTURAL': '🎭',
      'GENERAL': '📢',
    };
    return icons[category] || '📢';
  };

  const eventCategories = [
    { value: '', label: 'All Events' },
    { value: 'ACADEMIC', label: 'Academic' },
    { value: 'SOCIAL', label: 'Social' },
    { value: 'CAREER', label: 'Career' },
    { value: 'SPORTS', label: 'Sports' },
    { value: 'CULTURAL', label: 'Cultural' },
  ];

  const isLoading = announcementsLoading || eventsLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Campus Information</h1>
        <p className="mt-2 text-gray-600">Stay updated with announcements and campus events</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveView('announcements')}
              className={`flex items-center py-4 px-6 text-center text-sm font-medium border-b-2 ${
                activeView === 'announcements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">📢</span>
              Announcements
            </button>
            <button
              onClick={() => setActiveView('events')}
              className={`flex items-center py-4 px-6 text-center text-sm font-medium border-b-2 ${
                activeView === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">📅</span>
              Events
            </button>
          </nav>
        </div>
      </div>

      {/* Announcements View */}
      {activeView === 'announcements' && (
        <div>
          {announcementsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : announcements && announcements.length > 0 ? (
            <div className="space-y-6">
              {announcements.map((announcement: any) => (
                <div
                  key={announcement.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-3">
                            {getCategoryIcon(announcement.category)}
                          </span>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              {announcement.title}
                            </h3>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Posted on {new Date(announcement.publishedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getCategoryColor(announcement.category)}`}>
                        {announcement.category}
                      </span>
                    </div>

                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-line">{announcement.content}</p>
                    </div>

                    {announcement.attachmentUrl && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <a
                          href={announcement.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                        >
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          View Attachment
                        </a>
                      </div>
                    )}

                    {announcement.expiresAt && new Date(announcement.expiresAt) > new Date() && (
                      <div className="mt-4 flex items-center text-sm text-amber-600">
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Expires on {new Date(announcement.expiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no announcements at this time.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Events View */}
      {activeView === 'events' && (
        <div>
          {/* Filter */}
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {eventCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {eventsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event: any) => {
                const eventDate = new Date(event.startTime);
                const isPast = eventDate < new Date();
                const registrationOpen = event.registrationOpen && !isPast;

                return (
                  <div
                    key={event.id}
                    className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${
                      isPast ? 'opacity-75' : ''
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">{getCategoryIcon(event.category)}</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(event.category)}`}>
                          {event.category}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {event.title}
                      </h3>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {event.description}
                      </p>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {eventDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>

                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {eventDate.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {event.endTime && (
                            <> - {new Date(event.endTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</>
                          )}
                        </div>

                        {event.location && (
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.location}
                          </div>
                        )}

                        {event.maxParticipants && (
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {event.currentParticipants || 0} / {event.maxParticipants} registered
                          </div>
                        )}
                      </div>

                      {isPast && (
                        <div className="mt-4 px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded text-center">
                          Event has ended
                        </div>
                      )}

                      {!isPast && registrationOpen && (
                        <button
                          onClick={() => handleRegister(event.id)}
                          disabled={registerMutation.isPending || (event.maxParticipants && event.currentParticipants >= event.maxParticipants)}
                          className="mt-4 w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {event.maxParticipants && event.currentParticipants >= event.maxParticipants
                            ? 'Event Full'
                            : 'Register'}
                        </button>
                      )}

                      {!isPast && !registrationOpen && (
                        <div className="mt-4 px-3 py-2 bg-yellow-100 text-yellow-800 text-sm rounded text-center">
                          Registration closed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedCategory
                  ? 'No events in this category. Try selecting a different filter.'
                  : 'There are no upcoming events at this time.'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
