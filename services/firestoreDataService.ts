import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where,
  onSnapshot,
  Unsubscribe,
  doc,
  updateDoc,
  getDoc,
  collectionGroup
} from 'firebase/firestore';
import { userProfileService } from './firebaseAuthService';
import { ClubTeamMember } from '../types';
import { db } from '../../frontend/firebaseConfig';
import { 
  EVENTS, 
  CLUBS, 
  MOCK_USERS, 
  LEADERSHIP, 
  ANNUAL_EVENTS, 
  NEWS, 
  EXTERNAL_EVENTS, 
  NOTIFICATIONS, 
  APPLICATIONS 
} from '../constants';
import { Event, Club, User, LeadershipMember, AnnualEvent, NewsArticle, ExternalEvent, Notification, Application, EventStatus } from '../types';
import { removeUndefinedValues } from '../utils/firestoreUtils';

// Collection names
const COLLECTIONS = {
  EVENTS: 'events',
  CLUBS: 'clubs',
  USERS: 'users',
  LEADERSHIP: 'leadership',
  ANNUAL_EVENTS: 'annualEvents',
  NEWS: 'news',
  EXTERNAL_EVENTS: 'externalEvents',
  NOTIFICATIONS: 'notifications',
  APPLICATIONS: 'applications'
} as const;

// Data Migration Service
export const dataMigrationService = {
  // Migrate all data from constants to Firestore
  migrateAllData: async (): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('Starting data migration...');
      
      // Migrate each collection
      await Promise.all([
        migrateEvents(),
        migrateClubs(),
        migrateUsers(),
        migrateLeadership(),
        migrateAnnualEvents(),
        migrateNews(),
        migrateExternalEvents(),
        migrateNotifications(),
        migrateApplications()
      ]);
      
      console.log('Data migration completed successfully!');
      return { success: true, message: 'All data migrated successfully!' };
    } catch (error) {
      console.error('Data migration failed:', error);
      return { success: false, message: `Migration failed: ${error}` };
    }
  },

  // Check if data already exists
  checkDataExists: async (): Promise<{ [key: string]: boolean }> => {
    const results: { [key: string]: boolean } = {};
    
    for (const [key, collectionName] of Object.entries(COLLECTIONS)) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        results[key] = snapshot.size > 0;
      } catch (error) {
        results[key] = false;
      }
    }
    
    return results;
  }
};

// Individual migration functions
const migrateEvents = async (): Promise<void> => {
  const eventsRef = collection(db, COLLECTIONS.EVENTS);
  
  for (const event of EVENTS) {
    try {
      const cleanedEvent = removeUndefinedValues(event);
      await addDoc(eventsRef, cleanedEvent);
    } catch (error) {
      console.error(`Error migrating event ${event.id}:`, error);
    }
  }
};

const migrateClubs = async (): Promise<void> => {
  const clubsRef = collection(db, COLLECTIONS.CLUBS);
  
  for (const club of CLUBS) {
    try {
      const cleanedClub = removeUndefinedValues(club);
      await addDoc(clubsRef, cleanedClub);
    } catch (error) {
      console.error(`Error migrating club ${club.id}:`, error);
    }
  }
};

const migrateUsers = async (): Promise<void> => {
  const usersRef = collection(db, COLLECTIONS.USERS);
  
  for (const user of MOCK_USERS) {
    try {
      const cleanedUser = removeUndefinedValues(user);
      await addDoc(usersRef, cleanedUser);
    } catch (error) {
      console.error(`Error migrating user ${user.id}:`, error);
    }
  }
};

const migrateLeadership = async (): Promise<void> => {
  const leadershipRef = collection(db, COLLECTIONS.LEADERSHIP);
  
  for (const member of LEADERSHIP) {
    try {
      const cleanedMember = removeUndefinedValues(member);
      await addDoc(leadershipRef, cleanedMember);
    } catch (error) {
      console.error(`Error migrating leadership member ${member.id}:`, error);
    }
  }
};

const migrateAnnualEvents = async (): Promise<void> => {
  const annualEventsRef = collection(db, COLLECTIONS.ANNUAL_EVENTS);
  
  for (const event of ANNUAL_EVENTS) {
    try {
      const cleanedEvent = removeUndefinedValues(event);
      await addDoc(annualEventsRef, cleanedEvent);
    } catch (error) {
      console.error(`Error migrating annual event ${event.id}:`, error);
    }
  }
};

