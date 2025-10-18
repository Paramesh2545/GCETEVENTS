import { useState, useEffect, useRef, useCallback } from 'react';
import { Event, User } from '../types';
import { optimizedRegistrationService } from '../services/optimizedRegistrationService';

interface UseProfileDataOptions {
  user: User | null;
  events: Event[];
  activeTab: 'events' | 'clubs' | 'applications';
}

export const useProfileData = ({ user, events, activeTab }: UseProfileDataOptions) => {
  const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);
  
  // Refs to prevent duplicate calls
  const hasLoadedRegistrations = useRef(false);
  const currentTab = useRef(activeTab);

  // Only fetch registrations when events tab is active and user exists
  useEffect(() => {
    if (!user || activeTab !== 'events' || hasLoadedRegistrations.current) return;
    
    const fetchUserRegistrations = async () => {
      setIsLoadingRegistrations(true);
      try {
        const userId = user.isGuest ? user.id : (user.id || '');
        
        // Use optimized service - single read + efficient filtering
        const userRegisteredEvents = await optimizedRegistrationService.getUserRegisteredEvents(userId, events);
        setRegisteredEvents(userRegisteredEvents);
        hasLoadedRegistrations.current = true;
      } catch (error) {
        console.error('Error fetching user registrations:', error);
      } finally {
        setIsLoadingRegistrations(false);
      }
    };

    fetchUserRegistrations();
  }, [user?.id, events.length, activeTab]);

  // Reset registration loading when tab changes
  useEffect(() => {
    if (currentTab.current !== activeTab) {
      currentTab.current = activeTab;
      if (activeTab !== 'events') {
        hasLoadedRegistrations.current = false;
        setRegisteredEvents([]);
      }
    }
  }, [activeTab]);

  // Reset when user changes
  useEffect(() => {
    if (user?.id) {
      hasLoadedRegistrations.current = false;
      setRegisteredEvents([]);
    }
  }, [user?.id]);

  const refreshRegistrations = useCallback(async () => {
    if (!user || activeTab !== 'events') return;
    
    hasLoadedRegistrations.current = false;
    setIsLoadingRegistrations(true);
    
    try {
      const userId = user.isGuest ? user.id : (user.id || '');
      
      // Use optimized service - single read + efficient filtering
      const userRegisteredEvents = await optimizedRegistrationService.getUserRegisteredEvents(userId, events);
      setRegisteredEvents(userRegisteredEvents);
      hasLoadedRegistrations.current = true;
    } catch (error) {
      console.error('Error refreshing registrations:', error);
    } finally {
      setIsLoadingRegistrations(false);
    }
  }, [user, events, activeTab]);

  return {
    registeredEvents,
    isLoadingRegistrations,
    refreshRegistrations,
  };
};
