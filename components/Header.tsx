import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Application, Notification } from '../types';
import NotificationsPanel from './NotificationsPanel';


interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  applications: Application[];
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const NavLink: React.FC<{ to: string; children: React.ReactNode; onClick?: () => void; }> = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="text-gray-300 hover:text-white relative after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full px-1 py-2 text-sm font-semibold"
  >
    {children}
  </Link>
);

const MobileNavLink: React.FC<{ to: string; children: React.ReactNode; onClick?: () => void; }> = ({ to, children, onClick }) => (
    <Link
      to={to}
      onClick={onClick}
      className="block text-gray-300 hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors w-full text-left"
    >
      {children}
    </Link>
  );

const Header: React.FC<HeaderProps> = ({ user, onLogout, applications, notifications, onMarkAsRead, onMarkAllAsRead }) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isEventsMenuOpen, setEventsMenuOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const eventsMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const closeAllMenus = () => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    setEventsMenuOpen(false);
    setNotificationsOpen(false);
  }

  const handleLogoutClick = () => {
    onLogout();
    closeAllMenus();
  }
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (eventsMenuRef.current && !eventsMenuRef.current.contains(event.target as Node)) {
        setEventsMenuOpen(false);
      }
       if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const hasPendingApplications = useMemo(() => {
    if (!user || !user.managedClubIds) return false;
    return applications.some(app => 
      user.managedClubIds!.includes(app.clubId) && app.status === 'pending'
    );
  }, [user, applications]);

  const unreadNotificationsCount = useMemo(() => {
      return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-gray-950/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link to="/" onClick={closeAllMenus} className="flex-shrink-0 flex items-center space-x-2 group">
              <span className="text-white text-2xl font-extrabold tracking-tighter">GCET</span>
            </Link>
          </div>
          
          <div className="flex items-center">
              <div className="hidden md:block">
                <nav className="ml-10 flex items-baseline space-x-4">
                    <NavLink to="/" onClick={closeAllMenus}>Home</NavLink>
                    <div className="relative" ref={eventsMenuRef}>
                        <button onClick={() => setEventsMenuOpen(prev => !prev)} className="text-gray-300 hover:text-white relative after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full px-1 py-2 text-sm font-semibold flex items-center gap-1">
                            Events
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isEventsMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                        {isEventsMenuOpen && (
                            <div className="absolute left-0 mt-2 w-48 origin-top-left bg-slate-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 border border-slate-700 focus:outline-none animate-slide-down-fade">
                                <Link to="/events" onClick={closeAllMenus} className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/80 transition-colors">All Events</Link>
                                <Link to="/annual-events" onClick={closeAllMenus} className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/80 transition-colors">Annual Events</Link>
                            </div>
                        )}
                    </div>
                    {!user?.isGuest && <NavLink to="/clubs" onClick={closeAllMenus}>Clubs</NavLink>}
                    <NavLink to="/news" onClick={closeAllMenus}>News</NavLink>
                    <NavLink to="/opportunities" onClick={closeAllMenus}>Opportunities</NavLink>
                </nav>
              </div>

              {user && (
                <div className="flex items-center space-x-2 md:space-x-4 md:ml-8">
                  {/* Notifications Bell */}
                  <div className="relative" ref={notificationsRef}>
                     <button
                        onClick={() => setNotificationsOpen(prev => !prev)}
                        className="relative p-2 rounded-full text-gray-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
                        aria-label="View notifications"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        {unreadNotificationsCount > 0 && <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-900"></span>}
                     </button>
                     {isNotificationsOpen && (
                         <NotificationsPanel
                            notifications={notifications}
                            onMarkAsRead={onMarkAsRead}
                            onMarkAllAsRead={onMarkAllAsRead}
                            onClose={() => setNotificationsOpen(false)}
                         />
                     )}
                  </div>
                  {/* Profile Menu - Desktop only */}
                  <div className="hidden md:block relative" ref={profileMenuRef}>
                    <button onClick={() => setProfileMenuOpen(prev => !prev)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-800 transition-colors">
                      <div className="relative w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white">
                        {getInitials(user.name)}
                        {hasPendingApplications && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-900"></span>}
                      </div>
                    </button>
                    {isProfileMenuOpen && (
                          <div className="absolute right-0 mt-2 w-48 origin-top-right bg-slate-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 border border-slate-700 focus:outline-none animate-slide-down-fade">
                              <Link
                                  to="/profile"
                                  onClick={closeAllMenus}
                                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700/80 transition-colors"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                  My Profile
                              </Link>
                              <button
                                  onClick={handleLogoutClick}
                                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700/80 transition-colors"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
                                  Logout
                              </button>
                          </div>
                      )}
                  </div>
                </div>
              )}

              <div className="-mr-2 flex md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                  type="button"
                  className="bg-gray-900 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  aria-controls="mobile-menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <MobileNavLink to="/" onClick={closeAllMenus}>Home</MobileNavLink>
            <MobileNavLink to="/events" onClick={closeAllMenus}>All Events</MobileNavLink>
            <MobileNavLink to="/annual-events" onClick={closeAllMenus}>Annual Events</MobileNavLink>
            <MobileNavLink to="/clubs" onClick={closeAllMenus}>Clubs</MobileNavLink>
            <MobileNavLink to="/news" onClick={closeAllMenus}>News</MobileNavLink>
            <MobileNavLink to="/opportunities" onClick={closeAllMenus}>Opportunities</MobileNavLink>
            {user && (
                 <MobileNavLink to="/profile" onClick={closeAllMenus}>My Profile</MobileNavLink>
            )}
             {user && (
                 <button onClick={handleLogoutClick} className="block text-red-400 hover:bg-slate-800 hover:text-red-300 px-3 py-2 rounded-md text-base font-medium transition-colors w-full text-left">Logout</button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;