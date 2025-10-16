import React, { useState, useMemo } from 'react';
import { EventCategory, Event, Club } from '../types';
import EventCard from './EventCard';
import SectionHeader from './SectionHeader';
import { getEventName } from '../utils/eventUtils';

interface AllEventsProps {
    events: Event[];
    clubs: Club[];
    registrations?: { [eventId: string]: number }; // Add this prop
}

const AllEvents: React.FC<AllEventsProps> = ({ events, clubs, registrations = {} }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  
  const categories: EventCategory[] = ['Technical', 'Cultural', 'Workshop', 'Sports'];

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Safely handle event name/title field
      const eventName = getEventName(event);
      const matchesSearch = eventName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClub = selectedClub === 'all' || event.organizerClubId === selectedClub;
      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
      return matchesSearch && matchesClub && matchesCategory;
    });
  }, [searchTerm, selectedClub, selectedCategory, events]);

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <SectionHeader 
        title="All College Events"
        subtitle="Your central hub for every workshop, seminar, and competition on campus."
      />
      
      {/* Filters and Search */}
      <div className="bg-slate-900/60 backdrop-blur-sm p-4 rounded-lg shadow-lg mb-8 sticky top-24 z-40 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by event name..."
            className="md:col-span-2 w-full px-4 py-3 bg-slate-800 text-gray-200 border border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="w-full px-4 py-3 bg-slate-800 text-gray-200 border border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
          >
            <option value="all">All Clubs</option>
            {clubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
          </select>
          <select
            className="w-full px-4 py-3 bg-slate-800 text-gray-200 border border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as EventCategory | 'all')}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-8">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              registrations={registrations[event.id] || 0} // Pass registration count
            />
          ))
        ) : (
          <div className="text-center bg-slate-900 p-8 rounded-lg">
            <p className="text-gray-400">No events match your criteria. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllEvents;