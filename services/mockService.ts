// Mock service to maintain original app behavior
// This will be replaced with Firebase integration later

import { User, Event, Club, Application, AnnualEvent, Notification, LeadershipMember, NewsArticle, ExternalEvent } from '../types';
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

// Mock auth service - using constants data
export const authService = {
  signIn: async (email: string, password: string) => {
    // Find user by email in MOCK_USERS
    const user = MOCK_USERS.find(u => u.email === email);
    if (user) {
      return { user: { uid: user.id, email: user.email, displayName: user.name } };
    }
    // If not found, create a mock user (for testing)
    return { user: { uid: 'mock-user-id', email } };
  },
  signUp: async (email: string, password: string) => {
    // Mock registration - always succeeds
    return { user: { uid: 'mock-user-id', email } };
  },
  signInWithGoogle: async () => {
    // Mock Google sign-in - always succeeds
    return { user: { uid: 'mock-google-user-id', email: 'user@gmail.com', displayName: 'Google User' } };
  },
  signOut: async () => {
    // Mock sign out
    console.log('Mock sign out');
  }
};

// Data fetching functions - using constants data
export const getEvents = async (): Promise<Event[]> => {
  return EVENTS;
};

export const getClubs = async (): Promise<Club[]> => {
  return CLUBS;
};

export const getUsers = async (): Promise<User[]> => {
  return MOCK_USERS;
};

export const getLeadership = async (): Promise<LeadershipMember[]> => {
  return LEADERSHIP;
};

export const getAnnualEvents = async (): Promise<AnnualEvent[]> => {
  return ANNUAL_EVENTS;
};

export const getNews = async (): Promise<NewsArticle[]> => {
  return NEWS;
};

export const getExternalEvents = async (): Promise<ExternalEvent[]> => {
  return EXTERNAL_EVENTS;
};

export const getNotifications = async (): Promise<Notification[]> => {
  return NOTIFICATIONS;
};

export const getApplications = async (): Promise<Application[]> => {
  return APPLICATIONS;
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  return MOCK_USERS.find(user => user.id === uid) || null;
};

export const createUserProfile = async (authUser: any, profileData: any): Promise<User> => {
  const newUser: User = {
    id: authUser.uid,
    name: profileData.name,
    email: authUser.email,
    rollNumber: profileData.rollNumber,
    year: profileData.year,
    branch: profileData.branch,
    mobile: profileData.mobile,
    role: 'student',
    isGuest: false,
    managedClubIds: []
  };
  return newUser;
};
