import React, { useState, useEffect } from 'react';
import { Event, User } from '../types';
import { eventRegistrationService, EventRegistration } from '../services/eventRegistrationService';

interface RegistrationNotificationProps {
  event: Event;
  user: User | null;
  onRegistrationUpdate?: () => void;
}

const RegistrationNotification: React.FC<RegistrationNotificationProps> = ({
  event,
  user,
  onRegistrationUpdate
}) => {
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (user && event) {
      checkRegistrationStatus();
    } else {
      setIsLoading(false);
    }
  }, [user, event.id]);

  const checkRegistrationStatus = async () => {
    try {
      setIsLoading(true);
      // FIX: Always pass clubId to isUserRegisteredWithUser
      const isRegistered = await eventRegistrationService.isUserRegisteredWithUser(event.id, user!, event.organizerClubId);
      
      // Don't fetch full registration details - just set the status
      // This eliminates unnecessary guest registration queries
      setRegistration(null);
      setShowNotification(isRegistered);
    } catch (error) {
      console.error('Error checking registration status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  const handleViewDetails = () => {
    // This could open a modal or navigate to registration details
    console.log('View registration details:', registration);
  };

  if (!user || isLoading || !showNotification || !registration) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`p-4 rounded-lg border shadow-lg backdrop-blur-sm ${getStatusColor(registration.status)}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon(registration.status)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">
                {registration.status === 'confirmed' && 'Registration Confirmed!'}
                {registration.status === 'pending' && 'Registration Pending'}
                {registration.status === 'cancelled' && 'Registration Cancelled'}
              </h4>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs mt-1 opacity-90">
              You're registered for <strong>{event.name || event.title || 'this event'}</strong>
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-black/20">
                ID: {registration.id?.slice(-8) || 'N/A'}
              </span>
              {registration.paymentStatus && (
                <span className={`px-2 py-1 rounded ${
                  registration.paymentStatus === 'paid' ? 'bg-green-500/30' :
                  registration.paymentStatus === 'pending' ? 'bg-yellow-500/30' :
                  'bg-red-500/30'
                }`}>
                  {registration.paymentStatus}
                </span>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleViewDetails}
                className="text-xs px-3 py-1 bg-black/20 rounded hover:bg-black/30 transition-colors"
              >
                View Details
              </button>
              <button
                onClick={onRegistrationUpdate}
                className="text-xs px-3 py-1 bg-black/20 rounded hover:bg-black/30 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationNotification;
