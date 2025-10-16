import React, { useState, useMemo } from 'react';
import { User, Event, Club } from '../types';
import { revokeContributorFromClub, revokeAllContributorAccess } from '../utils/adminUtils';
import PhonePeAccountManager from './PhonePeAccountManager';
import PaymentDashboard from './PaymentDashboard';
import { eventRegistrationService } from '../services/eventRegistrationService';

interface DevAdminProfileProps {
  user: User;
  events: Event[];
  clubs: Club[];
  allUsers: User[];
  onAssignRole: (userId: string, clubIds: string[]) => void;
  onRevokeRole: (userId: string, clubId?: string) => void;
}

type AdminTab = 'management' | 'analytics' | 'settings' | 'payments' | 'phonepe' | 'eventpayments';

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; delay: number }> = ({ title, value, icon, delay }) => (
    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 flex items-center gap-5 animate-staggered-fade-in" style={{animationDelay: `${delay}ms`}}>
        <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-lg flex items-center justify-center">{icon}</div>
        <div>
            <div className="text-3xl font-extrabold text-white">{value}</div>
            <div className="text-sm font-semibold text-gray-400">{title}</div>
        </div>
    </div>
);


const AssignRoleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    students: User[];
    clubs: Club[];
    onAssign: (userId: string, clubIds: string[]) => void;
}> = ({ isOpen, onClose, students, clubs, onAssign }) => {
    const [rollNumber, setRollNumber] = useState('');
    const [foundStudent, setFoundStudent] = useState<User | null>(null);
    const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
    const [error, setError] = useState('');

    const handleSearch = () => {
        const student = students.find(s => s.rollNumber === rollNumber && s.role === 'student');
        if (student) {
            setFoundStudent(student);
            setError('');
        } else {
            setFoundStudent(null);
            setError('Student not found or is already a contributor/admin.');
        }
    };
    
    const handleClubToggle = (clubId: string) => {
        setSelectedClubs(prev => 
            prev.includes(clubId) ? prev.filter(id => id !== clubId) : [...prev, clubId]
        );
    }
    
    const handleSubmit = () => {
        if(foundStudent && selectedClubs.length > 0) {
            onAssign(foundStudent.id!, selectedClubs);
            handleClose();
        }
    }

    const handleClose = () => {
        setRollNumber('');
        setFoundStudent(null);
        setSelectedClubs([]);
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={handleClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl animate-form-enter" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-2xl font-bold text-white">Assign Contributor Role</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Search student by Roll Number..."
                            value={rollNumber}
                            onChange={e => setRollNumber(e.target.value)}
                            className="flex-grow px-3 py-2 bg-slate-800 border border-slate-600 rounded-md"
                        />
                        <button onClick={handleSearch} className="px-4 py-2 bg-indigo-600 rounded-md font-semibold hover:bg-indigo-700">Search</button>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    {foundStudent && (
                        <div className="animate-fade-in-content">
                            <div className="p-4 bg-slate-800/50 rounded-lg">
                                <p className="font-bold text-white">{foundStudent.name}</p>
                                <p className="text-sm text-gray-400">{foundStudent.rollNumber}</p>
                            </div>
                            <h3 className="font-semibold mt-4 mb-2 text-white">Select clubs to manage:</h3>
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                {clubs.map(club => (
                                    <label key={club.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-800 cursor-pointer">
                                        <input type="checkbox" checked={selectedClubs.includes(club.id)} onChange={() => handleClubToggle(club.id)} className="h-4 w-4 rounded bg-slate-700 border-slate-500 text-indigo-600 focus:ring-indigo-500"/>
                                        <img src={club.logoUrl} alt={club.name} className="w-8 h-8 rounded-full" />
                                        <span className="text-gray-300">{club.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                    <button onClick={handleClose} className="px-4 py-2 bg-slate-700 rounded-md font-semibold hover:bg-slate-600">Cancel</button>
                    <button onClick={handleSubmit} disabled={!foundStudent || selectedClubs.length === 0} className="px-4 py-2 bg-indigo-600 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">Assign Role</button>
                </div>
            </div>
        </div>
    )
}

const ContributorCard: React.FC<{
    contributor: User;
    clubs: Club[];
    onRevoke: (userId: string, clubId?: string) => void;
    currentUserId: string;
}> = ({ contributor, clubs, onRevoke, currentUserId }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const managedClubs = useMemo(() => {
        return clubs.filter(c => contributor.managedClubIds?.includes(c.id));
    }, [clubs, contributor]);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg transition-all duration-300">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-4 flex justify-between items-center text-left">
                <div>
                    <p className="font-bold text-white">{contributor.name}</p>
                    <p className="text-sm text-gray-400">{contributor.rollNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-4">
                        {managedClubs.slice(0, 3).map(club => (
                            <img key={club.id} src={club.logoUrl} alt={club.name} className="w-8 h-8 rounded-full border-2 border-slate-700"/>
                        ))}
                    </div>
                     <span className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </span>
                </div>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
                <div className="px-4 pb-4 space-y-3">
                    <p className="font-semibold text-gray-300 border-t border-slate-700 pt-3">Managed Clubs:</p>
                    {managedClubs.map(club => (
                        <div key={club.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-md">
                            <div className="flex items-center gap-2">
                                <img src={club.logoUrl} alt={club.name} className="w-8 h-8 rounded-full" />
                                <span className="text-gray-300">{club.name}</span>
                            </div>
                            <button onClick={async () => {
                                try {
                                    await revokeContributorFromClub(contributor.id!, club.id, currentUserId);
                                    onRevoke(contributor.id!, club.id);
                                } catch (error) {
                                    console.error('Error revoking contributor:', error);
                                }
                            }} className="px-3 py-1 text-xs bg-red-600/50 text-red-300 hover:bg-red-600/80 rounded-md">Revoke</button>
                        </div>
                    ))}
                    <button onClick={async () => {
                        try {
                            await revokeAllContributorAccess(contributor.id!, currentUserId);
                            onRevoke(contributor.id!);
                        } catch (error) {
                            console.error('Error revoking all contributor access:', error);
                        }
                    }} className="w-full mt-2 px-3 py-2 text-sm bg-red-800/50 text-red-300 hover:bg-red-800/80 rounded-md font-semibold">Revoke All Contributor Access</button>
                </div>
            </div>
        </div>
    );
};


const DevAdminProfile: React.FC<DevAdminProfileProps> = ({ user, events, clubs, allUsers, onAssignRole, onRevokeRole }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('management');
  const [contributorSearch, setContributorSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { students, contributors } = useMemo(() => ({
      students: allUsers.filter(u => u.role === 'student'),
      contributors: allUsers.filter(u => u.role === 'contributor'),
  }), [allUsers]);

  const filteredContributors = useMemo(() => {
      return contributors.filter(c => 
          c.name.toLowerCase().includes(contributorSearch.toLowerCase()) ||
          c.rollNumber?.toLowerCase().includes(contributorSearch.toLowerCase())
      );
  }, [contributors, contributorSearch])

  // Event Payments State
  const [eventPayments, setEventPayments] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  // Load all event payments (for demo: loads for all events)
  const loadEventPayments = async () => {
    setIsLoadingPayments(true);
    try {
      // For each event, fetch payments subcollection
      const allPayments: any[] = [];
      for (const event of events) {
        if (!event.organizerClubId) continue;
        // Defensive: try/catch per event
        try {
          const paymentsSnap = await import('firebase/firestore').then(({ collection, getDocs, db }) =>
            getDocs(collection(
              db,
              'events',
              event.organizerClubId,
              'clubEvents',
              event.id,
              'payments'
            ))
          );
          paymentsSnap.forEach((doc: any) => {
            allPayments.push({ eventId: event.id, eventName: event.name, ...doc.data() });
          });
        } catch (e) {
          // Ignore errors for missing payments subcollection
        }
      }
      setEventPayments(allPayments);
    } catch (e) {
      setEventPayments([]);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const TabButton: React.FC<{tab: AdminTab, children: React.ReactNode}> = ({tab, children}) => (
      <button onClick={() => setActiveTab(tab)} className={`relative flex-1 py-4 text-sm font-bold transition-colors ${activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
          {children}
          {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 animate-slide-down-fade"></div>}
      </button>
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <AssignRoleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} students={students} clubs={clubs} onAssign={onAssignRole} />

        <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-white">Administrator Dashboard</h1>
            <p className="text-lg text-gray-400">Welcome, {user.name}.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard title="Total Clubs" value={clubs.length} delay={100} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
            <StatCard title="Total Events" value={events.length} delay={200} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
            <StatCard title="Student Body" value={students.length} delay={300} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
            <StatCard title="Contributors" value={contributors.length} delay={400} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} />
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg flex">
            <TabButton tab="management">User Management</TabButton>
            <TabButton tab="analytics">Analytics</TabButton>
            {/* <TabButton tab="payments">Payments</TabButton>
            <TabButton tab="eventpayments">Event Payments</TabButton>
            <TabButton tab="phonepe">PhonePe Accounts</TabButton> */}
            {/* <TabButton tab="settings">Settings</TabButton> */}
        </div>
        
        <div className="mt-8 animate-tab-content-enter">
            {activeTab === 'management' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
                        <h2 className="text-xl font-bold text-white">Assign Contributor Role</h2>
                        <p className="text-sm text-gray-400 italic">Note: Role change requests are handled offline. Use this tool to update the application's contributor mapping.</p>
                        <button onClick={() => setIsModalOpen(true)} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                            Assign Role to Student
                        </button>
                    </div>
                     <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                           <h2 className="text-xl font-bold text-white">Current Contributors ({filteredContributors.length})</h2>
                           <input type="text" placeholder="Filter by name or roll no..." value={contributorSearch} onChange={e => setContributorSearch(e.target.value)} className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-md text-sm w-1/2"/>
                        </div>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                           {filteredContributors.map((c, i) => <ContributorCard key={c.id} contributor={c} clubs={clubs} onRevoke={onRevokeRole} currentUserId={user.id!} />)}
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'analytics' && (
                <div className="text-center bg-slate-900 p-12 rounded-lg border border-slate-800">
                    <div className="inline-block p-4 bg-yellow-500/10 rounded-full mb-4">
                        <svg className="w-12 h-12 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white">Analytics Section Coming Soon!</h2>
                    <p className="mt-2 text-gray-400 max-w-lg mx-auto">
                        We are currently building a powerful analytics dashboard to provide insights into event popularity, user engagement, and club growth. Please check back later.
                    </p>
                </div>
            )}
            {activeTab === 'payments' && (
                <PaymentDashboard user={user} clubs={clubs} />
            )}
            {activeTab === 'phonepe' && (
                <div className="space-y-6">
                    <PhonePeAccountManager user={user} clubs={clubs} />
                </div>
            )}
             {/* {activeTab === 'settings' && (
                 <div className="text-center bg-slate-900 p-12 rounded-lg border border-slate-800">
                    <h2 className="text-3xl font-bold text-white">App Settings</h2>
                    <p className="mt-2 text-gray-400 max-w-lg mx-auto">
                        Application settings will be displayed here in a future update. The application is currently running on mock data.
                    </p>
                </div>
            )} */}
            {activeTab === 'eventpayments' && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Event Payments</h2>
                    <button
                      onClick={loadEventPayments}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      disabled={isLoadingPayments}
                    >
                      {isLoadingPayments ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                  {isLoadingPayments ? (
                    <div className="text-gray-400">Loading payments...</div>
                  ) : eventPayments.length === 0 ? (
                    <div className="text-gray-400">No payments found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="py-2 text-left text-gray-400">Event</th>
                            <th className="py-2 text-left text-gray-400">User</th>
                            <th className="py-2 text-left text-gray-400">Email</th>
                            <th className="py-2 text-left text-gray-400">Amount</th>
                            <th className="py-2 text-left text-gray-400">Payment ID</th>
                            <th className="py-2 text-left text-gray-400">Status</th>
                            <th className="py-2 text-left text-gray-400">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventPayments.map((p, i) => (
                            <tr key={p.paymentId + i} className="border-b border-slate-800">
                              <td className="py-2 text-white">{p.eventName}</td>
                              <td className="py-2 text-white">{p.userName}</td>
                              <td className="py-2 text-gray-400">{p.userEmail}</td>
                              <td className="py-2 text-green-400 font-bold">₹{p.amount}</td>
                              <td className="py-2 text-xs text-gray-300">{p.paymentId}</td>
                              <td className="py-2">
                                <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                                  {p.paymentStatus}
                                </span>
                              </td>
                              <td className="py-2 text-gray-400">
                                {p.timestamp && p.timestamp.seconds
                                  ? new Date(p.timestamp.seconds * 1000).toLocaleString()
                                  : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
            )}
        </div>
    </div>
  );
};

export default DevAdminProfile;