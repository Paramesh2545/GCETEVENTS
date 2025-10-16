

import React from 'react';
import { Event } from '../types';
import EventCard from './EventCard';
import SectionHeader from './SectionHeader';
import { eventRegistrationService } from '../services/eventRegistrationService';

interface EventsSectionProps {
  title: string;
  subtitle?: string;
  events: Event[];
  noEventsMessage?: string;
}

const EventsSection: React.FC<EventsSectionProps> = ({ title, subtitle, events, noEventsMessage = "No events to display." }) => {
  if (events.length === 0) {
    return (
      <div className="py-8">
        <SectionHeader title={title} subtitle={subtitle} />
        <div className="text-center bg-[#10141D] p-8 rounded-lg shadow-md">
            <p className="text-gray-400">{noEventsMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="py-8">
      {title && <SectionHeader title={title} subtitle={subtitle} />}
      <div className="space-y-8">
        {events.map((event) => (
          <EventCard key={event.id} event={event}/>
        ))}
      </div>
    </section>
  );
};

export default EventsSection;