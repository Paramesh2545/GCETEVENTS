import React from 'react';
import { Link } from 'react-router-dom';
import { AnnualEvent } from '../types';
import SectionHeader from './SectionHeader';

interface AllAnnualEventsProps {
    annualEvents: AnnualEvent[];
}

const categoryStyles: { [key in AnnualEvent['category']]: { glow: string; border: string; } } = {
  'Technical': { glow: 'animate-glow-indigo', border: 'hover:border-indigo-500/80' },
  'Cultural': { glow: 'animate-glow-pink', border: 'hover:border-pink-500/80' },
  'Sports': { glow: 'animate-glow-green', border: 'hover:border-green-500/80' },
}

const AnnualEventCard: React.FC<{ event: AnnualEvent; index: number }> = ({ event, index }) => {
    const styles = categoryStyles[event.category] || categoryStyles['Technical'];

    return (
        <Link 
            to={`/annual-events/${event.id}`}
            className={`animate-card-enter group rounded-2xl overflow-hidden cursor-pointer bg-slate-900 shadow-lg transition-all duration-300 border-2 border-slate-800 ${styles.border} hover:shadow-indigo-500/20 transform hover:-translate-y-2 flex flex-col`}
            style={{ animationDelay: `${index * 150}ms` }}
        >
            <div className="overflow-hidden">
                <img src={event.bannerUrl} alt={event.name} className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-extrabold tracking-tight text-white">{event.name}</h3>
                <p className="mt-2 text-gray-400 line-clamp-3 flex-grow">{event.shortDescription}</p>
                <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="inline-flex items-center text-indigo-400 font-bold group-hover:text-indigo-300 transition-colors">
                        <span>Explore History</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>
        </Link>
    );
};

const AllAnnualEvents: React.FC<AllAnnualEventsProps> = ({ annualEvents }) => {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <SectionHeader 
        title="Annual Campus Festivals"
        subtitle="Explore the legacy of our biggest and most celebrated events. These are the cornerstones of our campus tradition and spirit."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {annualEvents.map((event, index) => (
          <AnnualEventCard key={event.id} event={event} index={index} />
        ))}
      </div>
    </div>
  );
};

export default AllAnnualEvents;