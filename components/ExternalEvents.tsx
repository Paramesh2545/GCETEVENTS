import React from 'react';
import { ExternalEvent } from '../types';
import SectionHeader from './SectionHeader';

interface ExternalEventsProps {
    externalEvents: ExternalEvent[];
}

const ExternalEvents: React.FC<ExternalEventsProps> = ({ externalEvents }) => {
  return (
    <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeader
            title="External Opportunities"
            subtitle="Explore major hackathons, national-level tech fests, internships, and workshops from other top institutions."
        />
        <div className="space-y-6">
            {externalEvents.map(event => (
                <div key={event.id} className="bg-slate-900 p-6 rounded-lg shadow-md border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-500/50 transition-colors">
                    <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-gray-300">
                            {event.category}
                        </span>
                        <h3 className="mt-2 text-xl font-bold text-white">{event.name}</h3>
                        <p className="text-sm font-medium text-indigo-400">{event.organizer}</p>

                        <p className="mt-2 text-gray-400">{event.description}</p>
                    </div>
                    <div className="flex-shrink-0 mt-4 sm:mt-0">
                        <a 
                            href={event.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-block bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300"
                        >
                            Visit Site
                        </a>
                    </div>
                </div>
            ))}
        </div>
    </section>
  );
};

export default ExternalEvents;