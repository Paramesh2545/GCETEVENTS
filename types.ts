export enum EventStatus {
  Past = 'Past',
  Ongoing = 'Ongoing',
  Upcoming = 'Upcoming',
}

export type EventCategory = 'Technical' | 'Cultural' | 'Workshop' | 'Sports';

export interface LeadershipMember {
  id: number;
  name: string;
  title: string;
  imageUrl: string;
  quote: string;
}

export interface Event {
  id:string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  rules: string[];
  imageUrl: string;
  status: EventStatus;
  category: EventCategory;
  isFeatured?: boolean;
  registrationFee?: number;
  organizerClubId: string;
  coordinators: { name: string; contact: string }[];
  highlights?: {
    images: string[];
    guests: string[];
    winners: { position: string; name: string; details?: string }[];
    galleryDriveLink?: string;
  };
  capacity?: number;
  specialGuests?: string[];
  customSections?: { title: string; content: string }[];
  parentAnnualEventId?: string; // Links sub-events to a main annual event
  registeredUsers?: string[]; // Array of user IDs who registered for this event
}

export interface ClubTeamMember {
  id: string;
  name: string;
  position: string;
  imageUrl?: string;
}

export interface Club {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  eventIds: string[];
  achievements: string[];
  team: ClubTeamMember[];
  recruitmentOpen?: boolean;
  recruitmentQuestions?: string[];
}

export interface ExternalEvent {
    id: string;
    name: string;
    organizer: string;
    description: string;
    link: string;
    category: 'Hackathon' | 'Tech Fest' | 'Internship' | 'Workshop';
}

export type UserRole = 'admin' | 'contributor' | 'student' | 'guest';

export interface User {
  id?: string;
  name: string;
  email?: string;
  role: UserRole;
  
  // Student-specific
  rollNumber?: string;
  year?: string;
  branch?: string;
  mobile?: string;
  managedClubIds?: string[];

  // Guest-specific
  collegeName?: string; 
  isGuest?: boolean;
  expiresAt?: Date; // For guest user cleanup
  
  // Registration tracking
  registeredEvents?: string[]; // Array of event IDs the user has registered for
}


export interface NewsArticle {
    id: string;
    title: string;
    date: string;
    summary: string;
    category: 'Recruitment' | 'Event Result' | 'Announcement';
    link?: {
        path: string;
        text: string;
    }
}

export interface Application {
    id: string;
  userId?: string;
    userName: string;
    userImageUrl: string;
    userEmail: string;
    userYear: string;
    userBranch: string;
    userMobile: string;
    clubId: string;
    status: 'pending' | 'accepted' | 'rejected';
    answers: { question: string; answer: string }[];
}


// ===== NEW TYPES FOR ANNUAL EVENTS =====
export interface ChiefGuest {
  name: string;
  title: string;
  profileImageUrl: string;
  eventPhotos?: string[];
}

export interface OrganizingTeamMember {
  name: string;
  position: string;
  imageUrl?: string;
}

export interface StudentPerformance {
    performer: string;
    description: string;
    imageUrl: string;
}

export interface AcademicWinner {
    rank: 1 | 2 | 3;
    name: string;
    achievement: string; // e.g., '9.8 GPA'
}

export interface AcademicAward {
    department: string;
    winners: AcademicWinner[];
}

export interface SportCompetition {
    id: string;
    name: string;
    description: string;
    icon: string; // Using string for emoji or icon class
    registrationOpen: boolean;
}

export interface AnnualEventYearlyData {
  year: number;
  theme?: string;
  chiefGuests: ChiefGuest[];
  highlightsGallery: {
    previewImages: string[];
    fullGalleryLink: string;
  };
  organizingTeam: OrganizingTeamMember[];
  achievements?: string[];
  performances?: StudentPerformance[];
  awardWinners?: AcademicAward[];
  sportsCompetitions?: SportCompetition[];
}

export interface AnnualEvent {
  id: string; // e.g., 'vibgyor', 'bhaswara'
  name: string;
  shortDescription: string;
  longDescription: string; // Significance and importance
  bannerUrl: string;
  registrationEnabled: boolean;
  category: 'Cultural' | 'Technical' | 'Sports';
  yearlyData: AnnualEventYearlyData[];
}
// ===== END NEW TYPES =====

// ===== NEW TYPES FOR NOTIFICATIONS =====
export type NotificationType =
  | 'application-accepted'
  | 'application-rejected'
  | 'event-winner'
  | 'access-granted'
  | 'access-revoked'
  | 'info';

export interface Notification {
  id: string;
  userId: string; // To whom the notification belongs
  type: NotificationType;
  message: string;
  timestamp: string; // ISO string for simplicity
  isRead: boolean;
  link?: string; // Optional link to navigate to
}
// ===== END NEW TYPES =====

// ===== EVENT REGISTRATION TYPES =====
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userMobile: string;
  userYear: string;
  userBranch: string;
  registrationDate: string;
  status: RegistrationStatus;
  paymentStatus?: PaymentStatus;
  additionalInfo?: { [key: string]: string };
  notes?: string; // For organizers to add notes
  
  // Guest-specific fields
  isGuest?: boolean;
  guestCollege?: string;
  expiresAt?: Date; // Expiration date for guest data (3 months)
}

export interface EventRegistrationStats {
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  cancelledRegistrations: number;
  capacity?: number;
  isFull: boolean;
}
// ===== END EVENT REGISTRATION TYPES =====

export type View =
  | { type: 'home' }
  | { type: 'events' }
  | { type: 'clubs' }
  | { type: 'external-events' }
  | { type: 'news' }
  | { type: 'profile' }
  | { type: 'club'; clubId: string }
  | { type: 'event-detail'; eventId: string };