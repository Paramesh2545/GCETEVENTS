import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import { User, Application, Event as EventType, Club, ClubTeamMember, AnnualEvent, Notification, LeadershipMember, NewsArticle, ExternalEvent } from './types';
import * as service from './services/mockService';
import { firebaseAuthService, getUserWithProfile, userProfileService, createGuestUserProfile } from './services/firebaseAuthService';
import { auth } from './firebaseConfig';
import { firestoreDataService, clubApplicationsService } from './services/firestoreDataService';
import { useDataFetching } from './hooks/useDataFetching';
import { assignContributorRole, revokeContributorFromClub, revokeAllContributorAccess, addClubMember, removeClubMember, updateClubMember, createClub } from './utils/adminUtils';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import AllEvents from './components/AllEvents';
import ClubDetail from './components/ClubDetail';
import AllClubs from './components/AllClubs';
import EventDetail from './components/EventDetail';
import ExternalEvents from './components/ExternalEvents';
import LoginPage from './components/LoginPage';
import News from './components/News';
import ProfilePage from './components/ProfilePage';
import DevAdminProfile from './components/DevAdminProfile';
import AllAnnualEvents from './components/AllAnnualEvents';
import AnnualEventDetail from './components/AnnualEventDetail';
import AllNotifications from './components/AllNotifications';

const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