const migrateNews = async (): Promise<void> => {
  const newsRef = collection(db, COLLECTIONS.NEWS);
  
  for (const article of NEWS) {
    try {
      const cleanedArticle = removeUndefinedValues(article);
      await addDoc(newsRef, cleanedArticle);
    } catch (error) {
      console.error(`Error migrating news article ${article.id}:`, error);
    }
  }
};

const migrateExternalEvents = async (): Promise<void> => {
  const externalEventsRef = collection(db, COLLECTIONS.EXTERNAL_EVENTS);
  
  for (const event of EXTERNAL_EVENTS) {
    try {
      const cleanedEvent = removeUndefinedValues(event);
      await addDoc(externalEventsRef, cleanedEvent);
    } catch (error) {
      console.error(`Error migrating external event ${event.id}:`, error);
    }
  }
};

const migrateNotifications = async (): Promise<void> => {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  
  for (const notification of NOTIFICATIONS) {
    try {
      const cleanedNotification = removeUndefinedValues(notification);
      await addDoc(notificationsRef, cleanedNotification);
    } catch (error) {
      console.error(`Error migrating notification ${notification.id}:`, error);
    }
  }
};

const migrateApplications = async (): Promise<void> => {
  const applicationsRef = collection(db, COLLECTIONS.APPLICATIONS);
  
  for (const application of APPLICATIONS) {
    try {
      const cleanedApplication = removeUndefinedValues(application);
      await addDoc(applicationsRef, cleanedApplication);
    } catch (error) {
      console.error(`Error migrating application ${application.id}:`, error);
    }
  }
};

