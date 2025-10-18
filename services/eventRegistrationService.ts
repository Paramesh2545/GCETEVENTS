import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  orderBy,
  setDoc,
  getDoc,
  getCountFromServer
} from 'firebase/firestore';
import { auth } from '../../frontend/firebaseConfig';
import { db } from '../../frontend/firebaseConfig';
import { User } from '../types';

export interface EventRegistration {
  id?: string;
  eventId: string;
  clubId?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  userRollNumber?: string;
  userBranch?: string;
  userYear?: string;
  registrationDate: any; // Firestore timestamp
  status: 'pending' | 'confirmed' | 'cancelled';
  additionalInfo?: string;
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  registrationFee?: number;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  paymentId?: string;
  qrCode?: string;
  checkInTime?: any; // Firestore timestamp
  checkInStatus?: 'not_checked_in' | 'checked_in';
  isGuest?: boolean; // For guest registrations
  guestCollege?: string; // For guest college information
  expiresAt?: Date; // For guest registration cleanup
}

export interface RegistrationStats {
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  cancelledRegistrations: number;
  checkedInCount: number;
}

export interface EventPaymentRecord {
  id?: string;
  registrationId: string;
  eventId: string;
  clubId: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  paymentId: string;
  paymentStatus: 'paid';
  paymentMethod?: string;
  transactionId?: string;
  timestamp: any; // Firestore timestamp
}

// Add new interface for Team
export interface EventTeam {
  id?: string;
  name: string;
  eventId: string;
  clubId: string;
  members: { userId: string; userName: string; userEmail: string }[];
  createdBy: string; // userId of creator
  createdAt: any; // Firestore timestamp
}

// Helper function to get the correct user ID for registration checking
const getCorrectUserId = (user: User): string => {
  // For guest users, use their ID directly; for authenticated users, use auth.currentUser.uid
  return user.isGuest ? user.id : (auth.currentUser?.uid || user.id);
};

