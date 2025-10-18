import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  getDoc,
  writeBatch,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User, Event } from '../types';

export interface OptimizedRegistrationService {
  // Register user for an event (atomic updates)
  registerUserForEvent: (userId: string, eventId: string, eventClubId: string) => Promise<void>;
  
  // Unregister user from an event (atomic updates)
  unregisterUserFromEvent: (userId: string, eventId: string, eventClubId: string) => Promise<void>;
  
  // Check if user is registered for an event (single read)
  isUserRegistered: (userId: string, eventId: string) => Promise<boolean>;
  
  // Get user's registered events (single read + efficient query)
  getUserRegisteredEvents: (userId: string, allEvents: Event[]) => Promise<Event[]>;
  
  // Get event registration count (single read)
  getEventRegistrationCount: (eventId: string, eventClubId: string) => Promise<number>;
  
  // Clean up when event is deleted
  cleanupEventDeletion: (eventId: string, eventClubId: string) => Promise<void>;
  
  // Clean up when user is deleted
  cleanupUserDeletion: (userId: string) => Promise<void>;
}

export const optimizedRegistrationService: OptimizedRegistrationService = {
  // Register user for an event with atomic updates
  registerUserForEvent: async (userId: string, eventId: string, eventClubId: string) => {
    try {
      const batch = writeBatch(db);
      
      // Add eventId to user's registeredEvents array
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        registeredEvents: arrayUnion(eventId)
      });
      
      // Add userId to event's registeredUsers array
      const eventRef = doc(db, 'events', eventClubId, 'clubEvents', eventId);
      batch.update(eventRef, {
        registeredUsers: arrayUnion(userId)
      });
      
      // Commit both updates atomically
      await batch.commit();
      
      console.log(`✅ User ${userId} registered for event ${eventId}`);
    } catch (error) {
      console.error('Error registering user for event:', error);
      throw error;
    }
  },

  // Unregister user from an event with atomic updates
  unregisterUserFromEvent: async (userId: string, eventId: string, eventClubId: string) => {
    try {
      const batch = writeBatch(db);
      
      // Remove eventId from user's registeredEvents array
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        registeredEvents: arrayRemove(eventId)
      });
      
      // Remove userId from event's registeredUsers array
      const eventRef = doc(db, 'events', eventClubId, 'clubEvents', eventId);
      batch.update(eventRef, {
        registeredUsers: arrayRemove(userId)
      });
      
      // Commit both updates atomically
      await batch.commit();
      
      console.log(`✅ User ${userId} unregistered from event ${eventId}`);
    } catch (error) {
      console.error('Error unregistering user from event:', error);
      throw error;
    }
  },

  // Check if user is registered for an event (single read)
  isUserRegistered: async (userId: string, eventId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return false;
      }
      
      const userData = userSnap.data();
      const registeredEvents = userData.registeredEvents || [];
      
      return registeredEvents.includes(eventId);
    } catch (error) {
      console.error('Error checking user registration:', error);
      return false;
    }
  },

  // Get user's registered events (single read + efficient query)
  getUserRegisteredEvents: async (userId: string, allEvents: Event[]) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return [];
      }
      
      const userData = userSnap.data();
      const registeredEventIds = userData.registeredEvents || [];
      
      // Filter events based on registered event IDs
      return allEvents.filter(event => registeredEventIds.includes(event.id));
    } catch (error) {
      console.error('Error getting user registered events:', error);
      return [];
    }
  },

  // Get event registration count (single read)
  getEventRegistrationCount: async (eventId: string, eventClubId: string) => {
    try {
      const eventRef = doc(db, 'events', eventClubId, 'clubEvents', eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (!eventSnap.exists()) {
        return 0;
      }
      
      const eventData = eventSnap.data();
      const registeredUsers = eventData.registeredUsers || [];
      
      return registeredUsers.length;
    } catch (error) {
      console.error('Error getting event registration count:', error);
      return 0;
    }
  },

  // Clean up when event is deleted
  cleanupEventDeletion: async (eventId: string, eventClubId: string) => {
    try {
      // Get all users who were registered for this event
      const eventRef = doc(db, 'events', eventClubId, 'clubEvents', eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (!eventSnap.exists()) {
        return;
      }
      
      const eventData = eventSnap.data();
      const registeredUsers = eventData.registeredUsers || [];
      
      if (registeredUsers.length === 0) {
        return;
      }
      
      // Remove eventId from all registered users
      const batch = writeBatch(db);
      
      for (const userId of registeredUsers) {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          registeredEvents: arrayRemove(eventId)
        });
      }
      
      await batch.commit();
      console.log(`✅ Cleaned up event ${eventId} from ${registeredUsers.length} users`);
    } catch (error) {
      console.error('Error cleaning up event deletion:', error);
    }
  },

  // Clean up when user is deleted
  cleanupUserDeletion: async (userId: string) => {
    try {
      // Get user's registered events
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return;
      }
      
      const userData = userSnap.data();
      const registeredEvents = userData.registeredEvents || [];
      
      if (registeredEvents.length === 0) {
        return;
      }
      
      // Remove userId from all registered events
      // We need to find the clubId for each event, so we'll query all events
      const eventsRef = collection(db, 'events');
      const eventsSnapshot = await getDocs(eventsRef);
      
      const batch = writeBatch(db);
      
      for (const clubDoc of eventsSnapshot.docs) {
        const clubId = clubDoc.id;
        const clubEventsRef = collection(db, 'events', clubId, 'clubEvents');
        const clubEventsSnapshot = await getDocs(clubEventsRef);
        
        for (const eventDoc of clubEventsSnapshot.docs) {
          if (registeredEvents.includes(eventDoc.id)) {
            const eventRef = doc(db, 'events', clubId, 'clubEvents', eventDoc.id);
            batch.update(eventRef, {
              registeredUsers: arrayRemove(userId)
            });
          }
        }
      }
      
      await batch.commit();
      console.log(`✅ Cleaned up user ${userId} from ${registeredEvents.length} events`);
    } catch (error) {
      console.error('Error cleaning up user deletion:', error);
    }
  }
};