const LoadingSpinner: React.FC = () => (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg">Loading Campus Hub...</p>
    </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use optimized data fetching hook
  const {
    events,
    clubs,
    applications,
    users,
    annualEvents,
    notifications,
    leadership,
    news,
    externalEvents,
    isLoading,
    updateEvents,
    updateClubs,
    updateApplications,
  } = useDataFetching({ user, enableRealtime: false });


  // Auth state listener - only runs once
  useEffect(() => {
    const unsubscribe = firebaseAuthService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const userProfile = await getUserWithProfile(firebaseUser);
        if (userProfile) {
          setUser(userProfile);
        }
      } else {
        // User is signed out
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Registration status is now checked per-event when needed (e.g., when opening EventDetail or EventRegistrationModal)
  // This eliminates the inefficient global registration checking that was querying every event

  // --- MOCK REGISTRATIONS ---
  const [registrations, setRegistrations] = useState<{[key: string]: number}>({
    'ev101': 42, 'ev102': 18, 'ev201': 153,
  });

  // --- AUTH HANDLERS ---
  const handleLogin = async (email: string, password: string) => {
    try {
      const { user: authUser } = await firebaseAuthService.signIn(email, password);
      const userProfile = await getUserWithProfile(authUser);
      if (userProfile) {
        setUser(userProfile);
        navigate('/');
      } else {
        throw new Error("Could not get user profile.");
      }
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  };


  const handleRegisterAndLogin = async (details: Omit<User, 'id' | 'role' | 'isGuest' | 'managedClubIds'> & {password: string}) => {
    try {
      const { email, password, name, ...rest } = details;
      const { user: authUser } = await firebaseAuthService.signUp(email!, password);
      
      // Create user profile with all the provided details
      const userProfile = await userProfileService.createUserProfile(authUser, {
        name,
        email: authUser.email || '',
        role: 'student',
        ...rest
      });
      
      if (userProfile) {
        setUser(userProfile);
        navigate('/');
      } else {
        throw new Error("Could not create user profile.");
      }
    } catch (error: any) {
      throw new Error(error.message || "Registration failed");
    }
  };

  const handleCreateProfileForExistingUser = async (details: Omit<User, 'id' | 'role' | 'isGuest' | 'managedClubIds'>) => {
    try {
      // Get the current Firebase user (should be logged in after verification)
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }

      // Create user profile with all the provided details
      const userProfile = await userProfileService.createUserProfile(currentUser, {
        name: details.name,
        email: currentUser.email || '',
        role: 'student',
        ...details
      });
      
      if (userProfile) {
        setUser(userProfile);
        navigate('/');
      } else {
        throw new Error("Could not create user profile.");
      }
    } catch (error: any) {
      throw new Error(error.message || "Profile creation failed");
    }
  };

  const handleGuestLogin = async (guestData: { name: string; email: string; phone: string; college: string; year: string; department: string }) => {
    try {
      // Create guest user profile in Firestore
      const guestUser = await createGuestUserProfile(guestData);
      setUser(guestUser);
      navigate('/');
    } catch (error) {
      console.error('Error creating guest user profile:', error);
      // Fallback: create guest user without storing in database
      const guestUser: User = { 
        id: `guest_${Date.now()}`, 
        name: guestData.name,
        email: guestData.email,
        mobile: guestData.phone,
        year: guestData.year,
        branch: guestData.department,
        collegeName: guestData.college,
        role: 'guest', 
        isGuest: true 
      };
      setUser(guestUser);
      navigate('/');
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseAuthService.signOut();
      setUser(null);
      navigate('/');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear user even if logout fails
      setUser(null);
      navigate('/');
    }
  };

  // --- DATA MUTATION HANDLERS (Dummy implementations) ---
  const handleRegisterEvent = (eventId: string) => {
    setRegistrations(prev => ({...prev, [eventId]: (prev[eventId] || 0) + 1}));
    // Don't show alert here - let the EventRegistrationModal handle success display
    // The modal will show the success state and close itself
  };

  const handleRegistrationUpdate = useCallback(() => {
    // Registration status is now checked per-component when needed
    // No global refresh needed since each component handles its own registration state
  }, []);

  const handleCreateEvent = (newEvent: EventType) => { alert('Creating event'); };
  const handleUpdateEvent = (updatedEvent: EventType) => { alert('Updated event successfully'); };
  const handleUpdateClub = async (updatedClub: Club) => {
    try {
      await firestoreDataService.updateClub(updatedClub.id, updatedClub);
      // Update clubs using optimized function
      const refreshedClubs = await firestoreDataService.getClubs();
      updateClubs(refreshedClubs);
      alert('Club details updated successfully!');
    } catch (error: any) {
      console.error('Error updating club:', error);
      alert(error.message || 'Failed to update club');
    }
  };
  const handleApplicationStatusChange = async (clubId: string, app: Application, status: 'accepted' | 'rejected') => {
    try {
      // Primary action
      if (status === 'accepted') {
        await clubApplicationsService.acceptAndPromote(clubId, app.id);
      } else {
        await clubApplicationsService.updateStatus(clubId, app.id, status);
      }
    } catch (e) {
      console.error('Failed to update application status', e);
      alert('Failed to update status');
      return;
    }

    // Best-effort refresh (do not alert on failure if update already succeeded)
    try {
      const refreshed = await firestoreDataService.getClubApplications(clubId);
      updateApplications(prev => {
        const others = prev.filter(a => a.clubId !== clubId);
        return [...others, ...refreshed];
      });
    } catch (e) {
      console.warn('Status updated, but failed to refresh list', e);
    }
  };
  const handleNewApplication = async (application: Omit<Application, 'id'>) => {
    try {
      // Write to the club's own applications subcollection
      const created = await firestoreDataService.createClubApplication(application.clubId, {
        userId: application.userId!,
        userName: application.userName,
        userImageUrl: application.userImageUrl,
        userEmail: application.userEmail,
        userYear: application.userYear,
        userBranch: application.userBranch,
        userMobile: application.userMobile,
        status: application.status,
        answers: application.answers
      });
      // Also update in-memory club-specific applications list immediately
      updateApplications(prev => [created, ...prev]);
    } catch (error: any) {
      console.error('Error creating application:', error);
      alert(error.message || 'Failed to submit application');
    }
  };
  const handleAssignContributor = async (userId: string, clubIds: string[]) => {
    if (!user?.id) {
      alert('You must be logged in to assign contributor roles');
      return;
    }

    try {
      const success = await assignContributorRole(userId, clubIds, user.id);
      
      if (success) {
        // Refresh the users data to reflect the changes
        const updatedUsers = await firestoreDataService.getUsers();
        // Note: users are updated via real-time listeners, no need to manually update
        alert('Contributor role assigned successfully!');
      } else {
        alert('Failed to assign contributor role. Please try again.');
      }
    } catch (error: any) {
      console.error('Error assigning contributor role:', error);
      alert(`Error: ${error.message || 'Failed to assign contributor role'}`);
    }
  };
  const handleCreateClub = async (newClubData: { name: string; tagline: string }, assignedAdminId: string) => {
    if (!user?.id) {
      alert('You must be logged in as admin to create a club');
      return;
    }

    try {
      const club = await createClub(newClubData, assignedAdminId, user.id);
      // refresh clubs (users updated via real-time listeners)
      const updatedClubs = await firestoreDataService.getClubs();
      updateClubs(updatedClubs);
      alert(`Club "${club.name}" created successfully!`);
      // navigate to new club detail
      navigate(`/clubs/${club.id}`);
    } catch (error: any) {
      console.error('Error creating club:', error);
      alert(`Error: ${error.message || 'Failed to create club'}`);
    }
  };
  const handleRevokeContributor = async (userId: string, clubIdToRemove?: string) => {
    if (!user?.id) {
      alert('You must be logged in to revoke contributor roles');
      return;
    }

    try {
      let success: boolean;
      
      if (clubIdToRemove) {
        // Revoke from specific club
        success = await revokeContributorFromClub(userId, clubIdToRemove, user.id);
      } else {
        // Revoke all contributor access
        success = await revokeAllContributorAccess(userId, user.id);
      }
      
      if (success) {
        // Users updated via real-time listeners
        alert('Contributor access revoked successfully!');
      } else {
        alert('Failed to revoke contributor access. Please try again.');
      }
    } catch (error: any) {
      console.error('Error revoking contributor access:', error);
      alert(`Error: ${error.message || 'Failed to revoke contributor access'}`);
    }
  };
  const handleUpdateEventHighlights = (eventId: string, highlights: EventType['highlights']) => { alert('Update highlights not implemented'); };
  const handleMarkAsRead = (notificationId: string) => { alert('Mark as read not implemented'); };
  const handleMarkAllAsRead = (userId: string) => { alert('Mark all as read not implemented'); };

  // Member management functions
  const handleAddClubMember = async (clubId: string, memberData: { name: string; position: string; imageUrl?: string }) => {
    if (!user?.id) {
      alert('You must be logged in to manage club members');
      return;
    }

    try {
      const success = await addClubMember(clubId, memberData, user.id);
      
      if (success) {
        // Refresh the clubs data to reflect the changes
        const updatedClubs = await firestoreDataService.getClubs();
        updateClubs(updatedClubs);
        alert('Member added successfully!');
      } else {
        alert('Failed to add member. Please try again.');
      }
    } catch (error: any) {
      console.error('Error adding club member:', error);
      alert(`Error: ${error.message || 'Failed to add member'}`);
    }
  };

  const handleRemoveClubMember = async (clubId: string, memberId: string) => {
    if (!user?.id) {
      alert('You must be logged in to manage club members');
      return;
    }

    try {
      const success = await removeClubMember(clubId, memberId, user.id);
      
      if (success) {
        // Refresh the clubs data to reflect the changes
        const updatedClubs = await firestoreDataService.getClubs();
        updateClubs(updatedClubs);
        alert('Member removed successfully!');
      } else {
        alert('Failed to remove member. Please try again.');
      }
    } catch (error: any) {
      console.error('Error removing club member:', error);
      alert(`Error: ${error.message || 'Failed to remove member'}`);
    }
  };

  const handleUpdateClubMember = async (clubId: string, memberId: string, memberData: { name?: string; position?: string; imageUrl?: string }) => {
    // Only update local state, do NOT call backend here
    updateClubs(prevClubs =>
      prevClubs.map(club =>
        club.id === clubId
          ? {
              ...club,
              team: club.team.map(m =>
                m.id === memberId ? { ...m, ...memberData } : m
              ),
            }
          : club
      )
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <LoginPage onLogin={handleLogin} onRegisterAndLogin={handleRegisterAndLogin} onCreateProfileForExistingUser={handleCreateProfileForExistingUser} onUserRegistered={setUser} onGuestLogin={handleGuestLogin} />;
  }
  
  const userNotifications = notifications.filter(n => n.userId === user?.id);

  const ClubDetailWrapper = () => {
    const { clubId } = useParams<{ clubId: string }>();
    if (!clubId) return <Navigate to="/clubs" replace />;
    const club = clubs.find(c => c.id === clubId);
    if (!club) return <Navigate to="/clubs" replace />;

    const [clubApplications, setClubApplications] = useState<Application[]>([]);
    useEffect(() => {
      let active = true;
      const load = async () => {
        try {
          const apps = await firestoreDataService.getClubApplications(club.id);
          if (active) setClubApplications(apps);
        } catch (e) {
          console.error('Failed to load club applications', e);
          if (active) setClubApplications([]);
        }
      };
      load();
      return () => { active = false; };
    }, [club.id, applications]);

    // Filter events to only those belonging to this club
    const clubEvents = events.filter(e => e.organizerClubId === club.id);

    return <ClubDetail 
      club={club} 
      clubEvents={clubEvents}
      setEvents={updateEvents}
      user={user} 
      applications={clubApplications}
      allUsers={users} 
      onUpdateClub={handleUpdateClub} 
      onApplicationStatusChange={handleApplicationStatusChange} 
      onNewApplication={handleNewApplication} 
      onCreateEvent={handleCreateEvent} 
      onUpdateEvent={handleUpdateEvent} 
      registrations={registrations}
      onAddClubMember={handleAddClubMember}
      onRemoveClubMember={handleRemoveClubMember}
      onUpdateClubMember={handleUpdateClubMember}
    />;
  };

  const EventDetailWrapper = () => {
    const { eventId } = useParams<{ eventId: string }>();
    if (!eventId) return <Navigate to="/events" replace />;
    const event = events.find(e => e.id === eventId);
    if (!event) return <Navigate to="/events" replace />;
    return <EventDetail event={event} clubs={clubs} user={user} onRegister={handleRegisterEvent} onUpdateEventHighlights={handleUpdateEventHighlights} onUpdateEvent={handleUpdateEvent} onRegistrationUpdate={handleRegistrationUpdate} />;
  };

  const AnnualEventDetailWrapper = () => {
    const { eventId } = useParams<{ eventId: string }>();
    if (!eventId) return <Navigate to="/annual-events" replace />;
    const event = annualEvents.find(e => e.id === eventId);
    if (!event) return <Navigate to="/annual-events" replace />;
    return <AnnualEventDetail event={event} allEvents={events} allClubs={clubs} />;
  };

  const ProfileWrapper = () => {
      if(user.role === 'admin') {
          return <DevAdminProfile user={user} clubs={clubs} events={events} allUsers={users} onAssignRole={handleAssignContributor} onRevokeRole={handleRevokeContributor} />
      }
      return <ProfilePage user={user} onLogout={handleLogout} events={events} clubs={clubs} applications={applications} />
  }
  // console.log(events)

  return (
    <div className="font-sans min-h-screen flex flex-col">
      <Header user={user} onLogout={handleLogout} applications={applications} notifications={userNotifications} onMarkAsRead={handleMarkAsRead} onMarkAllAsRead={() => handleMarkAllAsRead(user.id!)} />
      <main className="flex-1">
        <ScrollToTop />
        <div className="animate-fadeIn">
          <Routes>
            <Route path="/" element={<Home events={events} clubs={clubs} leadership={leadership} />} />
            <Route path="/clubs" element={
              <AllClubs
                clubs={clubs}
                user={user}
                allUsers={users}
                applications={applications} // <-- pass applications
                onCreateClub={handleCreateClub}
              />
            } />
            <Route path="/clubs/:clubId" element={<ClubDetailWrapper />} />
            <Route path="/events" element={<AllEvents events={events} clubs={clubs} />} />
            <Route path="/events/:eventId" element={<EventDetailWrapper />} />
            <Route path="/annual-events" element={<AllAnnualEvents annualEvents={annualEvents} />} />
            <Route path="/annual-events/:eventId" element={<AnnualEventDetailWrapper />} />
            <Route path="/opportunities" element={<ExternalEvents externalEvents={externalEvents} />} />
            <Route path="/news" element={<News news={news} />} />
            <Route path="/profile" element={<ProfileWrapper />} />
            <Route path="/notifications" element={<AllNotifications notifications={userNotifications} onMarkAsRead={handleMarkAsRead} />} />
            <Route path="*" element={<Navigate to="/" replace />} />    
        </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;