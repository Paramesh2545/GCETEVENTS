import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Club, EventStatus, User, Application, Event as EventType, ClubTeamMember } from '../types';
import EventsSection from './EventsSection';
import SectionHeader from './SectionHeader';
import CreateEventForm from './CreateEvent';
import ContributorManager from './ContributorManager';
import PaymentDetailsManager from './PaymentDetailsManager';
import { firestoreDataService } from '../services/firestoreDataService';
// import { useRef, useState } from 'react';
import { uploadClubImage } from '../services/firebaseStorageService';
import * as XLSX from 'xlsx';

interface ApplicationModalProps {
    club: Club;
    user: User;
    isSuccess: boolean;
    onSubmit: (formattedAnswers: { question: string; answer: string }[]) => void;
    onClose: () => void;
}

const ApplicationModal: React.FC<ApplicationModalProps> = ({ club, user, isSuccess, onSubmit, onClose }) => {
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const hasQuestions = club.recruitmentQuestions && club.recruitmentQuestions.length > 0;


    const handleAnswerChange = (index: number, value: string) => {
        setAnswers(prev => ({ ...prev, [index]: value }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formattedAnswers = club.recruitmentQuestions?.map((q, i) => ({
            question: q,
            answer: answers[i] || ''
        })) || [];
        onSubmit(formattedAnswers);
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-lg w-full relative animate-form-enter" onClick={e => e.stopPropagation()}>
                {isSuccess ? (
                    <div className="p-8 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center animate-circle-pulse">
                            <svg className="w-16 h-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path className="checkmark-path" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Application Submitted!</h2>
                        <p className="text-gray-400 mt-2">The club admins will review your application shortly.</p>
                    </div>
                ) : (
                    <>
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-white text-center mb-1">Apply to {club.name}</h2>
                            <p className="text-gray-400 text-center mb-6">Your complete profile information will be shared with the admin.</p>
                            <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {hasQuestions ? (
                                    club.recruitmentQuestions?.map((question, index) => (
                                        <div key={index}>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">{question}</label>
                                            <textarea
                                                required
                                                rows={3}
                                                className="block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                value={answers[index] || ''}
                                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-300 bg-slate-800/50 p-4 rounded-md border border-slate-700">
                                        <p>This club has no specific application questions. Click submit to send your joining request directly.</p>
                                    </div>
                                )}
                                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Submit Application</button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

interface ClubDetailProps {
  club: Club;
  clubEvents: EventType[];
  setEvents: (events: EventType[]) => void;
  user: User | null;
  applications: Application[];
  allUsers?: User[];
  onUpdateClub: (updatedClub: Club) => void;
  onApplicationStatusChange: (clubId: string, application: Application, status: 'accepted' | 'rejected') => void;
  onNewApplication: (application: Omit<Application, 'id'>) => void;
  onCreateEvent: (event: EventType) => void;
  onUpdateEvent: (event: EventType) => void;
  registrations: {[key: string]: number};
  onAddClubMember?: (clubId: string, memberData: { name: string; position: string; imageUrl?: string }) => void;
  onRemoveClubMember?: (clubId: string, memberId: string) => void;
  onUpdateClubMember?: (clubId: string, memberId: string, memberData: { name?: string; position?: string; imageUrl?: string }) => void;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input id={id} {...props} className="block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
    </div>
);

const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <textarea id={id} {...props} className="block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
    </div>
);

const ApplicationResponsesModal: React.FC<{ application: Application; onClose: () => void }> = ({ application, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full relative max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-700 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <img src={application.userImageUrl} className="w-14 h-14 rounded-full mr-4" alt={application.userName} />
                            <div>
                                <h3 className="text-2xl font-bold text-white">{application.userName}</h3>
                                <p className="text-sm text-gray-400">{application.userEmail}</p>
                                <p className="text-sm text-gray-400">{application.userBranch} - {application.userYear}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto">
                    <h4 className="text-lg font-semibold text-white mb-4">Application Responses</h4>
                    <div className="space-y-4">
                        {application.answers.map((ans, i) => (
                            <div key={i}>
                                <p className="text-sm font-semibold text-gray-300">{ans.question}</p>
                                <p className="text-gray-400 bg-slate-800 p-3 rounded-md mt-1 whitespace-pre-wrap">{ans.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AllMembersModal: React.FC<{ members: ClubTeamMember[]; clubName: string; onClose: () => void; isClosing: boolean }> = ({ members, clubName, onClose, isClosing }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-backdrop-fade-in" onClick={onClose}>
            <div 
                className={`bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col ${isClosing ? 'animate-modal-content-exit' : 'animate-form-enter'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-slate-700 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-bold text-white">All Members</h3>
                            <p className="text-gray-400">of {clubName}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                        {members.map(member => (
                            <div key={member.id} className="bg-slate-800/50 p-3 rounded-md">
                                <p className="font-semibold text-white truncate">{member.name}</p>
                                <p className="text-sm text-indigo-400 truncate">{member.position || 'Member'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


const ClubDetail: React.FC<ClubDetailProps> = ({
  club, clubEvents, setEvents, user, applications, allUsers = [],
  onUpdateClub, onApplicationStatusChange, onNewApplication, onCreateEvent, onUpdateEvent, registrations,
  onAddClubMember, onRemoveClubMember, onUpdateClubMember
}) => {
  const [activeTab, setActiveTab] = useState<'ongoing' | 'past'>('ongoing');
  const [adminTab, setAdminTab] = useState<'recruitment' | 'members' | 'events' | 'settings' | 'payments'>('recruitment');
  const [applicationState, setApplicationState] = useState<'idle' | 'applying' | 'success'>('idle');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [viewingApplication, setViewingApplication] = useState<Application | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const navigate = useNavigate();
  
  const [localClub, setLocalClub] = useState<Club>(club);
  const [justApplied, setJustApplied] = useState(false);
  useEffect(() => {
    setLocalClub(club);
  }, [club]);

  const [isLoading, setIsLoading] = useState(true);

// const fetchClubEvents = async () => {
//   if (!club?.id) return;

//   setIsLoading(true);
//   try {
//     const freshEvents = await firestoreDataService.getEvents(); // fetch directly
//     setEvents(freshEvents.filter(e => e.organizerClubId === club.id));
//   } catch (error) {
//     console.error("Error fetching club events:", error);
//   } finally {
//     setIsLoading(false);
//   }
// };

// useEffect(() => {
//   fetchClubEvents();
//   // only re-run when club.id changes
// }, [club?.id]);


// useEffect(() => {
//   // Only fetch when club.id changes, not on every render
//   fetchData();
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [club.id]);

// const fetchData = useCallback(async () => {
//   try {
//     setIsLoading(true);
//     const [clubEvents] = await Promise.all([
//       firestoreDataService.getClubEvents(club.id)
//     ]);
//     setEvents(clubEvents);
//   } catch (error) {
//     console.error('Error loading registration data:', error);
//   } finally {
//     setIsLoading(false);
//   }
// }, [club.id, setEvents, firestoreDataService]);


  // New member state: rollNumber, position, selectedUser
  const [newMember, setNewMember] = useState({ rollNumber: '', position: '', imageUrl: '' });
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Handle roll number input and search
  const handleRollNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rollNumber = e.target.value;
    setNewMember(prev => ({ ...prev, rollNumber }));
    if (rollNumber.length >= 3) {
      // Search users by roll number (case-insensitive, partial match)
      const results = allUsers.filter(u =>
        u.rollNumber && u.rollNumber.toLowerCase().includes(rollNumber.toLowerCase())
      );
      setUserSearchResults(results);
    } else {
      setUserSearchResults([]);
    }
    setSelectedUser(null);
  };

  // Handle selecting a user from dropdown
  const handleSelectUser = (user: User) => {
    setSelectedUser(user); // <-- This sets the selected user in local state
    setNewMember(prev => ({
      ...prev,
      rollNumber: user.rollNumber || '',
      imageUrl: user.imageUrl || ''
    }));
    setUserSearchResults([]);
  };

  // Add member (only in local state, backend update on Save All Changes)
  const handleAddMember = () => {
    if (!selectedUser || !newMember.position) {
      alert('Please select a user and enter position.');
      return;
    }
    // Prevent duplicate member
    if (localClub.team.some(m => m.id === selectedUser.id)) {
      alert('This user is already a member.');
      return;
    }
    const memberToAdd: ClubTeamMember = {
      id: selectedUser.id,
      name: selectedUser.name,
      position: newMember.position,
      imageUrl: selectedUser.imageUrl || undefined,
      rollNumber: selectedUser.rollNumber
    };
    setLocalClub(prev => ({
      ...prev,
      team: [...prev.team, memberToAdd]
    }));
    setNewMember({ rollNumber: '', position: '', imageUrl: '' });
    setSelectedUser(null);
    setUserSearchResults([]);
  };

  const LEAD_POSITIONS = useMemo(() => ['president', 'vice president', 'secretary', 'treasurer', 'head', 'lead', 'coordinator'], []);
  const isLead = useCallback((position: string) => {
      if (!position) return false;
      return LEAD_POSITIONS.some(leadPos => position.toLowerCase().includes(leadPos));
  }, [LEAD_POSITIONS]);
  
  const teamForDisplay = useMemo(() => {
    const leads = localClub.team.filter(member => isLead(member.position));
    const otherMembers = localClub.team.filter(member => !isLead(member.position));
    // Prioritize showing leads, then fill the remaining spots with other members up to 4.
    const sortedTeam = [...leads, ...otherMembers];
    return sortedTeam.slice(0, 4);
  }, [localClub.team, isLead]);

  
  useEffect(() => {
    if (applicationState === 'success') {
        const timer = setTimeout(() => {
            setApplicationState('idle');
        }, 2500);
        return () => clearTimeout(timer);
    }
  }, [applicationState]);

  const handleSubmitApplication = (formattedAnswers: { question: string; answer: string }[]) => {
      if (!user) return;
      onNewApplication({
          userId: user.id!,
          userName: user.name,
          userImageUrl: `https://picsum.photos/seed/${user.name.replace(/\s+/g, '')}/200/200`,
          userEmail: user.email || 'not-provided@college.edu',
          userYear: user.year || 'N/A',
          userBranch: user.branch || 'N/A',
          userMobile: user.mobile || 'N/A',
          clubId: club.id,
          status: 'pending',
          answers: formattedAnswers
      });
      setApplicationState('success');
      setJustApplied(true);
  };

  const upcomingEvents = useMemo(() => clubEvents.filter(e => e.status === EventStatus.Upcoming || e.status === EventStatus.Ongoing), [clubEvents]);
  const pastEvents = useMemo(() => clubEvents.filter(e => e.status === EventStatus.Past), [clubEvents]);

  const handleUpdateMemberPosition = (memberId: string, newPosition: string) => {
    // Only update local state, do NOT change adminTab here
    setLocalClub(prev => ({
      ...prev,
      team: prev.team.map(m => m.id === memberId ? { ...m, position: newPosition } : m)
    }));
  }
  
  const handleRemoveMember = async (memberId: string) => {
    if (onRemoveClubMember) {
      await onRemoveClubMember(localClub.id, memberId);
    } else {
      // Fallback to local state if backend function not provided
      setLocalClub(prev => ({
        ...prev,
        team: prev.team.filter(m => m.id !== memberId)
      }));
    }
  };

  const handleClubInfoChange = (field: keyof Omit<Club, 'id' | 'team' | 'eventIds' | 'achievements' | 'recruitmentQuestions'>, value: string | boolean) => {
    setLocalClub(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (index: number, value: string) => {
    setLocalClub(prev => {
        const newQuestions = [...(prev.recruitmentQuestions || [])];
        newQuestions[index] = value;
        return {...prev, recruitmentQuestions: newQuestions};
    });
  }

  const handleAddQuestion = () => {
    setLocalClub(prev => ({...prev, recruitmentQuestions: [...(prev.recruitmentQuestions || []), '']}));
  }

  const handleRemoveQuestion = (index: number) => {
    setLocalClub(prev => {
      const newQuestions = [...(prev.recruitmentQuestions || [])];
      if (newQuestions.length > 1) {
        return {...prev, recruitmentQuestions: newQuestions.filter((_, i) => i !== index)};
      }
      return prev;
    });
  }
  
  const handleSaveChanges = async () => {
    // Ensure localClub.team contains all new members before sending to backend

    // If you want to guarantee that the latest user data (from allUsers) is appended for each member,
    // rebuild the team array before saving:
    const updatedTeam = localClub.team.map(member => {
      // Find the latest user data for this member
      const userData = allUsers.find(u => u.id === member.id);
      if (userData) {
        // Merge user data with member data, prioritizing member's position and imageUrl
        return {
          id: userData.id,
          name: userData.name,
          rollNumber: userData.rollNumber,
          imageUrl: member.imageUrl || userData.imageUrl,
          position: member.position,
          // Add other fields if needed
        };
      }
      // If not found, keep the member as is
      return member;
    });

    // Find removed members (those present in club.team but not in localClub.team)
    const previousTeam = club.team || [];
    const currentTeam = localClub.team || [];
    const removedMembers = previousTeam.filter(
      prevMember => !currentTeam.some(m => m.id === prevMember.id)
    );

    // Update removed members' user profiles: remove clubId from managedClubIds and depromote if needed
    console.log("hola", removedMembers);
    for (const member of removedMembers) {
      if (member.id) {
        try {
          const userProfile = allUsers.find(u => u.id === member.id);
          if (userProfile && Array.isArray(userProfile.managedClubIds)) {
            const updatedManagedClubIds = userProfile.managedClubIds.filter(id => id !== localClub.id);
            const newRole = updatedManagedClubIds.length === 0 ? 'student' : userProfile.role;
            await firestoreDataService.updateClubMemberProfile(member.id, {
              managedClubIds: updatedManagedClubIds,
              role: newRole
            });
          }
        } catch (err) {
          // Ignore errors for now
        }
      }
    }

    // Send the updated club details with the rebuilt team array
    await onUpdateClub({ ...localClub, team: updatedTeam });

    // For each member in localClub.team, update their user profile to include this club in managedClubIds if not already present
    if (user && localClub.team && localClub.id) {
      for (const member of localClub.team) {
        // Only update for real users (not dummy ids)
        if (member.id) {
          try {
            // Fetch user profile (assume you have allUsers loaded)
            const userProfile = allUsers.find(u => u.id === member.id);
            if (userProfile) {
              // Add club to managedClubIds if not present
              const managedClubIds = Array.isArray(userProfile.managedClubIds)
                ? Array.from(new Set([...userProfile.managedClubIds, localClub.id]))
                : [localClub.id];
              // Set role to contributor if not admin
              const newRole = userProfile.role === 'admin' ? 'admin' : 'contributor';
              // Update user profile in backend
              await firestoreDataService.updateClubMemberProfile(member.id, {
                managedClubIds,
                role: newRole,
                name: member.name // ensure name is up to date
              });
            }
          } catch (err) {
            // Ignore errors for now
          }
        }
      }
    }
  };

  const handleCloseMembersModal = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsMembersModalOpen(false);
      setIsAnimatingOut(false);
    }, 300);
  };
  const pendingApplications = useMemo(() => applications.filter(a => a.status === 'pending'), [applications]);
  
  // FIX: Use localClub state for all checks to ensure UI is consistent with edits.
  const isMember = useMemo(() => localClub.team.some(m => m.name === user?.name), [localClub.team, user]);
  const hasAppliedServer = useMemo(() => applications.some(a => a.userId === user?.id), [applications, user]);
  const hasApplied = hasAppliedServer || justApplied;
  const isManager = user?.role === 'contributor' && user?.managedClubIds?.includes(localClub.id);


//   console.log('ClubDetail received clubEvents:', clubEvents);

  // Helper: check if user is an admin for this club
  const isClubAdmin = useMemo(() => {
    if (!user) return false;
    // Give admin access if:
    // - user.role === 'admin'
    // - OR user.role === 'contributor' AND user's position in club.team is 'admin'
    // - OR user.id is in club.adminIds (if you use that array)
    if (user.role === 'admin') return true;
    if (club.adminIds && club.adminIds.includes(user.id)) return true;
    if (user.role === 'contributor') {
      const member = club.team?.find(m => m.id === user.id);
      if (member && member.position && member.position.toLowerCase().includes('admin')) {
        return true;
      }
    }
    return false;
  }, [user, club]);

  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Track uploading state
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  // Handle image upload for logo/banner
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logoUrl' | 'bannerUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === 'logoUrl') setLogoUploading(true);
    if (type === 'bannerUrl') setBannerUploading(true);
    try {
      // Upload to Firebase Storage and get URL
      const url = await uploadClubImage(file, club.id, type === 'logoUrl' ? 'logo' : 'banner');
      setLocalClub(prev => ({ ...prev, [type]: url }));
    } catch (err) {
      alert('Image upload failed');
    } finally {
      if (type === 'logoUrl') setLogoUploading(false);
      if (type === 'bannerUrl') setBannerUploading(false);
    }
  };

  // Helper to download registrations as Excel
  const handleDownloadRegistrations = async (eventId: string, eventName: string) => {
    // Fetch registrations for this event
    // You may need to pass club.id if not available in event
    const clubId = club.id;
    try {
      const registrations = await import('../services/eventRegistrationService')
        .then(mod => mod.eventRegistrationService.getEventRegistrations(eventId, clubId));
      if (!registrations || registrations.length === 0) {
        alert('No registrations found for this event.');
        return;
      }
      // Prepare data for Excel
      const data = registrations.map(reg => ({
        Name: reg.userName,
        Email: reg.userEmail,
        Phone: reg.userPhone || '',
        RollNumber: reg.userRollNumber || '',
        Branch: reg.userBranch || '',
        Year: reg.userYear || '',
        RegistrationDate: reg.registrationDate?.seconds
          ? new Date(reg.registrationDate.seconds * 1000).toLocaleString()
          : '',
        Status: reg.status,
        PaymentStatus: reg.paymentStatus || '',
        CheckIn: reg.checkInStatus === 'checked_in' ? 'Yes' : 'No'
      }));
      // Create worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
      // Download as Excel file
      XLSX.writeFile(workbook, `${eventName.replace(/\s+/g, '_')}_registrations.xlsx`);
    } catch (error) {
      alert('Failed to download registrations.');
      console.error(error);
    }
  };

  return (
    <>
      {applicationState !== 'idle' && user && (
        <ApplicationModal
          club={localClub} // Use localClub for consistent data
          user={user}
          isSuccess={applicationState === 'success'}
          onSubmit={handleSubmitApplication}
          onClose={() => setApplicationState('idle')}
        />
      )}
      {isCreatingEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
              <CreateEventForm clubId={club.id} onClose={() => setIsCreatingEvent(false)} onCreateEvent={(newEvent) => { onCreateEvent(newEvent); setIsCreatingEvent(false); }} />
            </div>
        </div>
      )}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
              <CreateEventForm clubId={club.id} eventToEdit={editingEvent} onUpdateEvent={(updatedEvent) => { onUpdateEvent(updatedEvent); setEditingEvent(null); }} onClose={() => setEditingEvent(null)} />
            </div>
        </div>
      )}
      {viewingApplication && (
        <ApplicationResponsesModal application={viewingApplication} onClose={() => setViewingApplication(null)} />
      )}
      {isMembersModalOpen && (
        <AllMembersModal members={localClub.team} clubName={localClub.name} onClose={handleCloseMembersModal} isClosing={isAnimatingOut} />
      )}

      <div className="bg-slate-950 text-white">
        <div className="relative h-64 md:h-80 w-full">
            <img src={localClub.bannerUrl} alt={`${localClub.name} banner`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>
        </div>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-20 md:-mt-24 flex flex-col md:flex-row items-center md:items-end gap-6">
                <img src={localClub.logoUrl} alt={`${localClub.name} logo`} className="w-32 h-32 md:w-48 md:h-48 rounded-2xl border-4 border-slate-800 shadow-lg object-cover" />
                <div className="text-center md:text-left pb-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold">{localClub.name}</h1>
                    <p className="text-lg text-gray-400 mt-1">{localClub.tagline}</p>
                </div>
            </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-24">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <h3 className="text-xl font-bold mb-4">About Us</h3>
                <p className="text-gray-400 whitespace-pre-wrap">{localClub.description}</p>
              </div>
              {!isManager && (
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center">
                    <h3 className="text-xl font-bold mb-2">Interested in Joining?</h3>
                    {isMember ? (
                        <p className="text-green-400 font-semibold">You are a member of this club!</p>
                    ) : hasApplied ? (
                        <p className="text-yellow-400 font-semibold">Your application is pending.</p>
                    ) : (
                        <>
                            <p className="text-gray-400 text-sm mb-4">
                                {localClub.recruitmentOpen ? 'Recruitment is currently open!' : 'Recruitment is closed, but you can still send a joining request.'}
                            </p>
                            <button onClick={() => setApplicationState('applying')} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                                {localClub.recruitmentOpen ? 'Apply Now' : 'Send Request'}
                            </button>
                        </>
                    )}
                </div>
              )}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Our Team</h3>
                    {localClub.team.length > 4 && (
                        <button onClick={() => setIsMembersModalOpen(true)} className="text-sm text-indigo-400 hover:underline">View All</button>
                    )}
                </div>
                <div className="space-y-4">
                    {teamForDisplay.map(member => (
                        <div key={member.id} className="flex items-center space-x-3">
                            <img src={member.imageUrl || `https://picsum.photos/seed/${member.name.replace(/\s+/g, '')}/200/200`} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                                <p className="font-semibold text-white">{member.name}</p>
                                <p className="text-sm text-indigo-400">{member.position}</p>
                            </div>
                        </div>
                    ))}
                </div>
              </div>

            </div>
            <div className="lg:col-span-2">
                {isClubAdmin ? (
                  <div className="bg-slate-900 rounded-2xl border border-slate-800">
                    <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                      <button onClick={() => setAdminTab('recruitment')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${adminTab === 'recruitment' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>Recruitment ({pendingApplications.length})</button>
                      <button onClick={() => setAdminTab('members')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${adminTab === 'members' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>Members</button>
                      <button onClick={() => setAdminTab('events')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${adminTab === 'events' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>Events</button>
                      <button onClick={() => setAdminTab('payments')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${adminTab === 'payments' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>Payments</button>
                      <button onClick={() => setAdminTab('settings')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${adminTab === 'settings' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>Settings</button>
                    </div>
                    <div className="p-6">
                      {/* Recruitment tab */}
                      {adminTab === 'recruitment' && (
                        <div className="space-y-4">
                          <h3 className="text-xl font-bold">Pending Applications</h3>
                          {pendingApplications.length > 0 ? pendingApplications.map(app => (
                            <div key={app.id} className="bg-slate-800/50 p-3 rounded-lg flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <img src={app.userImageUrl} alt={app.userName} className="w-10 h-10 rounded-full"/>
                                    <p className="font-semibold">{app.userName}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setViewingApplication(app)} className="text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600">View</button>
                                    <button onClick={() => onApplicationStatusChange(localClub.id, app, 'accepted')} className="text-xs px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700">Accept</button>
                                    <button onClick={() => onApplicationStatusChange(localClub.id, app, 'rejected')} className="text-xs px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700">Reject</button>
                                </div>
                            </div>
                          )) : <p className="text-gray-400">No pending applications.</p>}
                        </div>
                      )}
                      {/* Members tab: allow editing members */}
                      {adminTab === 'members' && (
                        <div>
                          <h3 className="text-xl font-bold mb-4">Manage Members</h3>
                          <div className="space-y-3 max-h-72 overflow-y-auto pr-2 mb-4">
                            {localClub.team.map((member) => (
                              <div key={member.id} className="bg-slate-800/50 p-3 rounded-lg flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {/* ...existing member avatar code... */}
                                  <p className="font-semibold text-white truncate">{member.name}</p>
                                  {/* Editable position for admins */}
                                  <input
                                    type="text"
                                    value={member.position}
                                    onChange={(e) => {
                                      setLocalClub(prev => ({
                                        ...prev,
                                        team: prev.team.map(m => m.id === member.id ? { ...m, position: e.target.value } : m)
                                      }));
                                    }}
                                    placeholder="Position"
                                    className="flex-1 min-w-0 px-2 py-1 bg-slate-700 border border-slate-600 rounded-md text-sm"
                                    disabled={!isClubAdmin}
                                  />
                                </div>
                                {/* Remove button for admins */}
                                {isClubAdmin && (
                                  <button onClick={() => setLocalClub(prev => ({
                                    ...prev,
                                    team: prev.team.filter(m => m.id !== member.id)
                                  }))} className="text-xs px-3 py-1.5 rounded-md bg-red-600/50 hover:bg-red-600/80 text-red-300 flex-shrink-0">
                                    Remove
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {/* Add new member for admins */}
                          {isClubAdmin && (
                            <div className="border-t border-slate-700 pt-4 mt-4">
                              <h4 className="text-lg font-semibold mb-2">Add New Member</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">Roll Number</label>
                                  <input
                                    type="text"
                                    value={newMember.rollNumber}
                                    onChange={handleRollNumberChange}
                                    placeholder="Enter roll number"
                                    className="block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md"
                                  />
                                  {/* Dropdown for user search results */}
                                  {userSearchResults.length > 0 && (
                                    <div className="bg-slate-900 border border-slate-700 rounded-md mt-1 max-h-40 overflow-y-auto z-10 absolute">
                                      {userSearchResults.map(u => (
                                        <div
                                          key={u.id}
                                          className="px-3 py-2 hover:bg-slate-800 cursor-pointer flex items-center gap-2"
                                          onClick={() => handleSelectUser(u)}
                                        >
                                          <img src={u.imageUrl || `https://picsum.photos/seed/${u.name.replace(/\s+/g, '')}/40/40`} alt={u.name} className="w-6 h-6 rounded-full" />
                                          <span className="font-semibold">{u.name}</span>
                                          <span className="text-xs text-gray-400">{u.rollNumber}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {/* Selected user preview */}
                                  {selectedUser && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <img src={selectedUser.imageUrl || `https://picsum.photos/seed/${selectedUser.name.replace(/\s+/g, '')}/40/40`} alt={selectedUser.name} className="w-6 h-6 rounded-full" />
                                      <span className="font-semibold">{selectedUser.name}</span>
                                      <span className="text-xs text-gray-400">{selectedUser.rollNumber}</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">Position</label>
                                  <input
                                    type="text"
                                    value={newMember.position}
                                    onChange={e => setNewMember(prev => ({ ...prev, position: e.target.value }))}
                                    placeholder="Position"
                                    className="block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md"
                                  />
                                </div>
                              </div>
                              <button onClick={handleAddMember} className="mt-4 text-sm px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold">
                                + Add Member
                              </button>
                            </div>
                          )}
                          {/* Save changes button for admins */}
                          {isClubAdmin && (
                            <div className="mt-6 flex justify-end">
                              <button onClick={handleSaveChanges} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Save All Changes</button>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Events tab */}
                      {adminTab === 'events' && (
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Manage Events</h3>
                            <button onClick={() => setIsCreatingEvent(true)} className="px-4 py-2 text-sm font-bold bg-indigo-600 rounded-lg hover:bg-indigo-700">+ New Event</button>
                          </div>
                          <div className="space-y-4">
                            {clubEvents.map(event => {
                                const isPast = event.status === EventStatus.Past;
                                const isFuture = event.status === EventStatus.Upcoming || event.status === EventStatus.Ongoing;
                                return (
                                <div key={event.id} className="bg-slate-800/50 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{event.name}</p>
                                        <p className="text-xs text-gray-400">{event.date} - {registrations[event.id] || 0} registrations</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => navigate(`/events/${event.id}`)} className="text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600">View</button>
                                        {isFuture && (
                                            <>
                                                <button onClick={() => setEditingEvent(event)} className="text-xs px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700">Edit</button>
                                                <button
                                                  onClick={() => handleDownloadRegistrations(event.id, event.name)}
                                                  className="text-xs px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700"
                                                >
                                                  Download List
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )})}
                          </div>
                        </div>
                      )}
                      {/* Payments tab: manage payment details for admins */}
                      {adminTab === 'payments' && (
                        <div>
                          <PaymentDetailsManager
                            clubId={localClub.id}
                            clubName={localClub.name}
                            isAdmin={isClubAdmin}
                          />
                        </div>
                      )}
                      {/* Settings tab: allow editing settings for admins */}
                      {adminTab === 'settings' && (
                        <div>
                          <h3 className="text-xl font-bold mb-4">Club Settings</h3>
                          <div className="space-y-4">
                            {/* Logo image upload */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">Logo Image</label>
                              <div className="flex items-center gap-4">
                                <img src={localClub.logoUrl} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-slate-700" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  ref={logoInputRef}
                                  onChange={e => handleImageUpload(e, 'logoUrl')}
                                  className="block"
                                  disabled={logoUploading}
                                />
                                {logoUploading && <span className="text-xs text-indigo-400">Uploading...</span>}
                              </div>
                            </div>
                            {/* Banner image upload */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">Banner Image</label>
                              <div className="flex items-center gap-4">
                                <img src={localClub.bannerUrl} alt="Banner" className="w-32 h-16 rounded-lg object-cover border border-slate-700" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  ref={bannerInputRef}
                                  onChange={e => handleImageUpload(e, 'bannerUrl')}
                                  className="block"
                                  disabled={bannerUploading}
                                />
                                {bannerUploading && <span className="text-xs text-indigo-400">Uploading...</span>}
                              </div>
                            </div>
                            <InputField label="Club Name" id="clubName" value={localClub.name} onChange={(e) => handleClubInfoChange('name', e.target.value)} />
                            <InputField label="Tagline" id="tagline" value={localClub.tagline} onChange={(e) => handleClubInfoChange('tagline', e.target.value)} />
                            <InputField label="Logo Image URL" id="logoUrl" value={localClub.logoUrl} onChange={(e) => handleClubInfoChange('logoUrl', e.target.value)} />
                            <InputField label="Banner Image URL" id="bannerUrl" value={localClub.bannerUrl} onChange={(e) => handleClubInfoChange('bannerUrl', e.target.value)} />
                            <TextAreaField label="Description" id="description" value={localClub.description} onChange={(e) => handleClubInfoChange('description', e.target.value)} rows={5}/>
                            
                            <div className="pt-4 border-t border-slate-700">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Recruitment Status</label>
                                <button
                                    type="button"
                                    onClick={() => handleClubInfoChange('recruitmentOpen', !localClub.recruitmentOpen)}
                                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                                        localClub.recruitmentOpen ? 'bg-indigo-600' : 'bg-slate-700'
                                    }`}
                                >
                                    <span
                                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                            localClub.recruitmentOpen ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                                <span className="ml-3 text-sm text-gray-400">{localClub.recruitmentOpen ? 'Open' : 'Closed'}</span>
                            </div>

                            <h4 className="font-semibold pt-4 border-t border-slate-700">Recruitment Questions</h4>
                            {(localClub.recruitmentQuestions || []).map((q, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <input type="text" value={q} onChange={e => handleQuestionChange(i, e.target.value)} className="flex-1 block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md"/>
                                    <button onClick={() => handleRemoveQuestion(i)} className="p-2 bg-red-600/20 text-red-400 rounded-md">&times;</button>
                                </div>
                            ))}
                            <button onClick={handleAddQuestion} className="text-sm px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600">+ Add Question</button>
                          </div>
                          
                          {/* Contributor Management Section */}
                          {user && (
                              <div className="mt-8 pt-6 border-t border-slate-700">
                                  <ContributorManager
                                      currentUser={user}
                                      club={localClub}
                                      contributors={allUsers.filter(u => u.role === 'contributor')}
                                      onContributorUpdate={() => {
                                          // This will be handled by the parent component
                                          // The data will be refreshed automatically
                                      }}
                                  />
                              </div>
                          )}
                          
                          <div className="mt-6 flex justify-end">
                            <button onClick={handleSaveChanges} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Save Settings</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Non-admins (coordinators/contributors) see only basic info and events
                  <div>
                    <div className="flex border-b border-slate-800 mb-6">
                        <button onClick={() => setActiveTab('ongoing')} className={`px-6 py-3 font-semibold ${activeTab === 'ongoing' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400'}`}>Upcoming</button>
                        <button onClick={() => setActiveTab('past')} className={`px-6 py-3 font-semibold ${activeTab === 'past' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400'}`}>Past Events</button>
                    </div>
                    {activeTab === 'ongoing' && <EventsSection title="" events={upcomingEvents} noEventsMessage="No upcoming events scheduled." />}
                    {activeTab === 'past' && <EventsSection title="" events={pastEvents} noEventsMessage="No past events found." />}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClubDetail;