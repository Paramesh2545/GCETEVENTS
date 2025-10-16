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
  getDoc 
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
      checkInStatus: 'not_checked_in'
    };

    const registrationsRef = collection(db, 'events', clubId, 'clubEvents', eventId, 'registrations');
    const docRef = await addDoc(registrationsRef, registrationData);
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
    
    // Ensure we have a valid user ID and user is authenticated
    if (!user.id) {
      throw new Error('User ID is required for registration');
    }
    
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to register for events');
    }
    
    const registrationData: EventRegistration = {
      eventId,
      clubId,
      userId: auth.currentUser.uid, // Use the authenticated user's UID
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
      checkInStatus: 'not_checked_in'
    };

    console.log('Creating registration with data:', registrationData);
    console.log('User ID (from auth):', registrationData.userId);
    console.log('Auth UID:', auth.currentUser?.uid);
    console.log('User object:', user);
    console.log('Are UIDs matching?', registrationData.userId === auth.currentUser?.uid);
    
    const registrationsRef = collection(db, 'events', clubId, 'clubEvents', eventId, 'registrations');
    const docRef = await addDoc(registrationsRef, registrationData);
    return docRef.id;
  },

  // Check if user is already registered for an event
  isUserRegistered: async (eventId: string, userId: string, clubId?: string): Promise<boolean> => {
    if (!clubId || !eventId || !userId) return false;
    try {
      // Use a query to only fetch registrations for this user (matches security rules)
      const registrationsRef = query(
        collection(db, 'events', clubId, 'clubEvents', eventId, 'registrations'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(registrationsRef);
      const activeRegistrations = querySnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.status !== 'cancelled';
      });
      return activeRegistrations.length > 0;
    } catch (error) {
      console.error('Error checking user registration:', error, { eventId, userId, clubId });
      return false;
    }
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
      // Add a query to only fetch registrations for this user (security rules will allow only their own docs)
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

  // Get registrations for a specific event
  getEventRegistrations: async (eventId: string, clubId: string): Promise<EventRegistration[]> => {
    const registrationsRef = collection(db, 'events', clubId, 'clubEvents', eventId, 'registrations');
    const snapshot = await getDocs(registrationsRef);
    return snapshot.docs.map(doc => doc.data() as EventRegistration);
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
  
  getEventRegistrationCount: (eventId: string, clubId: string): Promise<number> => {
    return eventRegistrationService.getEventRegistrations(eventId, clubId).then(registrations => registrations.length);
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
    if (!payment.eventId || !payment.clubId || !payment.registrationId) return;
    const paymentRecord: EventPaymentRecord = {
      ...payment,
      paymentStatus: 'paid',
      timestamp: serverTimestamp(),
    };
    const paymentRef = doc(
      db,
      'events',
      payment.clubId,
      'clubEvents',
      payment.eventId,
      'payments',
      payment.paymentId
    );
    console.log(paymentRef);
    await setDoc(paymentRef, paymentRecord);
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
};

