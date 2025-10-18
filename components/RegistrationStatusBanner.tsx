import React, { useState, useEffect } from 'react';
import { Event, User } from '../types';
import { eventRegistrationService, EventRegistration } from '../services/eventRegistrationService';

interface RegistrationStatusBannerProps {
  event: Event;
  user: User | null;
  onRegistrationUpdate?: () => void;
}

const RegistrationStatusBanner: React.FC<RegistrationStatusBannerProps> = ({
  event,
  user,
  onRegistrationUpdate
}) => {
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    } catch (error) {
      console.error('Error checking registration status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || isLoading || !registration) {
    return null;
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-400',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          title: 'Registration Confirmed!',
          message: 'You are successfully registered for this event. Check your email for confirmation details.'
        };
      case 'pending':
        return {
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          textColor: 'text-yellow-400',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Registration Pending',
          message: 'Your registration is being reviewed. You will be notified once it\'s confirmed.'
        };
      case 'cancelled':
        return {
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-400',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          title: 'Registration Cancelled',
          message: 'Your registration for this event has been cancelled.'
        };
      default:
        return {
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30',
          textColor: 'text-gray-400',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Registration Status',
          message: 'Your registration status is being processed.'
        };
    }
  };

  const config = getStatusConfig(registration.status);
  // Use event.whatsappLink directly from backend
  const whatsappLink = event.whatsappLink;
  // console.log(event.registrationFee)
  const isFree = event.registrationFee === 0 || event.registrationFee === null || event.registrationFee === undefined;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 mb-6`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${config.textColor}`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${config.textColor} mb-1`}>
            {config.title}
          </h3>
          <p className="text-gray-300 text-sm mb-3">
            {config.message}
          </p>
          
          {/* Registration Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Registration ID:</span>
              <span className="text-white ml-2 font-mono text-xs">
                {registration.id?.slice(-8) || 'N/A'}
              </span>
            </div>
            {registration.status === 'confirmed' ? (
              <div>
                <span className="text-gray-400">Status:</span>
                <span className="ml-2 px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">Confirmed</span>
              </div>
            ) : (
              <div>
                <span className="text-gray-400">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  registration.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                </span>
              </div>
            )}

            {registration.paymentStatus && !isFree && (
              <div>
                <span className="text-gray-400">Payment:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  registration.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' :
                  registration.paymentStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {registration.paymentStatus.charAt(0).toUpperCase() + registration.paymentStatus.slice(1)}
                </span>
              </div>
            )}

            {/* WhatsApp group link for confirmed registrations */}
            {/* {registration.status === 'confirmed' && whatsappLink && (
              <div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                  Join WhatsApp Group
                </a>
              </div>
            )} */}
          </div>

          {/* Additional Info */}
          {registration.additionalInfo && (
            <div className="mt-3 p-3 bg-black/20 rounded">
              <span className="text-gray-400 text-sm">Additional Information:</span>
              <p className="text-white text-sm mt-1">{registration.additionalInfo}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            {/* WhatsApp group link button for confirmed registrations */}
            {registration.status === 'confirmed' && whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                Join WhatsApp Group
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationStatusBanner;
