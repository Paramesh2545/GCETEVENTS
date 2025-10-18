import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Event, Club, Application, EventStatus } from '../types';
import ChangePasswordModal from './ChangePasswordModal';
import { firestoreDataService } from '../services/firestoreDataService';
import { useProfileData } from '../hooks/useProfileData';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  events: Event[];
  clubs: Club[];
  applications: Application[];
}

type ProfileTab = 'events' | 'clubs' | 'applications';

interface ProfileCardProps {
    user: User;
    onLogout: () => void;
    onOpenChangePassword: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, onLogout, onOpenChangePassword }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [clubsMap, setClubsMap] = useState<Record<string, Club | null>>({});
    const [loading, setLoading] = useState(false);
    const clubsId = useMemo(() => {
        const ids = new Set<string>();
        if (user.managedClubIds) {
            user.managedClubIds.forEach(id => ids.add(id));
        }
        return Array.from(ids);
    }, [user.managedClubIds]);

    useEffect(() => {
        const fetchClubData = async () => {
            setLoading(true);
            const results = await Promise.all(
                clubsId.map(id => firestoreDataService.getClubById(id))
            );
            // console.log("Fetched club data:", results[0].team[0].position);

            // Map clubId → club details
            const clubsObj: Record<string, any> = {};
            results.forEach((club, index) => {
                clubsObj[clubsId[index]] = club;
            });

            setClubsMap(clubsObj);
        };
        fetchClubData();
    }, [user.id]);

    const getInitials = (name: string) => {
        const names = name.split(' ');
        return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
    };

    const userRoles = useMemo(() => {
        const roles = ['Student'];
        if (user.managedClubIds && user.managedClubIds.length > 0) roles.push('Club Admin');
        return roles;
    }, [user]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const { left, top, width, height } = cardRef.current.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        const rotateX = (y / height - 0.5) * -15;
        const rotateY = (x / width - 0.5) * 15;
        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    };

    const handleMouseLeave = () => {
        if (cardRef.current) cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    };

    return (
        <div 
            ref={cardRef} 
            className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden group transition-transform duration-300 ease-out"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transformStyle: 'preserve-3d' }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-5xl font-bold shadow-lg">
                        {getInitials(user.name)}
                    </div>
                    <div className="absolute inset-0 rounded-full ring-4 ring-indigo-500/50 animate-pulse group-hover:animate-none"></div>
                </div>
                <h2 className="text-3xl font-extrabold text-white mt-5">{user.name}</h2>
                <p className="text-gray-400 text-sm">{user.email}</p>
                <div className="flex items-center space-x-2 mt-4">
                    {userRoles.map(role => (
                        <span key={role} className="px-3 py-1 text-xs font-semibold bg-slate-700 rounded-full shadow-sm">{role}</span>
                    ))}
                </div>
                <div className="mt-6 flex items-center space-x-3 border-t border-slate-700/50 pt-6">
                    <button onClick={onOpenChangePassword} className="flex-1 text-sm px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-gray-300 flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h4a6 6 0 016 6z" /></svg>
                        Change Password
                    </button>
                    <button onClick={onLogout} className="flex-1 text-sm px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 transition-colors text-red-400 flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, events, clubs, applications }) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('events');
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const navigate = useNavigate();

  // Use optimized profile data hook
  const { registeredEvents, isLoadingRegistrations, refreshRegistrations } = useProfileData({
    user,
    events,
    activeTab
  });

  const { upcomingEvents, pastEvents } = useMemo(() => {
    return {
      upcomingEvents: registeredEvents.filter(e => e.status === EventStatus.Upcoming || e.status === EventStatus.Ongoing),
      pastEvents: registeredEvents.filter(e => e.status === EventStatus.Past),
    };
  }, [registeredEvents]);

//   const { managedClubs, memberClubs } = useMemo(() => {
//     const managed = clubs.filter(c => user.managedClubIds?.includes(c.id));
//     console.log(managed)
//     const memberOf = applications
//       .filter(app => app.userName === user.name && app.status === 'accepted' && !user.managedClubIds?.includes(app.clubId))
//       .map(app => clubs.find(c => c.id === app.clubId))
//       .filter((c): c is Club => !!c);
    
//     return { managedClubs: managed, memberClubs: memberOf };
//   }, [clubs, applications, user]);

    const { managedClubs, memberClubs } = useMemo(() => {
    const managed = clubs.filter(c =>
        c.team?.some(m => m.id === user.id && m.position === "Admin")
    );

    // console.log("Managed Clubs:", managed);

    // const memberOf = applications
    //     .filter(
    //     app =>
    //         app.userName === user.name &&
    //         app.status === "accepted" &&
    //         !managed.some(c => c.id === app.clubId)
    //     )
    //     .map(app => clubs.find(c => c.id === app.clubId))
    //     .filter((c): c is Club => !!c);
    const memberOf = clubs.filter(c =>
        c.team?.some(m => m.id === user.id && m.position !== "Admin")
    );

    return { managedClubs: managed, memberClubs: memberOf };
    }, [clubs, applications, user]);


  const userApplications = useMemo(() => {
      return applications
        .filter(app => app.userName === user.name)
        .map(app => ({
            ...app,
            club: clubs.find(c => c.id === app.clubId)
        }))
        .filter(app => app.club);
  }, [applications, user.name, clubs]);


  const pendingApplicationsCount = useMemo(() => {
    return applications.filter(app => user.managedClubIds?.includes(app.clubId) && app.status === 'pending').length;
  }, [applications, user.managedClubIds]);

  const TabButton: React.FC<{tab: ProfileTab, children: React.ReactNode, count?: number}> = ({tab, children, count}) => (
      <button onClick={() => setActiveTab(tab)} className={`relative flex-1 py-4 text-sm font-bold transition-colors ${activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
          {children}
          {count && count > 0 ? <span className="absolute top-3 ml-2 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">{count}</span> : null}
          {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>}
      </button>
  );

  const statusStyles: { [key in Application['status']]: { text: string; bg: string; dot: string } } = {
    pending: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', dot: 'bg-yellow-500' },
    accepted: { text: 'text-green-400', bg: 'bg-green-500/10', dot: 'bg-green-500' },
    rejected: { text: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-500' },
  };


  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <ChangePasswordModal 
            isOpen={isChangePasswordModalOpen} 
            onClose={() => setChangePasswordModalOpen(false)}
            userEmail={user.email}
        />
        
        <ProfileCard user={user} onLogout={onLogout} onOpenChangePassword={() => setChangePasswordModalOpen(true)} />

        <div className="mt-12">
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg flex">
                <TabButton tab="events">Registered Events</TabButton>
                <TabButton tab="clubs">My Clubs</TabButton>
                <TabButton tab="applications">My Applications</TabButton>
            </div>
            
            <div className="mt-6 animate-tab-content-enter">
                {activeTab === 'events' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-300 text-lg px-2">Upcoming & Ongoing</h4>
                            {isLoadingRegistrations ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                                    <span className="ml-2 text-gray-400">Loading your events...</span>
                                </div>
                            ) : upcomingEvents.length > 0 ? upcomingEvents.map((event, i) => (
                                <button key={event.id} onClick={() => navigate(`/events/${event.id}`)} style={{animationDelay: `${i*100}ms`}} className="animate-staggered-fade-in w-full text-left p-4 rounded-lg bg-slate-900 hover:bg-slate-800 transition-colors border border-slate-800 hover:border-slate-700">
                                    <p className="font-semibold truncate text-white">{event.name}</p>
                                    <p className="text-xs text-gray-400">{event.date} at {event.time}</p>
                                </button>
                            )) : <p className="text-sm text-gray-500 px-2">You have no upcoming events.</p>}
                        </div>
                        <div className="space-y-4">
                             <h4 className="font-semibold text-gray-300 text-lg px-2">Past Events</h4>
                             {isLoadingRegistrations ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                                    <span className="ml-2 text-gray-400">Loading your events...</span>
                                </div>
                            ) : pastEvents.length > 0 ? pastEvents.map((event, i) => (
                                <button key={event.id} onClick={() => navigate(`/events/${event.id}`)} style={{animationDelay: `${i*100}ms`}} className="animate-staggered-fade-in w-full text-left p-4 rounded-lg bg-slate-900 hover:bg-slate-800 transition-colors border border-slate-800 hover:border-slate-700">
                                    <p className="font-semibold truncate text-white">{event.name}</p>
                                    <p className="text-xs text-gray-400">{event.date}</p>
                                </button>
                             )) : <p className="text-sm text-gray-500 px-2">You haven't attended any past events.</p>}
                        </div>
                    </div>
                )}
                 {activeTab === 'clubs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-300 text-lg px-2">Managed Clubs</h4>
                            {managedClubs.length > 0 ? managedClubs.map((club, i) => (
                                <div key={club.id} style={{animationDelay: `${i*100}ms`}} className="animate-staggered-fade-in p-4 rounded-lg bg-slate-900 border border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <img src={club.logoUrl} alt={club.name} className="w-12 h-12 rounded-full" />
                                            <div>
                                                <p className="font-semibold text-white">{club.name}</p>
                                                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">Admin</span>
                                            </div>
                                        </div>
                                        <button onClick={() => navigate(`/clubs/${club.id}`)} className="px-4 py-2 text-xs font-bold bg-indigo-600 rounded-lg hover:bg-indigo-700">Manage</button>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-gray-500 px-2">You do not manage any clubs.</p>}
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-300 text-lg px-2">Club Memberships</h4>
                             {memberClubs.length > 0 ? memberClubs.map((club, i) => (
                                <button key={club.id} onClick={() => navigate(`/clubs/${club.id}`)} style={{animationDelay: `${i*100}ms`}} className="animate-staggered-fade-in w-full text-left p-4 rounded-lg bg-slate-900 hover:bg-slate-800 transition-colors flex items-center space-x-3 border border-slate-800 hover:border-slate-700">
                                    <img src={club.logoUrl} alt={club.name} className="w-12 h-12 rounded-full" />
                                     <div>
                                        <p className="font-semibold text-white">{club.name}</p>
                                        <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Member</span>
                                    </div>
                                </button>
                            )) : <p className="text-sm text-gray-500 px-2">You are not a member of any other clubs.</p>}
                        </div>
                    </div>
                 )}
                 {activeTab === 'applications' && (
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-300 text-lg px-2">Your Club Applications</h4>
                        {userApplications.length > 0 ? userApplications.map((app, i) => (
                            <div key={app.id} style={{animationDelay: `${i*100}ms`}} className="animate-staggered-fade-in p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <img src={app.club!.logoUrl} alt={app.club!.name} className="w-12 h-12 rounded-full" />
                                    <div>
                                        <p className="font-semibold text-white">{app.club!.name}</p>
                                        <p className="text-xs text-gray-400">Application sent on {new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className={`${statusStyles[app.status].bg} ${statusStyles[app.status].text} text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2`}>
                                    <span className={`h-2 w-2 rounded-full ${statusStyles[app.status].dot}`}></span>
                                    <span className="capitalize">{app.status}</span>
                                </div>
                            </div>
                        )) : <p className="text-sm text-gray-500 px-2">You haven't applied to any clubs yet.</p>}
                    </div>
                 )}
            </div>
        </div>
    </div>
  )
};

export default ProfilePage;