// Real-time Data Service
export const firestoreDataService = {
  // Get all events
  // getting events
  getEvents: async (): Promise<Event[]> => {
    try {
      const eventsRef = collectionGroup(db, "clubEvents");
      const snapshot = await getDocs(eventsRef);
  
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          organizerClubId: data.organizerClubId || doc.ref.parent.parent?.id, // ✅ ensure clubId is always present
        } as Event;
      });
  
      // console.log("🔥 Events fetched:", events);
      return events;
    } catch (error) {
      console.error("Error getting events:", error);
      return [];
    }
  },
  getClubEvents: async (clubId: string): Promise<Event[]> => {
    try {
      const clubRef = doc(db, COLLECTIONS.CLUBS, clubId);
      const clubEventsRef = collection(clubRef, 'clubEvents');
      const snapshot = await getDocs(clubEventsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error) {
      console.error('Error getting club events:', error);
      return [];
    }
  },

  // Get all clubs
  getClubs: async (): Promise<Club[]> => {
    try {
      const clubsRef = collection(db, COLLECTIONS.CLUBS);
      const snapshot = await getDocs(clubsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
    } catch (error) {
      console.error('Error getting clubs:', error);
      return [];
    }
  },

  // Get all users
  getUsers: async (): Promise<User[]> => {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const snapshot = await getDocs(usersRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },
  getStudentByRollNumber: async (rollNumber: string): Promise<User | null> => {
    const users = await firestoreDataService.getUsers();
    const student = users.find(u => u.rollNumber?.toLowerCase() === rollNumber.toLowerCase());
    return student || null;
  },

  // Get leadership
  getLeadership: async (): Promise<LeadershipMember[]> => {
    try {
      const leadershipRef = collection(db, COLLECTIONS.LEADERSHIP);
      const snapshot = await getDocs(leadershipRef);
      return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as LeadershipMember));
    } catch (error) {
      console.error('Error getting leadership:', error);
      return [];
    }
  },

  // Get annual events
  getAnnualEvents: async (): Promise<AnnualEvent[]> => {
    try {
      const annualEventsRef = collection(db, COLLECTIONS.ANNUAL_EVENTS);
      const snapshot = await getDocs(annualEventsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnnualEvent));
    } catch (error) {
      console.error('Error getting annual events:', error);
      return [];
    }
  },

  // Get news
  getNews: async (): Promise<NewsArticle[]> => {
    try {
      const newsRef = collection(db, COLLECTIONS.NEWS);
      const snapshot = await getDocs(newsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsArticle));
    } catch (error) {
      console.error('Error getting news:', error);
      return [];
    }
  },

  // Get external events
  getExternalEvents: async (): Promise<ExternalEvent[]> => {
    try {
      const externalEventsRef = collection(db, COLLECTIONS.EXTERNAL_EVENTS);
      const snapshot = await getDocs(externalEventsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExternalEvent));
    } catch (error) {
      console.error('Error getting external events:', error);
      return [];
    }
  },

  // Get notifications
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      const snapshot = await getDocs(notificationsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  },

  // Get applications
  getApplications: async (): Promise<Application[]> => {
    try {
      const applicationsRef = collection(db, COLLECTIONS.APPLICATIONS);
      const snapshot = await getDocs(applicationsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
    } catch (error) {
      console.error('Error getting applications:', error);
      return [];
    }
  },

  // Create a new application
  createApplication: async (application: Omit<Application, 'id'>): Promise<Application> => {
    try {
      // Backward-compatible top-level storage (kept if needed elsewhere)
      const applicationsRef = collection(db, COLLECTIONS.APPLICATIONS);
      const docRef = await addDoc(applicationsRef, application);
      return { id: docRef.id, ...application } as Application;
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  },

  // Store application under the specific club's subcollection
  createClubApplication: async (clubId: string, application: Omit<Application, 'id' | 'clubId'>): Promise<Application> => {
    try {
      const clubRef = doc(db, COLLECTIONS.CLUBS, clubId);
      const clubAppsRef = collection(clubRef, 'applications');
      const payload = { ...application, clubId } as Omit<Application, 'id'>;
      const docRef = await addDoc(clubAppsRef, payload);
      return { id: docRef.id, ...payload } as Application;
    } catch (error) {
      console.error('Error creating club application:', error);
      throw error;
    }
  },

  // Read applications for a specific club from subcollection
  getClubApplications: async (clubId: string): Promise<Application[]> => {
    try {
      // Try fetching from /clubs/{clubId}/applications subcollection
      const clubRef = doc(db, COLLECTIONS.CLUBS, clubId);
      const clubAppsRef = collection(clubRef, 'applications');
      const snapshot = await getDocs(clubAppsRef);
      if (snapshot.size > 0) {
        console.log(`Fetched ${snapshot.size} applications for club ${clubId} (subcollection)`);
        return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Application));
      }
      // Fallback: Try fetching from top-level /applications collection and filter by clubId
      const applicationsRef = collection(db, COLLECTIONS.APPLICATIONS);
      const allAppsSnap = await getDocs(applicationsRef);
      // Defensive: clubId may be string or number, always compare as string
      const filteredApps = allAppsSnap.docs
        .map(d => ({ id: d.id, ...(d.data() as any) } as Application))
        .filter(app => String(app.clubId) === String(clubId));
      console.log(`Fetched ${filteredApps.length} applications for club ${clubId} (top-level fallback)`);
      // Debug: log all clubIds found
      if (filteredApps.length === 0) {
        const allClubIds = allAppsSnap.docs.map(d => d.data().clubId);
        console.log('All clubIds in top-level applications:', allClubIds);
      }
      return filteredApps;
    } catch (error) {
      console.error('Error getting club applications:', error);
      return [];
    }
  },

  // Update club details (members and settings)
  updateClub: async (clubId: string, updates: Partial<Club>): Promise<void> => {
    const clubRef = doc(db, 'clubs', clubId);

    // --- FIX: Always include the full team array in the update ---
    // If updates.team is missing, fetch current team and include it
    console.log("hitted")
    console.log(updates)
    let teamToUpdate = updates.team;
    if (!teamToUpdate) {
      const clubSnap = await getDoc(clubRef);
      if (clubSnap.exists()) {
        const clubData = clubSnap.data() as any;
        teamToUpdate = clubData.team || [];
      } else {
        teamToUpdate = [];
      }
    }

    // Clean undefined/null values from updates and nested arrays (e.g., team)
    const cleanedUpdates = removeUndefinedValues(updates);

    // Always use the correct team array
    cleanedUpdates.team = Array.isArray(teamToUpdate)
      ? teamToUpdate
          .filter(member => !!member && typeof member === 'object')
          .map(member => {
            const cleanedMember: any = {};
            for (const key in member) {
              const value = member[key];
              if (
                value !== undefined &&
                value !== null &&
                !(typeof value === 'string' && value.trim() === '')
              ) {
                cleanedMember[key] = value;
              }
            }
            return cleanedMember;
          })
          .filter(member => Object.keys(member).length > 0)
      : [];

    // Remove any keys from cleanedUpdates that are undefined after cleaning
    Object.keys(cleanedUpdates).forEach(key => {
      if (cleanedUpdates[key] === undefined) {
        delete cleanedUpdates[key];
      }
    });

    // Defensive: If team is present and is empty, set to [] (Firestore does not allow undefined)
    if ('team' in cleanedUpdates && !Array.isArray(cleanedUpdates.team)) {
      cleanedUpdates.team = [];
    }

    // --- CRITICAL: Actually update the club document with the full team array ---
    // Ensure all team members have required fields and no undefined/null values
    interface CleanedTeamMember {
      id: string;
      name: string;
      position: string;
      [key: string]: any;
    }

    cleanedUpdates.team = (cleanedUpdates.team as Array<Record<string, any>>).map((member: Record<string, any>): CleanedTeamMember => {
      const cleanedMember: CleanedTeamMember = {} as CleanedTeamMember;
      for (const key in member) {
        const value = member[key];
        if (
          value !== undefined &&
          value !== null &&
          !(typeof value === 'string' && value.trim() === '')
        ) {
          cleanedMember[key] = value;
        }
      }
      // Defensive: Ensure id, name, and position are present
      if (!cleanedMember.id || !cleanedMember.name || !cleanedMember.position) {
        throw new Error('Each team member must have id, name, and position');
      }
      return cleanedMember;
    });

    await updateDoc(clubRef, cleanedUpdates);

    // --- Update each user's managedClubIds and role if they are in the team ---
    if (cleanedUpdates.team && Array.isArray(cleanedUpdates.team)) {
      for (const member of cleanedUpdates.team) {
        if (member.id) {
          try {
            const userRef = doc(db, 'users', member.id);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data() as any;
              const managedClubIds = Array.isArray(userData.managedClubIds)
                ? Array.from(new Set([...(userData.managedClubIds || []), clubId]))
                : [clubId];
              const newRole = userData.role === 'admin' ? 'admin' : 'contributor';
              const updatePayload: any = {
                managedClubIds,
                role: newRole,
                name: member.name,
                // Do NOT store position in user profile
              };
              // Ensure position is not present in user profile
              if ('position' in updatePayload) {
                delete updatePayload.position;
              }
              await updateDoc(userRef, updatePayload);
            }
          } catch (err) {
            // Ignore errors for now
          }
        }
      }
    }
  },

  // Add this helper for explicit member profile update (can be called from frontend if needed)
  updateClubMemberProfile: async (userId: string, updates: Partial<User>) => {
    const userRef = doc(db, 'users', userId);

    // If managedClubIds is present in updates, remove any null/undefined/empty values
    if (updates.managedClubIds) {
      updates.managedClubIds = (updates.managedClubIds as string[]).filter(
        id => typeof id === 'string' && id.trim() !== ''
      );
    }

    // Defensive: If managedClubIds becomes empty, set role to 'student'
    if (
      Array.isArray(updates.managedClubIds) &&
      updates.managedClubIds.length === 0
    ) {
      updates.role = 'student';
    }

    // Ensure position is not present in user profile updates
    if ('position' in updates) {
      delete updates.position;
    }

    await updateDoc(userRef, updates);
  },

  // Create a new event under a club
  createClubEvent: async (clubId: string, event: Omit<Event, 'id' | 'status'>): Promise<Event> => {
    // Set status based on event date
    const status = getEventStatusByDate(event.date);
    const payload = { ...event, status, organizerClubId: clubId };
    const clubRef = doc(db, 'clubs', clubId);
    const clubEventsRef = collection(clubRef, 'clubEvents');
    const docRef = await addDoc(clubEventsRef, payload);
    return { id: docRef.id, ...payload } as Event;
  },

  getClubById: async (clubId: string): Promise<Club | null> => {
    try {
      const clubRef = doc(db, COLLECTIONS.CLUBS, clubId);
      const clubSnap = await getDoc(clubRef);
      if (clubSnap.exists()) {
        return { id: clubSnap.id, ...clubSnap.data() } as Club;
      } else {
        console.warn(`Club with ID ${clubId} not found.`);
        return null;
      }
    } catch (error) {
      console.error('Error getting club by ID:', error);
      return null;
    }
  },

  // Update event (including marking as past and adding winner/images)
  updateClubEvent: async (
    clubId: string,
    eventId: string,
    updates: Partial<Event> & { markAsPast?: boolean; winnerDetails?: string; eventImages?: string[] }
  ): Promise<void> => {
    // Correct Firestore path for club event:
    // /events/{clubId}/clubEvents/{eventId}
    const eventRef = doc(db, 'events', clubId, 'clubEvents', eventId);

    const updatePayload: any = { ...updates };
    if (updates.markAsPast) {
      updatePayload.status = EventStatus.Past;
    }
    if (updates.winnerDetails) {
      updatePayload.winnerDetails = updates.winnerDetails;
    }
    if (updates.eventImages) {
      updatePayload.eventImages = updates.eventImages;
    }
    delete updatePayload.markAsPast;

    await updateDoc(eventRef, updatePayload);
  },
};

