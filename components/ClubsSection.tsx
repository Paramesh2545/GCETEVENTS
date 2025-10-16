import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Club } from '../types';
import SectionHeader from './SectionHeader';

const ClubCard: React.FC<{ club: Club; index: number }> = ({ club, index }) => {
    return (
        <Link 
            to={`/clubs/${club.id}`}
            className="group relative bg-[#1D2434] rounded-2xl overflow-hidden shadow-lg border border-transparent hover:border-indigo-500/50 transition-all duration-300 transform hover:-translate-y-2 animate-card-enter block"
            style={{ animationDelay: `${index * 150}ms` }}
        >
            <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-indigo-600/10 rounded-full filter blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-8 text-center">
                <img src={club.logoUrl} alt={`${club.name} logo`} className="w-24 h-24 rounded-full mx-auto mb-5 border-4 border-slate-700 shadow-md transition-transform duration-300 group-hover:scale-110" />
                <h3 className="text-2xl font-extrabold text-white">{club.name}</h3>
                <p className="mt-2 text-gray-400 text-sm h-10 line-clamp-2">{club.tagline}</p>
                <div className="mt-6">
                    <span className="text-indigo-400 font-semibold group-hover:text-indigo-300 transition-colors flex items-center justify-center">
                        Learn More
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
};

interface ClubsSectionProps {
  clubs: Club[];
}

const ClubsSection: React.FC<ClubsSectionProps> = ({ clubs }) => {
  const featuredClubs = clubs.slice(0, 4);
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader 
          title="Find Your Community"
          subtitle="From coding to culture, there's a club for everyone. Explore our diverse student organizations and get involved."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredClubs.map((club, index) => (
            <ClubCard key={club.id} club={club} index={index} />
          ))}
        </div>
        <div className="text-center mt-12">
            <button
                onClick={() => navigate('/clubs')}
                className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-500/30"
            >
                Explore All Clubs
            </button>
        </div>
      </div>
    </section>
  );
};

export default ClubsSection;