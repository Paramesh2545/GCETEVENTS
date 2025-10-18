import { 
  collection, 
  collectionGroup,
  onSnapshot, 
  query, 
  where, 
  orderBy,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../../frontend/firebaseConfig';
import { Event, Club, User, LeadershipMember, AnnualEvent, NewsArticle, ExternalEvent, Notification, Application } from '../types';

// Real-time data service with live updates
export class RealtimeDataService {
  private unsubscribers: Map<string, Unsubscribe> = new Map();

  // Clean up all listeners
  cleanup() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers.clear();
  }

  // Listen to events with real-time updates
  listenToEvents(callback: (events: Event[]) => void): Unsubscribe {
    const eventsRef = collectionGroup(db, "clubEvents");
    const q = query(eventsRef, orderBy('date', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          organizerClubId: data.organizerClubId || doc.ref.parent.parent?.id, // ✅ ensure clubId is always present
        } as Event;
      });
      callback(events);
    }, (error) => {
      console.error('Error listening to events:', error);
    });

    this.unsubscribers.set('events', unsubscribe);
    return unsubscribe;
  }

  // Listen to clubs with real-time updates
  listenToClubs(callback: (clubs: Club[]) => void): Unsubscribe {
    const clubsRef = collection(db, 'clubs');
    const q = query(clubsRef, orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clubs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as Club) 
      } as Club));
      callback(clubs);
    }, (error) => {
      console.error('Error listening to clubs:', error);
    });

    this.unsubscribers.set('clubs', unsubscribe);
    return unsubscribe;
  }

  // Listen to leadership with real-time updates
  listenToLeadership(callback: (leadership: LeadershipMember[]) => void): Unsubscribe {
    const leadershipRef = collection(db, 'leadership');
    const q = query(leadershipRef, orderBy('id', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadership = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as LeadershipMember) 
      } as LeadershipMember));
      callback(leadership);
    }, (error) => {
      console.error('Error listening to leadership:', error);
    });

    this.unsubscribers.set('leadership', unsubscribe);
    return unsubscribe;
  }

  // Listen to annual events with real-time updates
  listenToAnnualEvents(callback: (annualEvents: AnnualEvent[]) => void): Unsubscribe {
    const annualEventsRef = collection(db, 'annualEvents');
    const q = query(annualEventsRef, orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const annualEvents = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as AnnualEvent) 
      } as AnnualEvent));
      callback(annualEvents);
    }, (error) => {
      console.error('Error listening to annual events:', error);
    });

    this.unsubscribers.set('annualEvents', unsubscribe);
    return unsubscribe;
  }

  // Listen to news with real-time updates
  listenToNews(callback: (news: NewsArticle[]) => void): Unsubscribe {
    const newsRef = collection(db, 'news');
    const q = query(newsRef, orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const news = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as NewsArticle) 
      } as NewsArticle));
      callback(news);
    }, (error) => {
      console.error('Error listening to news:', error);
    });

    this.unsubscribers.set('news', unsubscribe);
    return unsubscribe;
  }

  // Listen to external events with real-time updates
  listenToExternalEvents(callback: (externalEvents: ExternalEvent[]) => void): Unsubscribe {
    const externalEventsRef = collection(db, 'externalEvents');
    const q = query(externalEventsRef, orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const externalEvents = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as ExternalEvent) 
      } as ExternalEvent));
      callback(externalEvents);
    }, (error) => {
      console.error('Error listening to external events:', error);
    });

    this.unsubscribers.set('externalEvents', unsubscribe);
    return unsubscribe;
  }

  // Listen to notifications for a specific user
  listenToUserNotifications(userId: string, callback: (notifications: Notification[]) => void): Unsubscribe {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef, 
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as Notification) 
      } as Notification));
      callback(notifications);
    }, (error) => {
      console.error('Error listening to user notifications:', error);
    });

    this.unsubscribers.set(`notifications_${userId}`, unsubscribe);
    return unsubscribe;
  }

  // Listen to applications for a specific user
  listenToUserApplications(userId: string, callback: (applications: Application[]) => void): Unsubscribe {
    const applicationsRef = collection(db, 'applications');
    const q = query(
      applicationsRef, 
      where('userId', '==', userId), // Use userId field instead of userEmail
      orderBy('status', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const applications = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as Application) 
      } as Application));
      callback(applications);
    }, (error) => {
      console.error('Error listening to user applications:', error);
    });

    this.unsubscribers.set(`applications_${userId}`, unsubscribe);
    return unsubscribe;
  }

  // Listen to all applications (admin only)
  listenToAllApplications(callback: (applications: Application[]) => void): Unsubscribe {
    const applicationsRef = collection(db, 'applications');
    const q = query(applicationsRef, orderBy('status', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const applications = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as Application) 
      } as Application));
      callback(applications);
    }, (error) => {
      console.error('Error listening to all applications:', error);
    });

    this.unsubscribers.set('allApplications', unsubscribe);
    return unsubscribe;
  }

  // Listen to all users (admin only)
  listenToAllUsers(callback: (users: User[]) => void): Unsubscribe {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as User) 
      } as User));
      callback(users);
    }, (error) => {
      console.error('Error listening to all users:', error);
    });

    this.unsubscribers.set('allUsers', unsubscribe);
    return unsubscribe;
  }
}

