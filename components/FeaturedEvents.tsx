import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Event, EventStatus } from '../types';
import SectionHeader from './SectionHeader';

const categoryStyles: { [key: string]: string } = {
  'Technical': 'bg-indigo-500/80 text-white',
  'Cultural': 'bg-pink-500/80 text-white',
  'Workshop': 'bg-yellow-500/80 text-gray-900',
  'Sports': 'bg-purple-500/80 text-white'
}

interface FeaturedEventsProps {
  events: Event[];
}

const FeaturedEvents: React.FC<FeaturedEventsProps> = ({ events }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  
  const featuredEvents = events.filter(
    (e) => e.isFeatured && e.status !== EventStatus.Past
  );

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? featuredEvents.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = useCallback(() => {
    if (featuredEvents.length === 0) return;
    const isLastSlide = currentIndex === featuredEvents.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, featuredEvents.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  }

  useEffect(() => {
    const slideInterval = setInterval(goToNext, 7000);
    return () => clearInterval(slideInterval);
  }, [goToNext]);

  if (!featuredEvents.length) return null;

  const activeEvent = featuredEvents[currentIndex];

  return (
    <section className="py-24 bg-[#1D2434]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Don't Miss Out" subtitle="Check out the major upcoming and ongoing events on campus." colorScheme="dark"/>
            
            <div className="relative w-full max-w-6xl mx-auto h-[550px] rounded-2xl overflow-hidden shadow-2xl group bg-gray-900">
                
                {/* Background Image Slides */}
                <div className="w-full h-full">
                    {featuredEvents.map((event, index) => (
                        <div
                            key={event.id}
                            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <img 
                                src={event.imageUrl} 
                                alt={event.name} 
                                className={`w-full h-full object-cover ${index === currentIndex ? 'kenburns-active' : ''}`}
                            />
                        </div>
                    ))}
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 text-white" key={activeEvent.id}>
                    <div className="animate-fade-in-content">
                        <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${categoryStyles[activeEvent.category]}`}>
                            {activeEvent.category}
                        </span>
                        <h3 className="text-3xl md:text-5xl font-extrabold mt-3 leading-tight tracking-tighter max-w-3xl">{activeEvent.name}</h3>
                        <div className="mt-4 flex items-center space-x-6 text-gray-300">
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span>{activeEvent.date}</span>
                            </div>
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{activeEvent.time}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate(`/events/${activeEvent.id}`)}
                            className="mt-8 bg-white text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-all duration-300 flex items-center transform hover:scale-105"
                        >
                            <span>View Details</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Navigation Arrows */}
                <button onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/50 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/50 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
                
                {/* Dots Navigation */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
                    {featuredEvents.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-white w-6' : 'bg-white/50 hover:bg-white'}`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>

            </div>
        </div>
    </section>
  );
};

export default FeaturedEvents;