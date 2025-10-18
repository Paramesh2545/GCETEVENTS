import { useState, useEffect, useRef, useCallback } from 'react';
import { firestoreDataService } from '../services/firestoreDataService';
import { setupRealtimeListeners } from '../services/realtimeDataService';
import { Event, Club, User, LeadershipMember, AnnualEvent, NewsArticle, ExternalEvent, Notification, Application } from '../types';

interface DataState {
  events: Event[];
  clubs: Club[];
  leadership: LeadershipMember[];
  annualEvents: AnnualEvent[];
  news: NewsArticle[];
  externalEvents: ExternalEvent[];
  users: User[];
  notifications: Notification[];
  applications: Application[];
}

interface UseDataFetchingOptions {
  user: User | null;
  enableRealtime?: boolean;
}

export const useDataFetching = ({ user, enableRealtime = true }: UseDataFetchingOptions) => {
  const [data, setData] = useState<DataState>({
    events: [],
    clubs: [],
    leadership: [],
    annualEvents: [],
    news: [],
    externalEvents: [],
    users: [], // Will be loaded only when needed
    notifications: [],
    applications: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSecondaryLoading, setIsSecondaryLoading] = useState(false);
  const [isUserDataLoading, setIsUserDataLoading] = useState(false);
  
  // Refs to prevent duplicate calls
  const hasInitialized = useRef(false);
  const hasSecondaryLoaded = useRef(false);
  const hasUserDataLoaded = useRef(false);
  const realtimeCleanup = useRef<(() => void) | null>(null);

  // Initial data loading (critical data only)
  useEffect(() => {
    if (hasInitialized.current) return;
    
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [eventsData, clubsData, leadershipData] = await Promise.all([
          firestoreDataService.getEvents(),
          firestoreDataService.getClubs(),
          firestoreDataService.getLeadership()
        ]);
        
        setData(prev => ({
          ...prev,
          events: eventsData,
          clubs: clubsData,
          leadership: leadershipData,
        }));
        
        hasInitialized.current = true;
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Secondary data loading - only load when needed
  const loadSecondaryData = useCallback(async () => {
    if (hasSecondaryLoaded.current) return;
    
    setIsSecondaryLoading(true);
    try {
      const [annualEventsData, newsData, externalEventsData] = await Promise.all([
        firestoreDataService.getAnnualEvents(),
        firestoreDataService.getNews(),
        firestoreDataService.getExternalEvents()
      ]);
      
      setData(prev => ({
        ...prev,
        annualEvents: annualEventsData,
        news: newsData,
        externalEvents: externalEventsData,
      }));
      
      hasSecondaryLoaded.current = true;
    } catch (error) {
      console.error("Failed to fetch secondary data:", error);
    } finally {
      setIsSecondaryLoading(false);
    }
  }, []);

  // Load secondary data only when needed (lazy loading)
  useEffect(() => {
    if (!hasInitialized.current) return;
    
    // Load secondary data after initial data is loaded
    const timer = setTimeout(loadSecondaryData, 2000); // 2 second delay
    return () => clearTimeout(timer);
  }, [hasInitialized.current, loadSecondaryData]);

  // User-specific data loading - only load when user logs in
  useEffect(() => {
    if (!user || hasUserDataLoaded.current) return;
    
    const fetchUserData = async () => {
      setIsUserDataLoading(true);
      try {
        // Only load essential user data
        const [notificationsData, applicationsData] = await Promise.all([
          firestoreDataService.getNotifications(),
          firestoreDataService.getApplications()
        ]);
        
        setData(prev => ({
          ...prev,
          notifications: notificationsData,
          applications: applicationsData,
        }));
        
        hasUserDataLoaded.current = true;
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setIsUserDataLoading(false);
      }
    };

    // Delay user data loading to not block initial render
    const timer = setTimeout(fetchUserData, 1000);
    return () => clearTimeout(timer);
  }, [user?.id]);

  // Clear user data when user logs out
  useEffect(() => {
    if (!user && hasUserDataLoaded.current) {
      setData(prev => ({
        ...prev,
        users: [],
        notifications: [],
        applications: [],
      }));
      hasUserDataLoaded.current = false;
    }
  }, [user]);

  // Real-time listeners setup - only for critical data that changes frequently
  useEffect(() => {
    if (!user || !enableRealtime || !hasInitialized.current) return;

    // Clean up existing listeners
    if (realtimeCleanup.current) {
      realtimeCleanup.current();
    }

    // Only set up listeners for data that actually changes frequently
    const cleanup = setupRealtimeListeners({
      onEventsUpdate: (events) => {
        setData(prev => ({ ...prev, events }));
      },
      onClubsUpdate: (clubs) => {
        setData(prev => ({ ...prev, clubs }));
      },
      // Only add other listeners if they're actually needed
      onNotificationsUpdate: user ? (notifications) => {
        setData(prev => ({ ...prev, notifications }));
      } : undefined,
      onApplicationsUpdate: user ? (applications) => {
        setData(prev => ({ ...prev, applications }));
      } : undefined,
    }, user.id, user.role === 'admin');

    realtimeCleanup.current = cleanup;

    return () => {
      if (cleanup) cleanup();
      realtimeCleanup.current = null;
    };
  }, [user?.id, user?.role, enableRealtime, hasInitialized.current]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realtimeCleanup.current) {
        realtimeCleanup.current();
      }
    };
  }, []);

  // Memoized update functions to prevent unnecessary re-renders
  const updateEvents = useCallback((events: Event[]) => {
    setData(prev => ({ ...prev, events }));
  }, []);

  const updateClubs = useCallback((clubs: Club[]) => {
    setData(prev => ({ ...prev, clubs }));
  }, []);

  const updateApplications = useCallback((applications: Application[]) => {
    setData(prev => ({ ...prev, applications }));
  }, []);

  return {
    ...data,
    isLoading,
    isSecondaryLoading,
    isUserDataLoading,
    updateEvents,
    updateClubs,
    updateApplications,
  };
};
