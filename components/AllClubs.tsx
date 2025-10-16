import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SectionHeader from './SectionHeader';
import { Club, User, ClubTeamMember, Application } from '../types';
import { CLUBS } from '../constants';
import { firestoreDataService } from '../services/firestoreDataService';

interface AllClubsProps {
  clubs: Club[];
  user: User;
  allUsers: User[];
  applications: Application[];
  onCreateClub: (newClubData: {
    name: string;
    tagline: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    achievements?: string[];
    team?: ClubTeamMember[];
    recruitmentOpen?: boolean;
    recruitmentQuestions?: string[];
  }, assignedAdminId: string) => void;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input id={id} {...props} className="block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
    </div>
);


const CLUB_CATEGORIES = [
  { value: 'Technical', label: 'Technical' },
  { value: 'Cultural', label: 'Cultural' },
  { value: 'Sports', label: 'Sports' },
  // Add more categories if needed
];

const CreateClubModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    students: User[];
    onCreateClub: (newClubData: {
        name: string;
        tagline: string;
        description?: string;
        logoUrl?: string;
        bannerUrl?: string;
        achievements?: string[];
        team?: ClubTeamMember[];
        recruitmentOpen?: boolean;
        recruitmentQuestions?: string[];
        category?: string;
    }, assignedAdminId: string) => void;
}> = ({ isOpen, onClose, students, onCreateClub }) => {
    const [clubName, setClubName] = useState('');
    const [tagline, setTagline] = useState('');
    const [description, setDescription] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [achievements, setAchievements] = useState<string[]>([]);
    const [team, setTeam] = useState<ClubTeamMember[]>([]);
    const [recruitmentOpen, setRecruitmentOpen] = useState<boolean | undefined>(undefined);
    const [recruitmentQuestions, setRecruitmentQuestions] = useState<string[]>([]);
    const [selectedAdminDetails, setSelectedAdminDetails] = useState<User | null>(null);

    const [rollNumber, setRollNumber] = useState('');
    const [foundStudent, setFoundStudent] = useState<User | null>(null);
    const [error, setError] = useState('');
    const [category, setCategory] = useState<string>('Technical');

    const handleSearch = async () => {
        const student = await firestoreDataService.getStudentByRollNumber(rollNumber);
        setSelectedAdminDetails(student || null);
        if (student) {
            setFoundStudent(student);
            setError('');
            console.log(student);
        } else {
            setFoundStudent(null);
            setError('Student with this roll number not found.');
        }
    };

    const handleSubmit = () => {
        if (clubName && tagline && foundStudent) {
            onCreateClub({
                name: clubName,
                tagline,
                description,
                logoUrl,
                bannerUrl,
                achievements,
                team: [{ id: foundStudent.id!, name: foundStudent.name, position: 'Admin' }],
                recruitmentOpen,
                recruitmentQuestions,
                category // <-- Pass category
            }, foundStudent.id!);
        }
    };

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'logo') {
                    setLogoUrl(reader.result as string);
                } else {
                    setBannerUrl(reader.result as string);
                }
            };
            reader.readAsDataURL(file);
        } else if (file) {
            alert('Please select a valid image file.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-form-enter" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-800 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white">Create a New Club</h2>
                    <p className="text-sm text-gray-400">Provide basic details and assign an initial admin. More details can be added by the admin later.</p>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Removed template dropdown */}
                    <InputField label="Club Name" id="clubName" type="text" value={clubName} onChange={e => setClubName(e.target.value)} required placeholder="e.g., The Photography Club" />
                    <InputField label="Club Tagline" id="tagline" type="text" value={tagline} onChange={e => setTagline(e.target.value)} required placeholder="e.g., Capturing moments, creating memories." />
                    {/* Club Category Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Club Category</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md"
                        >
                            {CLUB_CATEGORIES.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <InputField label="Description" id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div>
                            <label htmlFor="logo" className="block text-sm font-medium text-gray-300 mb-1">Club Logo (Optional)</label>
                            <input id="logo" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600" />
                        </div>
                        {logoUrl && <img src={logoUrl} alt="Logo preview" className="w-20 h-20 rounded-full object-cover border-2 border-slate-700 justify-self-center md:justify-self-start" />}
                    </div>
                    
                    <div>
                        <label htmlFor="banner" className="block text-sm font-medium text-gray-300 mb-1">Club Banner (Optional)</label>
                        <input id="banner" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600" />
                        {bannerUrl && <img src={bannerUrl} alt="Banner preview" className="w-full h-20 rounded-md object-cover border-2 border-slate-700 mt-2" />}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Recruitment Open</label>
                        <select value={recruitmentOpen === undefined ? '' : String(recruitmentOpen)} onChange={e => setRecruitmentOpen(e.target.value === '' ? undefined : e.target.value === 'true')} className="block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md">
                            <option value="">— Not set —</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Recruitment Questions (comma separated)</label>
                        <input
                          className="block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md"
                          value={recruitmentQuestions.join(', ')}
                          onChange={e =>
                            setRecruitmentQuestions(
                              e.target.value.split(',').map(s => s.trimStart()) // only trim left side
                            )
                          }
                        />

                    </div>
                    
                    <div className="pt-4 border-t border-slate-800">
                        <h3 className="text-lg font-semibold text-white mb-2">Assign Initial Admin</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search student by Roll Number..."
                                value={rollNumber}
                                onChange={e => setRollNumber(e.target.value)}
                                className="flex-grow px-3 py-2 bg-slate-800 border border-slate-600 rounded-md"
                            />
                            <button onClick={handleSearch} className="px-4 py-2 bg-slate-700 rounded-md font-semibold hover:bg-slate-600">Search</button>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        {!foundStudent && (
                            <p className="text-amber-400 text-xs mt-2">Selecting the initial admin is required to create the club.</p>
                        )}
                        {foundStudent && (
                            <div className="mt-3 p-4 bg-green-900/50 border border-green-500/30 rounded-lg animate-fade-in-content flex items-center gap-3">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                               <div>
                                <p className="font-bold text-white">{selectedAdminDetails?.name}</p>
                                <p className="text-sm text-gray-300">Roll Number: {selectedAdminDetails?.rollNumber || 'N/A'}</p>
                                <p className="text-sm text-green-300">Student found and selected as admin.</p>
                               </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-6 border-t border-slate-800 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-700 rounded-md font-semibold hover:bg-slate-600">Cancel</button>
                    <button onClick={handleSubmit} disabled={!clubName || !tagline || !foundStudent} className="px-4 py-2 bg-indigo-600 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">Create Club & Assign</button>
                </div>
            </div>
        </div>
    );
};

const ClubShowcaseCard: React.FC<{ club: Club; reverse?: boolean; user: User; applications: Application[] }> = ({ club, reverse = false, user, applications }) => {
  // Helper to get user's application for a club
  const getUserApplicationStatus = (clubId: string) => {
    const app = applications.find(a => a.clubId === clubId && a.userId === user.id);
    console.log(app)
    if (!app) return null;
    if (app.status === 'pending') return 'Application Pending';
    if (app.status === 'accepted') return 'Application Accepted';
    if (app.status === 'rejected') return 'Application Rejected';
    return null;
  };

  const appStatus = getUserApplicationStatus(club.id);

  return (
    <Link
      to={`/clubs/${club.id}`}
      className="group block cursor-pointer bg-slate-900/50 hover:bg-slate-800/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-1 w-full"
      // style removed: let width be full
    >
      <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-stretch`}>
        <div
          className="md:w-2/5 relative overflow-hidden"
          style={{ minHeight: 256, maxHeight: 256, height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img
            src={club.bannerUrl}
            alt={`${club.name} banner`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            style={{ minHeight: 256, maxHeight: 256, height: 256 }}
          />
          <img
            src={club.logoUrl}
            alt={`${club.name} logo`}
            className="absolute bottom-4 left-4 w-20 h-20 rounded-full border-4 border-slate-800 shadow-lg object-cover bg-slate-900"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className="md:w-3/5 p-8 text-left flex flex-col justify-center" style={{ minHeight: 256 }}>
          <div>
            <h3 className="text-3xl font-extrabold text-white">{club.name}</h3>
            <p className="mt-2 text-gray-300">{club.tagline}</p>
            <p className="mt-4 text-gray-400 text-sm line-clamp-3">{club.description}</p>
            <div className="mt-6">
              <span className="text-indigo-500 font-semibold group-hover:text-indigo-400 transition-colors flex items-center">
                View Details
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
          <div className="mt-4">
            {appStatus ? (
              <span className={
                appStatus === 'Application Pending' ? "text-yellow-400 font-semibold" :
                appStatus === 'Application Accepted' ? "text-green-400 font-semibold" :
                "text-red-400 font-semibold"
              }>
                {appStatus}
              </span>
            ) : (
              <span className="text-gray-400">Interested in Joining?</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

const AllClubs: React.FC<AllClubsProps> = ({ clubs, user, allUsers, applications, onCreateClub }) => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  //we are here
  const students = useMemo(() => allUsers.filter(u => u.role === 'student'), [allUsers]);
  
  const technicalClubs = clubs.filter(c => ['robotics', 'coding', 'aiml'].includes(c.id));
  const culturalClubs = clubs.filter(c => ['cultural'].includes(c.id));
  const otherClubs = clubs.filter(c => !['robotics', 'coding', 'aiml', 'cultural'].includes(c.id));

  return (
    <section className="py-16 relative container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
       <CreateClubModal
            isOpen={isCreateModalOpen}
            onClose={() => setCreateModalOpen(false)}
            students={students}
            onCreateClub={(clubData, adminId) => {
                onCreateClub(clubData, adminId);
                setCreateModalOpen(false);
            }}
        />

       <div className="relative z-10">
           <div className="flex justify-between items-start mb-12">
                <div className="text-left">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter">Student Clubs</h2>
                    <p className="mt-4 max-w-2xl text-lg text-gray-400">Explore our vibrant student community and find your passion. All clubs, one hub.</p>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="flex-shrink-0 bg-indigo-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        New Club
                    </button>
                )}
            </div>
          
           {otherClubs.length > 0 && (
              <div className="mb-16">
                   <div className="space-y-12">
                       {otherClubs.map((club, index) => (
                           <ClubShowcaseCard key={club.id} club={club} reverse={index % 2 !== 0} user={user} applications={applications} />
                       ))}
                   </div>
               </div>
           )}
           
           <div className="mb-16">
               <h2 className="text-3xl font-bold text-white mb-8 border-l-4 border-indigo-500 pl-4">Technical Clubs</h2>
               <div className="space-y-12">
                   {technicalClubs.map((club, index) => (
                       <ClubShowcaseCard key={club.id} club={club} reverse={index % 2 !== 0} user={user} applications={applications} />
                   ))}
               </div>
           </div>

           {culturalClubs.length > 0 && (
             <div>
                 <h2 className="text-3xl font-bold text-white mb-8 border-l-4 border-pink-500 pl-4">Arts & Culture</h2>
                 <div className="space-y-12">
                     {culturalClubs.map((club, index) => (
                         <ClubShowcaseCard key={club.id} club={club} reverse={index % 2 !== 0} user={user} applications={applications} />
                     ))}
                 </div>
             </div>
           )}
       </div>
    </section>
  );
};

export default AllClubs;