import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Event, EventStatus, User, Club } from '../types';
import { eventRegistrationService } from '../services/eventRegistrationService';
import EditHighlightsModal from './EditHighlightsModal';
import CreateEventForm from './CreateEvent';
import EventRegistrationModal from './EventRegistrationModal';
import EventRegistrationStats from './EventRegistrationStats';
import RegistrationNotification from './RegistrationNotification';
import RegistrationStatusBanner from './RegistrationStatusBanner';
import EventPaymentConfig from './EventPaymentConfig';

interface EventDetailProps {
  event: Event;
  clubs: Club[];
  user: User | null;
  onRegister: (eventId: string) => void;
  onUpdateEventHighlights: (eventId: string, highlights: Event['highlights']) => void;
  onUpdateEvent: (event: Event) => void;
  onRegistrationUpdate?: () => void;
}

const statusStyles: { [key in EventStatus]: string } = {
  [EventStatus.Upcoming]: 'bg-green-500/10 text-green-400',
  [EventStatus.Ongoing]: 'bg-blue-500/10 text-blue-400',
  [EventStatus.Past]: 'bg-gray-500/10 text-gray-400',
};

const EventDetail: React.FC<EventDetailProps> = ({ event, clubs, user, onRegister, onUpdateEventHighlights, onUpdateEvent, onRegistrationUpdate }) => {
    const organizerClub = clubs.find(c => c.id === event.organizerClubId);
    const [isRegistered, setIsRegistered] = useState<boolean>(false);
    const [isCheckingRegistration, setIsCheckingRegistration] = useState<boolean>(false);
    // Find admin in club team
    const clubAdmin = organizerClub?.team?.find(m => m.position?.toLowerCase() === 'admin');
    const isClubAdmin = user && clubAdmin && clubAdmin.id === user.id;
    const isManager = user?.role === 'contributor' && user.managedClubIds?.includes(event.organizerClubId);
    const isAdmin = user?.position === 'admin';
    console.log(user.role)
    const [isEditingHighlights, setIsEditingHighlights] = useState(false);
    const [isEditingEvent, setIsEditingEvent] = useState(false);
    const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<{message: string, type: 'success' | 'error' | 'info' | 'warning'} | null>(null);
    const canEdit = isAdmin && event.status !== EventStatus.Past;

    // Check registration status when component mounts or when user/event changes
    useEffect(() => {
        if (user && event) {
            checkRegistrationStatus();
        } else {
            setIsRegistered(false);
        }
    }, [user, event.id]);

    const checkRegistrationStatus = async () => {
        if (!user || !event) return;
        
        try {
            setIsCheckingRegistration(true);
            const registered = await eventRegistrationService.isUserRegisteredWithUser(event.id, user, event.organizerClubId);
            setIsRegistered(registered);
        } catch (error) {
            console.error('Error checking registration status:', error);
            setIsRegistered(false);
        } finally {
            setIsCheckingRegistration(false);
        }
    };

    const handleRegistration = async (e: React.FormEvent) => {
        console.log("yeaa")
        e.preventDefault();
        if (!user) return;
        
        setIsCheckingRegistration(true);
        try {
            // Check if user is already registered
            const isAlreadyRegistered = await eventRegistrationService.isUserRegisteredWithUser(event.id, user, event.organizerClubId);
            
            if (isAlreadyRegistered) {
                // Show already registered message
                // setToastMessage({
                //     message: 'You are already registered for this event!',
                //     type: 'info'
                // });
                // Refresh registration status
                onRegistrationUpdate?.();
            } else {
                // Open registration modal
                setIsRegistrationModalOpen(true);
            }
        } catch (error) {
            console.error('Error checking registration status:', error);
            setToastMessage({
                message: 'Error checking registration status. Please try again.',
                type: 'error'
            });
        } finally {
            setIsCheckingRegistration(false);
        }
    }

    const handleRegistrationSuccess = (registrationId: string) => {
        // Update local registration status immediately
        setIsRegistered(true);
        onRegister(event.id);
        onRegistrationUpdate?.();
        setIsRegistrationModalOpen(false);
    }

    const handleSaveHighlights = async (highlights: Event['highlights']) => {
        // Clean highlights object to remove undefined/null/empty fields (for Firestore compatibility)
        function cleanHighlights(obj: any) {
          if (Array.isArray(obj)) {
            return obj.filter(Boolean).map(cleanHighlights);
          } else if (obj && typeof obj === 'object') {
            const cleaned: any = {};
            for (const key in obj) {
              const value = obj[key];
              if (
                value !== undefined &&
                value !== null &&
                !(typeof value === 'string' && value.trim() === '') &&
                !(Array.isArray(value) && value.length === 0)
              ) {
                cleaned[key] = cleanHighlights(value);
              }
            }
            return cleaned;
          }
          return obj;
        }

        try {
            const { firestoreDataService } = await import('../services/firestoreDataService');
            await firestoreDataService.updateClubEvent(
                event.organizerClubId,
                event.id,
                { highlights: cleanHighlights(highlights) }
            );
            onUpdateEvent({ ...event, highlights: cleanHighlights(highlights) });
            setIsEditingHighlights(false);
        } catch (err) {
            console.error('Failed to save highlights:', err);
            alert('Failed to save highlights. Please try again.');
        }
    };

    const handleUpdateEventAndClose = (updatedEvent: Event) => {
        onUpdateEvent(updatedEvent);
        setIsEditingEvent(false);
    }

  return (
    <>
      {/* Registration Notification */}
      {/* Remove RegistrationNotification component */}
      {/* {user && (
        <RegistrationNotification
          event={event}
          user={user}
          onRegistrationUpdate={onRegistrationUpdate}
        />
      )} */}
      {isEditingHighlights && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                  <EditHighlightsModal 
                      event={event}
                      onClose={() => setIsEditingHighlights(false)}
                      onSave={handleSaveHighlights}
                  />
              </div>
          </div>
      )}
       {isEditingEvent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                  <CreateEventForm 
                      clubId={event.organizerClubId}
                      eventToEdit={event}
                      onUpdateEvent={handleUpdateEventAndClose}
                      onClose={() => setIsEditingEvent(false)} 
                  />
              </div>
          </div>
      )}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-[#1D2434] rounded-lg shadow-xl overflow-hidden my-16">
          <div className="relative">
              <img className="h-80 w-full object-cover" src={event.imageUrl} alt={event.name || event.title || 'Event'} />
              <div className="absolute inset-0 bg-black/50"></div>
          </div>
          <div className="p-8 md:p-12">
              <div className="relative -mt-24">
                  {/* Registration Status Banner */}
                  {user && (
                    <RegistrationStatusBanner
                      event={event}
                      user={user}
                      onRegistrationUpdate={onRegistrationUpdate}
                    />
                  )}

                  <div className="flex justify-between items-start flex-wrap gap-4">
                      <div>
                          <h1 className="text-4xl md:text-5xl font-extrabold text-white">{event.name || event.title || 'Untitled Event'}</h1>
                          {organizerClub && (
                              <Link 
                                  to={`/clubs/${organizerClub.id}`}
                                  className="text-lg text-indigo-400 hover:underline mt-1"
                              >
                                  Organized by {organizerClub.name}
                              </Link>
                          )}
                      </div>
                      <div className="flex items-center gap-4">
                        {canEdit && (
                            <button onClick={() => setIsEditingEvent(true)} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Edit Event</button>
                        )}
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-md font-semibold ${statusStyles[event.status]} flex-shrink-0`}>
                            {event.status}
                        </span>
                      </div>
                  </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-300 border-y border-gray-800 py-6">
                  <div className="flex items-start">
                      <svg className="h-6 w-6 mr-3 text-indigo-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <div><strong>Date & Time:</strong> {event.date} at {event.time}</div>
                  </div>
                  <div className="flex items-start">
                      <svg className="h-6 w-6 mr-3 text-indigo-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <div><strong>Venue:</strong> {event.location}</div>
                  </div>
                  <div className="flex items-start">
                      <svg className="h-6 w-6 mr-3 text-indigo-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      <div><strong>Fee:</strong> {event.registrationFee && event.registrationFee > 0 ? `$${event.registrationFee}` : 'Free'}</div>
                  </div>
              </div>

              <div className="mt-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                      <div className="lg:col-span-2">
                          <h2 className="text-2xl font-bold text-white">About the Event</h2>
                          <p className="mt-4 text-gray-400 whitespace-pre-wrap">{event.description}</p>
                          
                          {event.rules.length > 0 && <>
                              <h3 className="text-xl font-bold text-white mt-6">Rules & Prerequisites</h3>
                              <ul className="mt-4 list-disc list-inside space-y-2 text-gray-400">
                              {event.rules.map((rule, i) => <li key={i}>{rule}</li>)}
                              </ul>
                          </>}
                          
                           {event.customSections?.map((section, index) => (
                                <div key={index} className="mt-6">
                                    <h3 className="text-xl font-bold text-white">{section.title}</h3>
                                    <p className="mt-2 text-gray-400 whitespace-pre-wrap">{section.content}</p>
                                </div>
                            ))}


                           {event.specialGuests && event.specialGuests.length > 0 && <>
                              <h3 className="text-xl font-bold text-white mt-6">Special Guests</h3>
                               <ul className="mt-4 list-disc list-inside space-y-2 text-gray-400">
                              {event.specialGuests.map((guest, i) => <li key={i}>{guest}</li>)}
                              </ul>
                          </>}

                          {/* {event.coordinators.length > 0 && <>
                              <h3 className="text-xl font-bold text-white mt-6">Event Coordinators</h3>
                              <div className="mt-4 text-gray-400">
                              {event.coordinators.map((c, i) => <p key={i}>{c.name} - <a href={`mailto:${c.contact}`} className="text-indigo-400 hover:underline">{c.contact}</a></p>)}
                              </div>
                          </>} */}
                      </div>

                      {/* Registration Section */}
                      {event.status !== EventStatus.Past && !isManager && (
                          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                              {isRegistered ? (
                                  <div className="text-center">
                                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                      </div>
                                      <h2 className="text-2xl font-bold text-white">✅ Already Registered!</h2>
                                      <p className="mt-4 text-gray-300">
                                          You have successfully registered for this event. 
                                          Check the status banner above for more details.
                                      </p>
                                      <div className="mt-6 flex gap-3 justify-center">
                                          <button
                                              onClick={() => setIsRegistrationModalOpen(true)}
                                              className="bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors"
                                          >
                                              View Details
                                          </button>
                                          {/* <button
                                              onClick={onRegistrationUpdate}
                                              className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                                          >
                                              Refresh Status
                                          </button> */}
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-center">
                                      <h2 className="text-2xl font-bold text-white">Register Now</h2>
                                      <p className="text-gray-400 mt-2 text-sm mb-6">
                                          Complete your registration with pre-filled profile information.
                                      </p>
                                      <button
                                          onClick={handleRegistration}
                                          disabled={isCheckingRegistration}
                                          className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                      >
                                          {isCheckingRegistration && (
                                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                              </svg>
                                          )}
                                          {isCheckingRegistration ? 'Checking...' : 'Register for Event'}
                                      </button>
                                  </div>
                              )}
                          </div>
                      )}
                      {user?.role === 'contributor' && isManager && (
                            <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                                <h3 className="text-lg font-semibold text-white">Event Details</h3>
                                <p className="text-gray-400 mt-2">You are already a member of the event.</p>
                            </div>
                      )}

                      {/* Payment Configuration for Managers */}
                      {canEdit && event.registrationFee && event.registrationFee > 0 && (
                        <div className="mt-8">
                          <EventPaymentConfig 
                            event={event} 
                            user={user!} 
                            clubs={clubs}
                            onConfigUpdate={onRegistrationUpdate}
                          />
                        </div>
                      )}

                      {/* Registration Statistics for Club Admin only */}
                      {isClubAdmin && (
                        <div className="mt-8">
                          <EventRegistrationStats event={event} isManager={true} />
                        </div>
                      )}
                  </div>
              </div>
               {event.status === EventStatus.Past && (
                  <div className="mt-12">
                      <div className="flex justify-between items-center mb-8">
                          <h2 className="text-3xl font-bold text-white border-l-4 border-indigo-500 pl-4">Event Highlights</h2>
                          {isManager && (
                              <button 
                                  onClick={() => setIsEditingHighlights(true)}
                                  className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                              >
                                  Add/Edit Highlights
                              </button>
                          )}
                      </div>
                      {event.highlights ? (
                          <>
                              {event.highlights.images?.length > 0 && (
                                  <div className="mb-8">
                                      <div className="flex justify-between items-center mb-4">
                                          <h3 className="text-xl font-bold text-white">Gallery</h3>
                                          {event.highlights.galleryDriveLink && (
                                              <a
                                                  href={event.highlights.galleryDriveLink}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2 text-sm"
                                              >
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                  </svg>
                                                  View More
                                              </a>
                                          )}
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                          {event.highlights.images.map((img, i) => (
                                              <img key={i} src={img} alt={`Highlight ${i+1}`} className="rounded-lg object-cover w-full h-48 hover:scale-105 transition-transform duration-300" />
                                          ))}
                                      </div>
                                  </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  {event.highlights.guests?.length > 0 && (
                                      <div>
                                          <h3 className="text-xl font-bold text-white mb-4">Special Guests</h3>
                                          <ul className="list-disc list-inside space-y-2 text-gray-400">
                                              {event.highlights.guests.map((guest, i) => <li key={i}>{guest}</li>)}
                                          </ul>
                                      </div>
                                  )}
                                  {event.highlights.winners?.length > 0 && (
                                      <div>
                                          <h3 className="text-xl font-bold text-white mb-4">Winners</h3>
                                          <div className="space-y-3">
                                          {event.highlights.winners.map((winner, i) => (
                                              <div key={i} className="bg-slate-800/50 p-3 rounded-md">
                                                  <p className="font-bold text-indigo-400">{winner.position}: <span className="text-white">{winner.name}</span></p>
                                                  {winner.details && <p className="text-sm text-gray-400">{winner.details}</p>}
                                              </div>
                                          ))}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </>
                      ) : (
                          <div className="text-center bg-slate-900 p-8 rounded-lg">
                              <p className="text-gray-400">No highlights have been added for this event yet.</p>
                          </div>
                      )}
                  </div>
              )}
          </div>
          </div>
      </div>

      {/* Registration Modal */}
      {user && (
        <EventRegistrationModal
          event={event}
          user={user}
          isOpen={isRegistrationModalOpen}
          onClose={() => setIsRegistrationModalOpen(false)}
          onRegistrationSuccess={handleRegistrationSuccess}
        />
      )}
    </>
  );
};

export default EventDetail;