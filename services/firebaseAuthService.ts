import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../frontend/firebaseConfig';
import { User } from '../types';
import { removeUndefinedValues } from '../utils/firestoreUtils';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Convert Firebase User to our User type
const convertFirebaseUser = (firebaseUser: FirebaseUser, userData?: any): User => {
  return {
    id: firebaseUser.uid,
    name: userData?.name || firebaseUser.displayName || 'User',
    email: firebaseUser.email || '',
    role: userData?.role || 'student',
    rollNumber: userData?.rollNumber,
    year: userData?.year,
    branch: userData?.branch,
    mobile: userData?.mobile,
    isGuest: false,
    managedClubIds: userData?.managedClubIds || []
  };
};

// Real Firebase Auth Service
export const firebaseAuthService = {
  // Sign in with email and password
  signIn: async (email: string, password: string): Promise<{ user: FirebaseUser }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  },

  // Sign up with email and password
  signUp: async (email: string, password: string): Promise<{ user: FirebaseUser }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create account');
    }
  },

  // Sign in with Google
  signInWithGoogle: async (): Promise<{ user: FirebaseUser }> => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      return { user: userCredential.user };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  },

  // Sign out
  signOut: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  },

  // Get current user
  getCurrentUser: (): FirebaseUser | null => {
    return auth.currentUser;
  },

  // Get user document from Firestore
  getUserDocument: async (uid: string): Promise<any> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user document:', error);
      return null;
    }
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};

// User Profile Management
export const userProfileService = {
  // Get user profile from Firestore
  getUserProfile: async (uid: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: uid,
          name: userData.name || 'User',
          email: userData.email || '',
          role: userData.role || 'student',
          rollNumber: userData.rollNumber || undefined,
          year: userData.year || undefined,
          branch: userData.branch || undefined,
          mobile: userData.mobile || undefined,
          isGuest: userData.isGuest || false,
          managedClubIds: userData.managedClubIds || []
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  // Create user profile in Firestore
  createUserProfile: async (firebaseUser: FirebaseUser, profileData: Partial<User>): Promise<User> => {
    try {
      const userProfile: any = {
        id: firebaseUser.uid,
        name: profileData.name || firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        role: profileData.role || 'student',
        isGuest: false,
        managedClubIds: profileData.managedClubIds || []
      };

      // Add optional fields only if they have values
      if (profileData.rollNumber !== undefined) userProfile.rollNumber = profileData.rollNumber;
      if (profileData.year !== undefined) userProfile.year = profileData.year;
      if (profileData.branch !== undefined) userProfile.branch = profileData.branch;
      if (profileData.mobile !== undefined) userProfile.mobile = profileData.mobile;

      // Remove undefined values before saving to Firestore
      const cleanedProfile = removeUndefinedValues(userProfile);
      await setDoc(doc(db, 'users', firebaseUser.uid), cleanedProfile);
      
      // Return the complete user profile
      return {
        id: firebaseUser.uid,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
        rollNumber: userProfile.rollNumber,
        year: userProfile.year,
        branch: userProfile.branch,
        mobile: userProfile.mobile,
        isGuest: false,
        managedClubIds: userProfile.managedClubIds
      };
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateUserProfile: async (uid: string, updates: Partial<User>): Promise<void> => {
    try {
      // Remove undefined values before updating Firestore
      const cleanedUpdates = removeUndefinedValues(updates);

      if (Object.keys(cleanedUpdates).length > 0) {
        await updateDoc(doc(db, 'users', uid), cleanedUpdates);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
};

// Helper function to get user with profile
export const getUserWithProfile = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  try {
    // First try to get from Firestore
    let userProfile = await userProfileService.getUserProfile(firebaseUser.uid);
    
    // If not found, create a basic profile
    if (!userProfile) {
      userProfile = await userProfileService.createUserProfile(firebaseUser, {
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        role: 'student'
      });
    }
    
  return userProfile;
} catch (error) {
  console.error('Error getting user with profile:', error);
  return null;
}
};

// Create guest user profile in Firestore (no Firebase Auth required)
export const createGuestUserProfile = async (guestData: {
  name: string;
  email: string;
  phone: string;
  college: string;
  year: string;
  department: string;
}): Promise<User> => {
  try {
    // Create a consistent guest ID based on email to prevent duplicates
    const guestId = `guest_${guestData.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    console.log('Creating guest user with ID:', guestId);
    console.log('Email:', guestData.email);
    console.log('Processed email:', guestData.email.replace(/[^a-zA-Z0-9]/g, '_'));
    
    // Check if guest user already exists
    const existingGuestDoc = await getDoc(doc(db, 'users', guestId));
    if (existingGuestDoc.exists()) {
      console.log('Guest user already exists, returning existing profile:', guestId);
      return existingGuestDoc.data() as User;
    }
    
    const now = new Date();
    const expirationDate = new Date(now.getTime() + (3 * 30 * 24 * 60 * 60 * 1000)); // 3 months from now
    
    const guestUserProfile: User = {
      id: guestId,
      name: guestData.name,
      email: guestData.email,
      mobile: guestData.phone,
      year: guestData.year,
      branch: guestData.department,
      collegeName: guestData.college,
      role: 'guest',
      isGuest: true,
      managedClubIds: [],
      // Add expiration timestamp for cleanup
      expiresAt: expirationDate
    };

    // Store guest user profile in Firestore
    const userDataToStore = {
      ...guestUserProfile,
      createdAt: serverTimestamp(),
      expiresAt: expirationDate
    };
    
    console.log('Storing guest user data:', userDataToStore);
    console.log('Document path: users/', guestId);
    
    await setDoc(doc(db, 'users', guestId), userDataToStore);
    
    console.log('Guest user profile created:', guestId);
    return guestUserProfile;
  } catch (error) {
    console.error('Error creating guest user profile:', error);
    console.error('Guest data:', guestData);
    
    // Provide more specific error information
    if (error instanceof Error) {
      throw new Error(`Failed to create guest user profile: ${error.message}`);
    } else {
      throw new Error(`Failed to create guest user profile: ${JSON.stringify(error)}`);
    }
  }
};