// Application mutations under club
export const clubApplicationsService = {
  updateStatus: async (
    clubId: string,
    applicationId: string,
    status: 'accepted' | 'rejected'
  ): Promise<void> => {
    const appRef = doc(db, 'clubs', clubId, 'applications', applicationId);
    const payload = cleanPayload({ status });
    console.log('Updating application status:', appRef.path, payload);
    await updateDoc(appRef, payload);
  },

  acceptAndPromote: async (
    clubId: string,
    applicationId: string
  ): Promise<void> => {
    const appRef = doc(db, 'clubs', clubId, 'applications', applicationId);
    const appSnap = await getDoc(appRef);
    if (!appSnap.exists()) throw new Error('Application not found');
    const app = appSnap.data() as any;
    const userId: string | undefined = app.userId;
    const userName: string = app.userName;

    // 1) Update application status
    const statusPayload = cleanPayload({ status: 'accepted' });
    console.log('Accepting application:', appRef.path, statusPayload);
    await updateDoc(appRef, statusPayload);

    // 2) Add to club team if not already present
    const clubRef = doc(db, 'clubs', clubId);
    const clubSnap = await getDoc(clubRef);
    if (clubSnap.exists()) {
      const clubData = clubSnap.data() as any;
      console.log('Club data before team update:', clubData);
      const team: ClubTeamMember[] = Array.isArray(clubData.team) ? clubData.team : [];
      const exists = team.some(m => m.id === userId);
      if (!exists) {
        const newMember: ClubTeamMember = { id: userId || userName, name: userName, position: 'Coordinator' };
        const updatedTeam = [...team, newMember];
        if (updatedTeam.length > 0) {
          const teamPayload = cleanPayload({ team: updatedTeam });
          console.log('Promoting user to club team:', clubRef.path, teamPayload);
          await updateDoc(clubRef, teamPayload);
        } else {
          console.warn('Skipped team update: team array would be empty');
        }
      }
    }

    // 3) Promote user to contributor for this club
    if (userId) {
      const profile = await userProfileService.getUserProfile(userId);
      if (profile) {
        const managed = Array.from(new Set([...(profile.managedClubIds || []), clubId]));
        const profilePayload = cleanPayload({
          role: profile.role === 'admin' ? 'admin' : 'contributor',
          managedClubIds: managed
        });
        console.log('Promoting user profile:', userId, profilePayload);
        await userProfileService.updateUserProfile(userId, profilePayload);
      }
    }
  }
};  

