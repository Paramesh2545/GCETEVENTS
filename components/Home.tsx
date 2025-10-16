import React from 'react';
import Hero from './Hero';
import FeaturedEvents from './FeaturedEvents';
import LeadershipSection from './LeadershipSection';
import FaqSection from './FaqSection';
import ClubsSection from './ClubsSection';
import DeveloperSection from './DeveloperSection';
import { Event, Club, LeadershipMember } from '../types';
import CallToAction from './CallToAction';

interface HomeProps {
  events: Event[];
  clubs: Club[];
  leadership: LeadershipMember[];
}

const Home: React.FC<HomeProps> = ({ events, clubs, leadership }) => {
  // console.log(clubs)
  return (
    <div className="space-y-0">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Hero />
      </div>
      <FeaturedEvents events={events} />
      <ClubsSection clubs={clubs} />
      <LeadershipSection leadership={leadership} />
      <CallToAction clubs={clubs} />
      <DeveloperSection />
      <FaqSection />
    </div>
  );
};

export default Home;