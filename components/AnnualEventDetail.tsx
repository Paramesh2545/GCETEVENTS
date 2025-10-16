import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnnualEvent, AnnualEventYearlyData, Event as EventType, Club, OrganizingTeamMember, AcademicAward, SportCompetition, AcademicWinner } from '../types';
import SectionHeader from './SectionHeader';


const TeamMembersModal: React.FC<{ members: OrganizingTeamMember[]; onClose: () => void; isClosing: boolean }> = ({ members, onClose, isClosing }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-backdrop-fade-in" onClick={onClose}>
            <div 
                className={`bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-lg w-full max-h-[70vh] flex flex-col ${isClosing ? 'animate-modal-content-exit' : 'animate-form-enter'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl font-bold text-white">Full Organizing Committee</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <ul className="space-y-3">
                        {members.map((member, i) => (
                            <li key={i} className="p-3 bg-slate-800/50 rounded-md">
                                <p className="font-semibold text-white">{member.name}</p>
                                <p className="text-sm text-indigo-400">{member.position}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};


// Component for a single Sub-Event Card
const SubEventCard: React.FC<{ event: EventType; }> = ({ event }) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(`/events/${event.id}`)}
            className="bg-slate-800/50 p-4 rounded-lg flex items-center justify-between gap-4 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700 hover:border-indigo-600"
        >
            <div>
                <p className="font-bold text-white">{event.name}</p>
                <p className="text-sm text-gray-400">{event.date}</p>
            </div>
            <button className="flex-shrink-0 px-4 py-2 text-xs font-bold bg-indigo-600 rounded-lg hover:bg-indigo-700">
                Register
            </button>
        </div>
    );
};


const RankIcon: React.FC<{ rank: AcademicWinner['rank'] }> = ({ rank }) => {
    const styles = {
        1: { icon: '🏆', color: 'text-yellow-400' },
        2: { icon: '🏆', color: 'text-gray-400' },
        3: { icon: '🏆', color: 'text-yellow-600' }
    };
    const { icon, color } = styles[rank];
    return <span className={`text-2xl ${color}`}>{icon}</span>;
};

// Component to display details for the selected year
const YearlyDetails: React.FC<{ 
    yearData: AnnualEventYearlyData; 
    eventCategory: AnnualEvent['category'];
    onOpenTeamModal: () => void;
}> = ({ yearData, eventCategory, onOpenTeamModal }) => {
    
    const mainLeads = useMemo(() => yearData.organizingTeam.filter(m => m.imageUrl), [yearData.organizingTeam]);
    
    return (
        <div className="animate-fade-in-content bg-slate-900/50 p-6 md:p-8 rounded-2xl border border-slate-800 space-y-12">
            {yearData.theme && <p className="text-2xl font-semibold text-center text-indigo-400 italic mb-0">Theme: "{yearData.theme}"</p>}

            {/* Overall Gallery */}
            <div>
                <h3 className="text-3xl font-bold text-white mb-4 border-l-4 border-indigo-500 pl-4">Gallery Highlights</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {yearData.highlightsGallery.previewImages.map((img, i) => (
                        <a href={yearData.highlightsGallery.fullGalleryLink} target="_blank" rel="noopener noreferrer" key={i} className="overflow-hidden rounded-lg group aspect-w-1 aspect-h-1 block">
                            <img src={img} alt={`Highlight ${i + 1}`} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110" />
                        </a>
                    ))}
                </div>
                 <a href={yearData.highlightsGallery.fullGalleryLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300 font-semibold">View Full Gallery &rarr;</a>
            </div>

            {/* Chief Guests */}
            {yearData.chiefGuests.length > 0 && (
                <div>
                    <h3 className="text-3xl font-bold text-white mb-6 border-l-4 border-indigo-500 pl-4">
                        {eventCategory === 'Sports' ? 'Presided By' : 'Chief Guests'}
                    </h3>
                    <div className="space-y-8">
                        {yearData.chiefGuests.map(guest => (
                            <div key={guest.name}>
                                {guest.eventPhotos && guest.eventPhotos.length > 0 ? (
                                    <div className="bg-slate-800/40 p-6 rounded-lg">
                                        <div className="flex items-center gap-5 mb-4">
                                            <img src={guest.profileImageUrl} alt={guest.name} className="w-20 h-20 rounded-full object-cover border-4 border-slate-700"/>
                                            <div>
                                                <h4 className="text-2xl font-bold text-white">{guest.name}</h4>
                                                <p className="text-md text-indigo-400">{guest.title}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {guest.eventPhotos.map((photo, i) => (
                                                <img key={i} src={photo} alt={`${guest.name} at the event`} className="rounded-md object-cover w-full h-32 hover:scale-105 transition-transform" />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-800/40 p-6 rounded-lg flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
                                        <img src={guest.profileImageUrl} alt={guest.name} className="w-24 h-24 rounded-full object-cover border-4 border-slate-700 flex-shrink-0"/>
                                        <div>
                                            <h4 className="text-2xl font-bold text-white">{guest.name}</h4>
                                            <p className="text-md text-indigo-400">{guest.title}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

             {/* Sports Competitions */}
            {yearData.sportsCompetitions && yearData.sportsCompetitions.length > 0 && (
                 <div>
                    <h3 className="text-3xl font-bold text-white mb-6 border-l-4 border-green-500 pl-4">Get in the Game</h3>
                    <div className="space-y-4">
                        {yearData.sportsCompetitions.map(sport => (
                            <div key={sport.id} className="bg-slate-800/40 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <span className="text-4xl mt-1">{sport.icon}</span>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">{sport.name}</h4>
                                        <p className="text-sm text-gray-400">{sport.description}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => alert(`Registering for ${sport.name}...`)}
                                    disabled={!sport.registrationOpen}
                                    className="w-full sm:w-auto flex-shrink-0 px-5 py-2 text-sm font-bold rounded-lg transition-colors disabled:bg-slate-600 disabled:text-gray-400 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {sport.registrationOpen ? 'Register Now' : 'Registration Closed'}
                                </button>
                            </div>
                        ))}
                    </div>
                 </div>
            )}
            
            {/* Student Performances */}
            {yearData.performances && yearData.performances.length > 0 && (
                 <div>
                    <h3 className="text-3xl font-bold text-white mb-6 border-l-4 border-pink-500 pl-4">Student Showcase</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {yearData.performances.map(perf => (
                            <div key={perf.performer} className="group relative rounded-lg overflow-hidden shadow-lg h-72 bg-slate-800">
                                <img src={perf.imageUrl} alt={perf.performer} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 p-4 text-white">
                                    <h4 className="font-bold text-lg">{perf.performer}</h4>
                                    <p className="text-sm opacity-90">{perf.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
            )}

            {/* Award Winners */}
            {yearData.awardWinners && yearData.awardWinners.length > 0 && (
                <div>
                    <h3 className="text-3xl font-bold text-white mb-6 border-l-4 border-yellow-500 pl-4">Academic Excellence Awards</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {yearData.awardWinners.map(award => (
                            <div key={award.department} className="bg-slate-800/40 p-5 rounded-lg border border-slate-700/50">
                                <h4 className="text-xl font-bold text-white mb-4 text-center">{award.department}</h4>
                                <ul className="space-y-3">
                                    {award.winners.map(winner => (
                                        <li key={winner.rank} className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-md">
                                            <RankIcon rank={winner.rank} />
                                            <div>
                                                <p className="font-semibold text-gray-200">{winner.name}</p>
                                                <p className="text-sm text-yellow-400">{winner.achievement}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Organizing Team */}
            <div>
                <h3 className="text-3xl font-bold text-white mb-6 border-l-4 border-indigo-500 pl-4">Organizing Team</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 text-center">
                    {mainLeads.map(lead => (
                        <div key={lead.name}>
                            <img src={lead.imageUrl} alt={lead.name} className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-slate-700" />
                            <p className="mt-2 font-semibold text-white">{lead.name}</p>
                            <p className="text-xs text-indigo-400">{lead.position}</p>
                        </div>
                    ))}
                </div>
                {yearData.organizingTeam.length > mainLeads.length && (
                    <div className="text-center mt-8">
                        <button onClick={onOpenTeamModal} className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                            View Full Committee
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

interface AnnualEventDetailProps {
    event: AnnualEvent;
    allEvents: EventType[];
    allClubs: Club[];
}

const AnnualEventDetail: React.FC<AnnualEventDetailProps> = ({ event, allEvents, allClubs }) => {
  const sortedYearlyData = useMemo(() => event.yearlyData.sort((a, b) => b.year - a.year), [event.yearlyData]);
  const [selectedYear, setSelectedYear] = useState<number | null>(sortedYearlyData[0]?.year || null);
  const [isTeamModalOpen, setTeamModalOpen] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleCloseTeamModal = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
        setTeamModalOpen(false);
        setIsAnimatingOut(false);
    }, 300);
  };

  const categoryStyles: { [key in AnnualEvent['category']]: { border: string; text: string; } } = {
    'Technical': { border: 'border-indigo-500', text: 'text-indigo-400' },
    'Cultural': { border: 'border-pink-500', text: 'text-pink-400' },
    'Sports': { border: 'border-green-500', text: 'text-green-400' },
  };

  const selectedYearData = useMemo(() => {
    return sortedYearlyData.find(data => data.year === selectedYear);
  }, [selectedYear, sortedYearlyData]);

  const subEvents = useMemo(() => {
      return allEvents.filter(e => e.parentAnnualEventId === event.id);
  }, [allEvents, event.id]);
  
  const eventsByClub = useMemo(() => {
      if (subEvents.length === 0) return {};
      return subEvents.reduce((acc, currentEvent) => {
          const clubId = currentEvent.organizerClubId;
          if (!acc[clubId]) {
              acc[clubId] = [];
          }
          acc[clubId].push(currentEvent);
          return acc;
      }, {} as Record<string, EventType[]>);
  }, [subEvents]);
  
  const clubIdsForSubEvents = Object.keys(eventsByClub);

  return (
    <div>
        {isTeamModalOpen && selectedYearData && (
            <TeamMembersModal 
                members={selectedYearData.organizingTeam} 
                onClose={handleCloseTeamModal} 
                isClosing={isAnimatingOut} 
            />
        )}
        {/* Hero Section */}
        <div className="relative h-[60vh] flex flex-col items-start justify-end p-8 md:p-12 rounded-b-2xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0">
                <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover kenburns-active"/>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <div className="relative z-10 animate-fade-in-content">
                <span className={`inline-block px-3 py-1 mb-2 text-sm font-semibold border-2 self-start rounded-full ${categoryStyles[event.category].border} ${categoryStyles[event.category].text}`}>{event.category}</span>
                <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter">{event.name}</h1>
                <p className="mt-2 max-w-2xl text-lg text-gray-300">{event.shortDescription}</p>
                {event.registrationEnabled && (
                    <button 
                        onClick={() => alert("Registration flow initiated!")}
                        className="mt-6 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
                    >
                       {event.id === 'bhaswara' ? 'Register for Events Below' : 'Register / Join a Team'}
                    </button>
                )}
            </div>
        </div>

        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
            {/* Significance Section */}
            <section className="mb-16">
                 <div className="relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden p-8 md:p-12">
                     <div className="absolute inset-0 z-0 opacity-10">
                        <img src={event.bannerUrl} alt="" className="w-full h-full object-cover filter blur-md scale-110" />
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-900 z-0"></div>
                     <div className="relative z-10">
                        <SectionHeader title="Significance of the Fest" />
                        <p className="text-gray-400 text-lg leading-relaxed text-center max-w-3xl mx-auto">{event.longDescription}</p>
                     </div>
                </div>
            </section>
            
            {/* Sub-Events Section */}
            {subEvents.length > 0 && (
                 <section className="mb-16">
                    <SectionHeader title="Departmental Fests" subtitle={`Explore events hosted by various clubs as part of ${event.name}.`} />
                    <div className="space-y-8">
                        {clubIdsForSubEvents.map(clubId => {
                            const club = allClubs.find(c => c.id === clubId);
                            if (!club) return null;
                            return (
                                <div key={clubId} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                                    <div className="flex items-center gap-4 mb-4">
                                        <img src={club.logoUrl} alt={club.name} className="w-14 h-14 rounded-full" />
                                        <h3 className="text-2xl font-bold text-white">{club.name} Events</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {eventsByClub[clubId].map(subEvent => (
                                            <SubEventCard key={subEvent.id} event={subEvent} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 </section>
            )}

            {/* Yearly Archives Section */}
            <section>
                <SectionHeader title="Yearly Archives" subtitle="Relive the moments from previous editions." />

                {/* Year Selector */}
                <div className="flex justify-center flex-wrap gap-3 mb-8">
                    {sortedYearlyData.map(data => (
                        <button
                            key={data.year}
                            onClick={() => setSelectedYear(data.year)}
                            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 border-2 ${selectedYear === data.year ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700 hover:border-slate-600'}`}
                        >
                            {data.year}
                        </button>
                    ))}
                </div>

                {/* Content Display */}
                {selectedYearData && <YearlyDetails yearData={selectedYearData} eventCategory={event.category} onOpenTeamModal={() => setTeamModalOpen(true)} />}
            </section>
        </div>
    </div>
  );
};

export default AnnualEventDetail;