// Real-time listeners (for future use)
export const realtimeDataService = {
  // Listen to events changes
  listenToEvents: (callback: (events: Event[]) => void): Unsubscribe => {
    const eventsRef = collection(db, COLLECTIONS.EVENTS);
    return onSnapshot(eventsRef, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      callback(events);
    });
  },

  // Listen to clubs changes
  listenToClubs: (callback: (clubs: Club[]) => void): Unsubscribe => {
    const clubsRef = collection(db, COLLECTIONS.CLUBS);
    return onSnapshot(clubsRef, (snapshot) => {
      const clubs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
      callback(clubs);
    });
  },

  // Listen to notifications for a specific user
  listenToUserNotifications: (userId: string, callback: (notifications: Notification[]) => void): Unsubscribe => {
    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    const q = query(notificationsRef, where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      callback(notifications);
    });
  }
};

function cleanPayload(payload: any) {
  const cleaned: any = {};
  for (const key in payload) {
    if (payload[key] !== undefined && payload[key] !== null) {
      cleaned[key] = payload[key];
    }
  }
  return cleaned;
}

// Utility to determine event status based on date
function getEventStatusByDate(eventDate: string): EventStatus {
  const now = new Date();
  const date = new Date(eventDate);
  if (date > now) return EventStatus.Upcoming;
  if (date.toDateString() === now.toDateString()) return EventStatus.Ongoing;
  return EventStatus.Past;
}
