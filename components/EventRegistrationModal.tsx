import React, { useState, useEffect } from 'react';
import { Event, User } from '../types';
import { eventRegistrationService, EventRegistration } from '../services/eventRegistrationService';
import { optimizedRegistrationService } from '../services/optimizedRegistrationService';
import PaymentModal from './PaymentModal';

interface EventRegistrationModalProps {
  event: Event;
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onRegistrationSuccess: (registrationId: string) => void;
}

const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({
  event,
  user,
  isOpen,
  onClose,
  onRegistrationSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingRegistrationId, setPendingRegistrationId] = useState<string | null>(null);
  const [teamMode, setTeamMode] = useState<'individual' | 'create' | 'join' | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [foundTeams, setFoundTeams] = useState<{ id: string; name: string }[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Check if user is already registered only when modal opens for a specific event
  useEffect(() => {
    if (isOpen && user && event.id) {
      console.log('Modal opened for event:', event.id, 'checking registration status...');
      checkRegistrationStatus();
    }
  }, [isOpen, user, event.id]); // Only re-run when these specific values change

  const checkRegistrationStatus = async () => {
    try {
      console.log('Checking registration status for:', { eventId: event.id, userId: user.id, clubId: event.organizerClubId, isGuest: user.isGuest });
      
      // Use the optimized service - single read check
      const userId = user.isGuest ? user.id : (user.id || '');
      const registered = await optimizedRegistrationService.isUserRegistered(userId, event.id);
      console.log('Registration status result:', registered);
      
      // Don't fetch full registration details - just set the status
      // This eliminates unnecessary guest registration queries
      setIsRegistered(registered);
      setRegistration(null); // We don't need the full registration object for the modal
      
      if (registered) {
        console.log('User is registered for this event');
      } else {
        console.log('User is not registered for this event');
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
      // Don't set isRegistered to false on error - let the user try to register
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (event.registrationFee && event.registrationFee > 0) {
        // For paid events, always open payment modal
        setShowPaymentModal(true);
        setIsLoading(false); // Stop loading spinner since modal is open
        return; // Do not proceed further
      } 
      
      // For free events, create registration immediately
      let registrationId: string;
      
      if (user.isGuest) {
        // Guest registration
        registrationId = await eventRegistrationService.registerGuestForEvent(
          event.id,
          event.organizerClubId,
          {
            name: user.name,
            email: user.email || '',
            phone: user.mobile || '',
            college: user.collegeName || 'GCET',
            year: user.year || '1',
            department: user.branch || 'CSE'
          },
          {
            name: event.name || event.title || 'Untitled Event',
            date: event.date || 'TBD',
            location: event.location || 'TBD',
            registrationFee: event.registrationFee
          },
          additionalInfo.trim() || undefined
        );
      } else {
        // Regular user registration
        registrationId = await eventRegistrationService.registerForEvent(
          event.id,
          user,
          {
            name: event.name || event.title || 'Untitled Event',
            date: event.date || 'TBD',
            location: event.location || 'TBD',
            registrationFee: event.registrationFee,
            organizerClubId: event.organizerClubId
          },
          additionalInfo.trim() || undefined
        );
      }
      
      // Update both user and event documents with atomic updates
      const userId = user.isGuest ? user.id : (user.id || '');
      await optimizedRegistrationService.registerUserForEvent(userId, event.id, event.organizerClubId);
      
      setIsRegistered(true);
      
      // Add a small delay to show success message before closing modal
      setTimeout(() => {
        onRegistrationSuccess(registrationId);
      }, 2000); // 2 second delay to show success message
      
      // Don't re-check registration status since we just created it successfully
      // This avoids unnecessary database queries and permission issues
    } catch (error: any) {
      // Show a more helpful error if user tries to register for paid event (and backend throws)
      if (
        event.registrationFee &&
        event.registrationFee > 0 &&
        error?.message?.includes('should be created after payment')
      ) {
        setShowPaymentModal(true);
        setPendingRegistrationId('');
        setError(null);
        setIsLoading(false);
        return;
      } else if (error?.message?.includes('already registered')) {
        // Handle duplicate registration error
        setError('You are already registered for this event!');
        setIsRegistered(true); // Show as registered
      } else {
        setError('Registration failed. Please try again.');
      }
      console.error('Registration failed:', error);
    } finally {
      // Only set loading false if not already set above
      if (!(event.registrationFee && event.registrationFee > 0)) {
        setIsLoading(false);
      }
    }
  };

  // const handleCancelRegistration = async () => {
  //   if (!registration?.id) return;
    
  //   setIsLoading(true);
  //   try {
  //     await eventRegistrationService.cancelRegistration(registration.id);
  //     setIsRegistered(false);
  //     setRegistration(null);
  //   } catch (error) {
  //     console.error('Error cancelling registration:', error);
  //     setError('Failed to cancel registration. Please try again.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Team search handler (calls backend)
  const handleTeamSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const teams = await eventRegistrationService.searchTeams(
        event.id,
        event.organizerClubId,
        teamSearch.trim()
      );
      setFoundTeams(teams.map(t => ({ id: t.id!, name: t.name })));
    } catch (err) {
      setError('Failed to search teams. Please try again.');
      setFoundTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Team registration handler (create or join)
  const handleTeamRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let teamId: string | null = null;
      // Create a new team
      if (teamMode === 'create') {
        setIsLoading(true);
        setError(null);
        if (event.registrationFee && event.registrationFee > 0) {
          // For paid events, always open payment modal
          setShowPaymentModal(true);
          setIsLoading(false); // Stop loading spinner since modal is open
          return; // Do not proceed further
        }
        teamId = await eventRegistrationService.createTeam(
          event.id,
          event.organizerClubId,
          teamName.trim(),
          {
            userId: user.id,
            userName: user.name,
            userEmail: user.email || ''
          }
        );
      }
      // Join an existing team
      else if (teamMode === 'join' && selectedTeamId) {
        await eventRegistrationService.joinTeam(
          event.id,
          event.organizerClubId,
          selectedTeamId,
          {
            userId: user.id,
            userName: user.name,
            userEmail: user.email || ''
          }
        );
        teamId = selectedTeamId;
      }

      if (!teamId) throw new Error('No team selected or created.');

      // Register user for the event with teamId
      const registrationId = await eventRegistrationService.registerForTeamEvent(
        event.id,
        user,
        {
          name: event.name || event.title || 'Untitled Event',
          date: event.date || 'TBD',
          location: event.location || 'TBD',
          registrationFee: event.registrationFee,
          organizerClubId: event.organizerClubId
        },
        teamId,
        additionalInfo.trim() || undefined
      );

      setIsRegistered(true);
      
      // Add a small delay to show success message before closing modal
      setTimeout(() => {
        onRegistrationSuccess(registrationId);
      }, 2000); // 2 second delay to show success message
      
      // Don't re-check registration status since we just created it successfully
      // This avoids unnecessary database queries and permission issues
    } catch (error: any) {
      if (error?.message?.includes('already registered')) {
        // Handle duplicate registration error
        setError('You are already registered for this event!');
        setIsRegistered(true); // Show as registered
      } else {
        setError('Team registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      console.log('Payment successful, creating registration...', { paymentId, userId: user.id, isGuest: user.isGuest });
      
      // For paid events, create registration only after payment is successful
      const registrationId = await eventRegistrationService.registerForPaidEvent(
        event.id,
        user,
        {
          name: event.name || event.title || 'Untitled Event',
          date: event.date || 'TBD',
          location: event.location || 'TBD',
          registrationFee: event.registrationFee,
          organizerClubId: event.organizerClubId
        },
        paymentId,
        additionalInfo.trim() || undefined
      );
      
      console.log('Registration created successfully:', registrationId);
      
      // Store payment record in event's payments subcollection
      try {
        await eventRegistrationService.storeEventPayment({
          registrationId,
          eventId: event.id,
          clubId: event.organizerClubId,
          userId: user.id,
          userName: user.name,
          userEmail: user.email || '',
          amount: event.registrationFee || 0,
          paymentId,
        });
        console.log('Payment record stored successfully');
      } catch (paymentError) {
        console.warn('Payment record storage failed, but continuing:', paymentError);
      }

      console.log('Setting registration status to true...');
      setIsRegistered(true);
      
      // Add a small delay to show success message before closing modal
      setTimeout(() => {
        onRegistrationSuccess(registrationId);
        setShowPaymentModal(false);
        setPendingRegistrationId(null);
      }, 2000); // 2 second delay to show success message

      // Don't re-check registration status since we just created it successfully
      // This avoids permission issues with guest users
      console.log('Registration completed successfully, skipping status check');
    } catch (error) {
      console.error('Error updating registration after payment:', error);
      setError('Payment successful but registration update failed. Please contact support.');
    }
  };

  const handlePaymentFailure = (error: string) => {
    setError(error);
    setShowPaymentModal(false);
    setPendingRegistrationId(null);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPendingRegistrationId(null);
  };

  if (!isOpen) return null;

  // Check if event is team registration
  const isTeamEvent = event.registrationType === 'team';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white">Event Registration</h2>
              <p className="text-gray-400 mt-1">{event.name || event.title || 'Untitled Event'}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isRegistered ? (
            // Already Registered
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">You're Registered!</h3>
              <p className="text-gray-400 mb-6">
                You have successfully registered for this event. Check your email for confirmation details.
              </p>
              
              {registration && (
                <div className="bg-slate-800/50 p-4 rounded-lg mb-6 text-left">
                  <h4 className="font-semibold text-white mb-2">Registration Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        registration.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        registration.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Registration ID:</span>
                      <span className="text-white font-mono text-xs">{registration.id}</span>
                    </div>
                    {registration.paymentStatus && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Payment:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          registration.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' :
                          registration.paymentStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {registration.paymentStatus.charAt(0).toUpperCase() + registration.paymentStatus.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
                {/* <button
                  onClick={handleCancelRegistration}
                  disabled={isLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Cancelling...' : 'Cancel Registration'}
                </button> */}
              </div>
            </div>
          ) : (
            // Registration Form
            <>
              {isTeamEvent ? (
                // Team Registration UI
                <>
                  {!teamMode && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-4">How do you want to register?</h3>
                      <div className="flex flex-col gap-4">
                        <button
                          className="bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                          onClick={() => setTeamMode('create')}
                        >
                          Create a New Team
                        </button>
                        <button
                          className="bg-slate-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-600 transition-colors"
                          onClick={() => setTeamMode('join')}
                        >
                          Join an Existing Team
                        </button>
                        <button
                          className="bg-slate-800 text-gray-300 font-semibold py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {teamMode === 'create' && (
                    <form onSubmit={handleTeamRegistration} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Team Name</label>
                        <input
                          type="text"
                          value={teamName}
                          onChange={e => setTeamName(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white"
                          placeholder="Enter your team name"
                        />
                      </div>
                      {/* ...additional team creation fields if needed... */}
                      <div className="flex gap-3 justify-end">
                        <button
                          type="button"
                          onClick={() => setTeamMode(null)}
                          className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading || !teamName}
                          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? 'Creating...' : 'Create Team & Register'}
                        </button>
                      </div>
                    </form>
                  )}
                  {teamMode === 'join' && (
                    <form onSubmit={handleTeamRegistration} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Search Team</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={teamSearch}
                            onChange={e => setTeamSearch(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white"
                            placeholder="Enter team name"
                          />
                          <button
                            type="button"
                            onClick={handleTeamSearch}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Search
                          </button>
                        </div>
                        {foundTeams.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Teams Found:</h4>
                            <ul className="space-y-2">
                              {foundTeams.map(team => (
                                <li key={team.id} className="flex items-center gap-2">
                                  <span className="text-white">{team.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTeamId(team.id)}
                                    className={`px-3 py-1 rounded ${selectedTeamId === team.id ? 'bg-green-600 text-white' : 'bg-slate-700 text-gray-200 hover:bg-slate-600'}`}
                                  >
                                    {selectedTeamId === team.id ? 'Selected' : 'Join'}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button
                          type="button"
                          onClick={() => setTeamMode(null)}
                          className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading || !selectedTeamId}
                          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? 'Joining...' : 'Join Team & Register'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              ) : (
                // Individual Registration UI (existing form)
                <form onSubmit={handleRegistration} className="space-y-6">
                  {/* Event Info */}
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-white mb-3">Event Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Date:</span>
                        <span className="text-white ml-2">{event.date || 'TBD'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Time:</span>
                        <span className="text-white ml-2">{event.time || 'TBD'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Location:</span>
                        <span className="text-white ml-2">{event.location || 'TBD'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Fee:</span>
                        <span className="text-white ml-2">
                          {event.registrationFee && event.registrationFee > 0 
                            ? `$${event.registrationFee}` 
                            : 'Free'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* User Information (Pre-filled) */}
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-white mb-3">Your Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={user.name}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <input
                          type="email"
                          value={user.email}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={user.mobile || 'Not provided'}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Roll Number</label>
                        <input
                          type="text"
                          value={user.rollNumber || 'Not provided'}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Branch</label>
                        <input
                          type="text"
                          value={user.branch || 'Not provided'}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Year</label>
                        <input
                          type="text"
                          value={user.year || 'Not provided'}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-400 mb-2">
                      Additional Information (Optional)
                    </label>
                    <textarea
                      id="additionalInfo"
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      rows={3}
                      placeholder="Any special requirements, dietary restrictions, or other information..."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoading && (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {isLoading ? 'Registering...' : 'Confirm Registration'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          event={event}
          user={user}
          registrationId={pendingRegistrationId || ''}
          isOpen={showPaymentModal}
          onClose={handleClosePaymentModal}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
        />
      )}
    </div>
  );
};

export default EventRegistrationModal;