// Create a singleton instance
export const realtimeDataService = new RealtimeDataService();

// Helper function to set up all real-time listeners for the app
export const setupRealtimeListeners = (
  callbacks: {
    onEventsUpdate?: (events: Event[]) => void;
    onClubsUpdate?: (clubs: Club[]) => void;
    onLeadershipUpdate?: (leadership: LeadershipMember[]) => void;
    onAnnualEventsUpdate?: (annualEvents: AnnualEvent[]) => void;
    onNewsUpdate?: (news: NewsArticle[]) => void;
    onExternalEventsUpdate?: (externalEvents: ExternalEvent[]) => void;
    onNotificationsUpdate?: (notifications: Notification[]) => void;
    onApplicationsUpdate?: (applications: Application[]) => void;
    onUsersUpdate?: (users: User[]) => void;
  },
  userId?: string,
  isAdmin: boolean = false
): () => void => {
  const unsubscribers: Unsubscribe[] = [];

  // Set up all listeners
  if (callbacks.onEventsUpdate) {
    unsubscribers.push(realtimeDataService.listenToEvents(callbacks.onEventsUpdate));
  }

  if (callbacks.onClubsUpdate) {
    unsubscribers.push(realtimeDataService.listenToClubs(callbacks.onClubsUpdate));
  }

  if (callbacks.onLeadershipUpdate) {
    unsubscribers.push(realtimeDataService.listenToLeadership(callbacks.onLeadershipUpdate));
  }

  if (callbacks.onAnnualEventsUpdate) {
    unsubscribers.push(realtimeDataService.listenToAnnualEvents(callbacks.onAnnualEventsUpdate));
  }

  if (callbacks.onNewsUpdate) {
    unsubscribers.push(realtimeDataService.listenToNews(callbacks.onNewsUpdate));
  }

  if (callbacks.onExternalEventsUpdate) {
    unsubscribers.push(realtimeDataService.listenToExternalEvents(callbacks.onExternalEventsUpdate));
  }

  if (callbacks.onNotificationsUpdate && userId) {
    unsubscribers.push(realtimeDataService.listenToUserNotifications(userId, callbacks.onNotificationsUpdate));
  }

  if (callbacks.onApplicationsUpdate && userId) {
    unsubscribers.push(realtimeDataService.listenToUserApplications(userId, callbacks.onApplicationsUpdate));
  }

  if (callbacks.onUsersUpdate && isAdmin) {
    unsubscribers.push(realtimeDataService.listenToAllUsers(callbacks.onUsersUpdate));
  }

  // Return cleanup function
  return () => {
    unsubscribers.forEach(unsubscribe => unsubscribe());
  };
};