export const eventRegistrationService = {
  // Register for an event (only for free events, paid events handled after payment)
  registerForEvent: async (
    eventId: string,
    user: User,
    eventInfo: { name: string; date: string; location: string; registrationFee?: number; organizerClubId: string },
    additionalInfo?: string
  ): Promise<string> => {
    const clubId = eventInfo.organizerClubId;
    const requiresPayment = eventInfo.registrationFee && eventInfo.registrationFee > 0;

    if (requiresPayment) {
      // For paid events, do not create registration here
      throw new Error('Registration for paid events should be created after payment is successful.');
    }

    // For free events, create registration immediately
    // Ensure we have a valid user ID - use same logic as paid events
    if (!user.id) {
      throw new Error('User ID is required for registration');
    }
    
    // For guest users, use their ID directly; for authenticated users, use auth.currentUser.uid
    const userId = user.isGuest ? user.id : (auth.currentUser?.uid || user.id);
    
    const registrationData: any = {
      eventId,
      clubId,
      userId: userId, // Use the appropriate user ID
      userName: user.name,
      userEmail: user.email ?? '',
      userPhone: user.mobile,
      status: 'confirmed',
      additionalInfo: additionalInfo || '',
      registrationDate: serverTimestamp(),
      eventName: eventInfo.name,
      eventDate: eventInfo.date,
      eventLocation: eventInfo.location,
      registrationFee: eventInfo.registrationFee || 0,
      checkInStatus: 'not_checked_in',
      isGuest: user.isGuest || false, // Add isGuest field for consistency
    };

    // Only add guestCollege if user is a guest and has college name
    if (user.isGuest && user.collegeName) {
      registrationData.guestCollege = user.collegeName;
    }

    console.log('Creating registration with data:', registrationData);
    console.log('User ID:', registrationData.userId);
    console.log('Auth UID:', auth.currentUser?.uid);
    console.log('User object:', user);
    console.log('Is guest user?', user.isGuest);
    
    // For guest users, use guestRegistrations collection; for regular users, use registrations collection
    let registrationsRef;
    if (user.isGuest) {
      registrationsRef = collection(db, 'events', clubId, 'clubEvents', eventId, 'guestRegistrations');
    } else {
      registrationsRef = collection(db, 'events', clubId, 'clubEvents', eventId, 'registrations');
    }
    
    console.log('Creating registration in collection:', registrationsRef.path);
    console.log('Registration data being stored:', registrationData);
    const docRef = await addDoc(registrationsRef, registrationData);
    console.log('Registration created successfully with ID:', docRef.id);
    return docRef.id;
  },

  // Register for a paid event (called after payment is successful)
  registerForPaidEvent: async (
    eventId: string,
    user: User,
    eventInfo: { name: string; date: string; location: string; registrationFee?: number; organizerClubId: string },
    paymentId: string,
    additionalInfo?: string
  ): Promise<string> => {
    const clubId = eventInfo.organizerClubId;
    
    // Ensure we have a valid user ID
    if (!user.id) {
      throw new Error('User ID is required for registration');
    }
    
    // For consistency, always use user.id (which should be the same as auth.currentUser.uid for regular users)
    const userId = user.id;
    
    const registrationData: any = {
      eventId,
      clubId,
      userId: userId, // Use the appropriate user ID
      userName: user.name,
      userEmail: user.email ?? '',
      userPhone: user.mobile,
      status: 'confirmed',
      additionalInfo: additionalInfo || '',
      registrationDate: serverTimestamp(),
      eventName: eventInfo.name,
      eventDate: eventInfo.date,
      eventLocation: eventInfo.location,
      registrationFee: eventInfo.registrationFee || 0,
      paymentStatus: 'paid',
      paymentId,
      checkInStatus: 'not_checked_in',
      isGuest: user.isGuest || false, // Add isGuest field for Firestore rules
    };

    // Only add guestCollege if user is a guest and has college name
    if (user.isGuest && user.collegeName) {
      registrationData.guestCollege = user.collegeName;
    }

    console.log('Creating registration with data:', registrationData);
    console.log('User ID:', registrationData.userId);
    console.log('Auth UID:', auth.currentUser?.uid);
    console.log('User object:', user);
    console.log('Is guest user?', user.isGuest);
    
    // For guest users, use guestRegistrations collection; for regular users, use registrations collection
    let registrationsRef;
    if (user.isGuest) {
      registrationsRef = collection(db, 'events', clubId, 'clubEvents', eventId, 'guestRegistrations');
    } else {
      registrationsRef = collection(db, 'events', clubId, 'clubEvents', eventId, 'registrations');
    }
    
    console.log('Creating registration in collection:', registrationsRef.path);
    console.log('Registration data being stored:', registrationData);
    const docRef = await addDoc(registrationsRef, registrationData);
    console.log('Registration created successfully with ID:', docRef.id);
    return docRef.id;
  },

  // Check if user is already registered for an event
  isUserRegistered: async (eventId: string, userId: string, clubId?: string): Promise<boolean> => {
    if (!clubId || !eventId || !userId) return false;
    try {
      const isGuest = userId.startsWith('guest_');
      console.log('isUserRegistered:', { eventId, userId, clubId, isGuest });
      let activeRegistrations: any[] = [];
      
      if (isGuest) {
        // Check guest registrations collection
        const guestRegistrationsRef = query(
          collection(db, 'events', clubId, 'clubEvents', eventId, 'guestRegistrations'),
          where('userId', '==', userId)
        );
        console.log('Querying guest registrations for userId:', userId);
        const guestQuerySnapshot = await getDocs(guestRegistrationsRef);
        console.log('Guest registrations found:', guestQuerySnapshot.docs.length);
        activeRegistrations = guestQuerySnapshot.docs.filter(doc => {
          const data = doc.data();
          console.log('Guest registration data:', { id: doc.id, userId: data.userId, status: data.status });
          return data.status !== 'cancelled';
        });
      } else {
        // Check regular registrations collection
        const registrationsRef = query(
          collection(db, 'events', clubId, 'clubEvents', eventId, 'registrations'),
          where('userId', '==', userId)
        );
        console.log('Querying regular registrations for userId:', userId);
        const querySnapshot = await getDocs(registrationsRef);
        console.log('Regular registrations found:', querySnapshot.docs.length);
        activeRegistrations = querySnapshot.docs.filter(doc => {
          const data = doc.data();
          console.log('Regular registration data:', { id: doc.id, userId: data.userId, status: data.status });
          return data.status !== 'cancelled';
        });
      }
      console.log('Active registrations:', activeRegistrations.length);
      return activeRegistrations.length > 0;
    } catch (error) {
      console.error('Error checking user registration:', error, { eventId, userId, clubId });
      return false;
    }
  },

  // Check if user is already registered for an event (with User object)
  isUserRegisteredWithUser: async (eventId: string, user: User, clubId?: string): Promise<boolean> => {
    const correctUserId = getCorrectUserId(user);
    console.log('isUserRegisteredWithUser:', { eventId, user: user, correctUserId, clubId, isGuest: user.isGuest });
    const result = await eventRegistrationService.isUserRegistered(eventId, correctUserId, clubId);
    console.log('Registration check result:', result);
    return result;
  },

  /**
   * Get registrations for a user for a specific club and event.
   * @param userId - The user's UID
   * @param clubId - The club ID
   * @param eventId - The event ID
   */
  getUserRegistrations: async (
    userId: string,
    clubId: string,
    eventId: string
  ): Promise<EventRegistration[]> => {
    // Defensive: If any param is missing, log and return []
    if (!userId || !clubId || !eventId) {
      console.warn('getUserRegistrations called with missing params:', { userId, clubId, eventId });
      return [];
    }
    const registrations: EventRegistration[] = [];
    try {
      // Check if this is a guest user
      const isGuest = userId.startsWith('guest_');
      
      if (isGuest) {
        console.log(userId);
        // For guest users, check guestRegistrations collection
        console.log('Querying guest registrations for:', { userId, clubId, eventId });
        const guestRegsSnap = await getDocs(
          query(
            collection(db, 'events', clubId, 'clubEvents', eventId, 'guestRegistrations'),
            where('userId', '==', userId)
          )
        );
        console.log('Guest registrations query result:', guestRegsSnap.docs.length, 'documents found');
        for (const regDoc of guestRegsSnap.docs) {
          const regData = regDoc.data() as EventRegistration;
          console.log('Found guest registration:', { id: regDoc.id, userId: regData.userId, eventId: regData.eventId });
          registrations.push({ id: regDoc.id, ...regData });
        }
      } else {
        // For regular users, check regular registrations collection
        const regsSnap = await getDocs(
          query(
            collection(db, 'events', clubId, 'clubEvents', eventId, 'registrations'),
            where('userId', '==', userId)
          )
        );
        for (const regDoc of regsSnap.docs) {
          const regData = regDoc.data() as EventRegistration;
          registrations.push({ id: regDoc.id, ...regData });
        }
      }
      
      registrations.sort((a, b) => {
        if (a.registrationDate && b.registrationDate) {
          return (b.registrationDate.seconds || 0) - (a.registrationDate.seconds || 0);
        }
        return 0;
      });
      return registrations;
    } catch (error) {
      console.error('Error getting user registrations:', error, { userId, clubId, eventId });
      return [];
    }
  },

  // Get registrations for a specific event (both regular and guest registrations)
  getEventRegistrations: async (eventId: string, clubId: string): Promise<EventRegistration[]> => {
    const allRegistrations: EventRegistration[] = [];
    
    try {
      // Get regular registrations
      const registrationsRef = collection(db, 'events', clubId, 'clubEvents', eventId, 'registrations');
      const regularSnapshot = await getDocs(registrationsRef);
      regularSnapshot.docs.forEach(doc => {
        allRegistrations.push({ id: doc.id, ...doc.data() } as EventRegistration);
      });
      
      // Get guest registrations
      const guestRegistrationsRef = collection(db, 'events', clubId, 'clubEvents', eventId, 'guestRegistrations');
      const guestSnapshot = await getDocs(guestRegistrationsRef);
      guestSnapshot.docs.forEach(doc => {
        allRegistrations.push({ id: doc.id, ...doc.data() } as EventRegistration);
      });
      
      return allRegistrations;
    } catch (error) {
      console.error('Error getting event registrations:', error);
      return [];
    }
  },

  // Get registration statistics for an event
  getEventRegistrationStats: async (eventId: string, clubId: string): Promise<RegistrationStats> => {
    const registrations = await eventRegistrationService.getEventRegistrations(eventId, clubId);
    
    const stats: RegistrationStats = {
      totalRegistrations: registrations.length,
      confirmedRegistrations: registrations.filter(r => r.status === 'confirmed').length,
      pendingRegistrations: registrations.filter(r => r.status === 'pending').length,
      cancelledRegistrations: registrations.filter(r => r.status === 'cancelled').length,
      checkedInCount: registrations.filter(r => r.checkInStatus === 'checked_in').length
    };

    return stats;
  },

  // Get only registration count for event cards (lightweight, no guest registrations)
  getEventRegistrationCount: async (eventId: string, clubId: string): Promise<number> => {
    try {
      // Only get regular registrations count (no guest registrations for homepage)
      const registrationsRef = collection(db, 'events', clubId, 'clubEvents', eventId, 'registrations');
      const snapshot = await getCountFromServer(registrationsRef);
      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting registration count:', error);
      return 0;
    }
  },

  // Update registration status
  updateRegistrationStatus: async (registrationId: string, newStatus: 'pending' | 'confirmed' | 'cancelled', clubId: string, eventId: string) => {
    const registrationRef = doc(db, 'events', clubId, 'clubEvents', eventId, 'registrations', registrationId);
    await updateDoc(registrationRef, { status: newStatus });
  },

  // Cancel registration (from nested structure)
  cancelRegistration: async (registrationId: string, clubId: string, eventId: string): Promise<void> => {
    try {
      await eventRegistrationService.updateRegistrationStatus(registrationId, 'cancelled', clubId, eventId);
    } catch (error) {
      console.error('Error cancelling registration:', error);
      throw error;
    }
  },

  // Check in user for event (from nested structure)
  checkInUser: async (registrationId: string, clubId: string, eventId: string): Promise<void> => {
    try {
      const registrationRef = doc(db, 'events', clubId, 'clubEvents', eventId, 'registrations', registrationId);
      await updateDoc(registrationRef, {
        checkInStatus: 'checked_in',
        checkInTime: serverTimestamp()
      });
      console.log('User checked in successfully');
    } catch (error) {
      console.error('Error checking in user:', error);
      throw error;
    }
  },

  // Update payment status and accept registration if paid
  updatePaymentStatus: async (
    registrationId: string,
    paymentStatus: 'paid' | 'pending',
    paymentId: string,
    clubId: string,
    eventId: string
  ) => {
    const registrationRef = doc(db, 'events', clubId, 'clubEvents', eventId, 'registrations', registrationId);
    const updateData: any = { paymentStatus, paymentId };
    // If payment is now 'paid', also set status to 'confirmed'
    if (paymentStatus === 'paid') {
      updateData.status = 'confirmed';
    }
    await updateDoc(registrationRef, updateData);
  },

  // Get registration by ID from nested structure
  getRegistrationById: async (registrationId: string, clubId: string, eventId: string): Promise<EventRegistration | null> => {
    try {
      const registrationRef = doc(db, 'events', clubId, 'clubEvents', eventId, 'registrations', registrationId);
      const regSnap = await getDoc(registrationRef);
      if (!regSnap.exists()) return null;
      return { id: regSnap.id, ...regSnap.data() } as EventRegistration;
    } catch (error) {
      console.error('Error getting registration by ID:', error);
      return null;
    }
  },

  // Delete registration (admin only, from nested structure)
  deleteRegistration: async (registrationId: string, clubId: string, eventId: string): Promise<void> => {
    try {
      const registrationRef = doc(db, 'events', clubId, 'clubEvents', eventId, 'registrations', registrationId);
      await deleteDoc(registrationRef);
      console.log('Registration deleted successfully');
    } catch (error) {
      console.error('Error deleting registration:', error);
      throw error;
    }
  },

  // Store payment record after successful payment and registration confirmation
  storeEventPayment: async (
    payment: {
      registrationId: string;
      eventId: string;
      clubId: string;
      userId: string;
      userName: string;
      userEmail: string;
      amount: number;
      paymentId: string;
      paymentMethod?: string;
      transactionId?: string;
    }
  ): Promise<void> => {
    if (!payment.eventId || !payment.clubId || !payment.registrationId) {
      console.warn('storeEventPayment: Missing required fields', payment);
      return;
    }
    
    try {
      const paymentRecord: EventPaymentRecord = {
        ...payment,
        paymentStatus: 'paid',
        timestamp: serverTimestamp(),
      };
      
      // For guest users, store in guest_payments collection; for regular users, store in payments collection
      const isGuest = payment.userId.startsWith('guest_');
      const collectionName = isGuest ? 'guest_payments' : 'payments';
      
      const paymentRef = doc(
        db,
        'events',
        payment.clubId,
        'clubEvents',
        payment.eventId,
        collectionName,
        payment.paymentId
      );
      
      console.log('Storing payment record:', paymentRecord);
      console.log('Payment ref:', paymentRef.path);
      console.log('Is guest user?', isGuest);
      console.log('Using collection:', collectionName);
      
      await setDoc(paymentRef, paymentRecord);
      console.log('Payment record stored successfully in', collectionName);
    } catch (error) {
      console.error('Error storing payment record:', error);
      console.error('Payment data:', payment);
      // Don't throw the error - payment record storage failure shouldn't break the registration flow
      console.warn('Continuing with registration despite payment record storage failure');
    }
  },

  // Create a new team for a team event
  createTeam: async (
    eventId: string,
    clubId: string,
    teamName: string,
    creator: { userId: string; userName: string; userEmail: string }
  ): Promise<string> => {
    const teamsRef = collection(db, 'events', clubId, 'clubEvents', eventId, 'teams');
    const teamData: EventTeam = {
      name: teamName,
      eventId,
      clubId,
      members: [creator],
      createdBy: creator.userId,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(teamsRef, teamData);
    return docRef.id;
  },

  // Join an existing team
  joinTeam: async (
    eventId: string,
    clubId: string,
    teamId: string,
    member: { userId: string; userName: string; userEmail: string }
  ): Promise<void> => {
    const teamRef = doc(db, 'events', clubId, 'clubEvents', eventId, 'teams', teamId);
    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) throw new Error('Team not found');
    const team = teamSnap.data() as EventTeam;
    // Prevent duplicate members
    if (team.members.some(m => m.userId === member.userId)) return;
    // Optionally: enforce maxTeamSize (fetch event if needed)
    await updateDoc(teamRef, {
      members: [...team.members, member]
    });
  },

  // Search teams by name for an event
  searchTeams: async (
    eventId: string,
    clubId: string,
    search: string
  ): Promise<EventTeam[]> => {
    const teamsRef = collection(db, 'events', clubId, 'clubEvents', eventId, 'teams');
    const q = query(teamsRef, where('name', '>=', search), where('name', '<=', search + '\uf8ff'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventTeam));
  },

  // Register for a team event (individual registration, linked to team)
  registerForTeamEvent: async (
    eventId: string,
    user: User,
    eventInfo: { name: string; date: string; location: string; registrationFee?: number; organizerClubId: string },
    teamId: string,
    additionalInfo?: string
  ): Promise<string> => {
    const clubId = eventInfo.organizerClubId;
    const registrationData: EventRegistration = {
      eventId,
      clubId,
      userId: user.id ?? '',
      userName: user.name,
      userEmail: user.email ?? '',
      userPhone: user.mobile,
      status: 'confirmed',
      additionalInfo: additionalInfo || '',
      registrationDate: serverTimestamp(),
      eventName: eventInfo.name,
      eventDate: eventInfo.date,
      eventLocation: eventInfo.location,
      registrationFee: eventInfo.registrationFee || 0,
      checkInStatus: 'not_checked_in',
      // Add teamId to registration
      teamId,
    } as any;

    const registrationsRef = collection(db, 'events', clubId, 'clubEvents', eventId, 'registrations');
    const docRef = await addDoc(registrationsRef, registrationData);
    return docRef.id;
  },

  // Register guest user for an event (no authentication required)
  registerGuestForEvent: async (
    eventId: string,
    clubId: string,
    guestData: {
      name: string;
      email: string;
      phone: string;
      college: string;
      year: string;
      department: string;
    },
    eventInfo: { name: string; date: string; location: string; registrationFee?: number },
    additionalInfo?: string
  ): Promise<string> => {
    // Create a consistent guest ID based on email to prevent duplicates
    const guestId = `guest_${guestData.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    // First check if this guest is already registered for this event
    const isAlreadyRegistered = await eventRegistrationService.isUserRegistered(eventId, guestId, clubId);
    if (isAlreadyRegistered) {
      throw new Error('You are already registered for this event!');
    }
    
    const now = new Date();
    const expirationDate = new Date(now.getTime() + (3 * 30 * 24 * 60 * 60 * 1000)); // 3 months from now
    
    const registrationData = {
      eventId,
      clubId,
      userId: guestId, // Use consistent guest ID based on email
      userName: guestData.name,
      userEmail: guestData.email,
      userPhone: guestData.phone,
      userYear: guestData.year,
      userBranch: guestData.department,
      status: 'confirmed',
      additionalInfo: additionalInfo || '',
      registrationDate: serverTimestamp(),
      eventName: eventInfo.name,
      eventDate: eventInfo.date,
      eventLocation: eventInfo.location,
      registrationFee: eventInfo.registrationFee || 0,
      checkInStatus: 'not_checked_in',
      // Guest-specific fields
      isGuest: true,
      guestCollege: guestData.college,
      // Expiration timestamp (3 months from creation)
      expiresAt: expirationDate,
    };

    const guestRegistrationsRef = collection(db, 'events', clubId, 'clubEvents', eventId, 'guestRegistrations');
    console.log('Creating guest registration in collection:', guestRegistrationsRef.path);
    console.log('Registration data being stored:', registrationData);
    const docRef = await addDoc(guestRegistrationsRef, registrationData);
    console.log('Guest registration created successfully with ID:', docRef.id);
    return docRef.id;
  },

  // Batch check user registrations for multiple events (optimized for ProfilePage)
  batchCheckUserRegistrations: async (
    userId: string,
    events: { id: string; organizerClubId: string }[]
  ): Promise<string[]> => {
    if (!userId || events.length === 0) return [];
    
    try {
      const isGuest = userId.startsWith('guest_');
      const registeredEventIds: string[] = [];
      
      // Process events in batches to avoid overwhelming Firestore
      const batchSize = 10;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (event) => {
          try {
            const isRegistered = await eventRegistrationService.isUserRegistered(
              event.id, 
              userId, 
              event.organizerClubId
            );
            return isRegistered ? event.id : null;
          } catch (error) {
            console.error(`Error checking registration for event ${event.id}:`, error);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        registeredEventIds.push(...batchResults.filter(id => id !== null));
      }
      
      return registeredEventIds;
    } catch (error) {
      console.error('Error in batch check user registrations:', error);
      return [];
    }
  },

  // Get user's registered events with event details (optimized for ProfilePage)
  getUserRegisteredEvents: async (
    userId: string,
    events: { id: string; organizerClubId: string }[]
  ): Promise<{ upcoming: string[]; past: string[] }> => {
    const registeredEventIds = await eventRegistrationService.batchCheckUserRegistrations(userId, events);
    
    // This would need to be called from ProfilePage with the actual event objects
    // to determine upcoming vs past events
    return {
      upcoming: registeredEventIds, // This will be filtered in the component
      past: []
    };
  },
};

