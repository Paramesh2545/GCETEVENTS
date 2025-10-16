import React from 'react';
import { Link } from 'react-router-dom';
import SectionHeader from './SectionHeader';
import { Club } from '../types';
import { firestoreDataService } from '../services/firestoreDataService';

const CallToAction: React.FC<{ clubs: Club[]; index: number }> = ({ clubs, index }) =>{
    const midPoint = Math.ceil(clubs.length / 2);
  const outerLogos = clubs.slice(0, midPoint); 
  const innerLogos = clubs.slice(midPoint);

  const outerRadius = 180;
  const innerRadius = 100;
  const outerAngleStep = (2 * Math.PI) / outerLogos.length;
  const innerAngleStep = (2 * Math.PI) / outerLogos.length;

  return (
    <section className="relative py-12 bg-gradient-to-br from-gray-900 via-slate-900 to-black overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float-subtle"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float-subtle" style={{ animationDelay: '5s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-60 h-60 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-float-subtle" style={{ animationDelay: '10s' }}></div>


       <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center z-10">
            <SectionHeader 
                title="Join Our Vibrant Community" 
                subtitle="Discover your passion, meet new people, and be part of something bigger. Dive into a world of innovation, creativity, and friendship."
                colorScheme="dark"
            />
            
            <div className="relative w-[400px] h-[400px] flex items-center justify-center my-2 group">
                {/* Outer Orbit */}
                <div className="absolute w-full h-full animate-spin-medium-reverse">
                    {outerLogos && outerLogos.map((indClub, index) => {
                        const angle = index * outerAngleStep;
                        const x = outerRadius * Math.cos(angle);
                        const y = outerRadius * Math.sin(angle);
                        return (
                            <div
                                key={`${indClub.id}-outer`}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 group-hover:scale-110"
                                style={{ transform: `translate(${x}px, ${y}px)` }}
                            >
                                <img
                                    src={indClub.logoUrl}
                                    alt={`${indClub.name} logo`}
                                    className="w-16 h-16 object-cover rounded-full bg-white/10 p-1 shadow-lg backdrop-blur-sm border-2 border-white/20 transition-all duration-300 hover:!scale-125 hover:border-indigo-400"
                                />
                            </div>
                        );
                    })}
                </div>
                    
                {/* Inner Orbit */}
                <div className="absolute w-full h-full animate-spin-medium">
                    {innerLogos && innerLogos.map((indClub, index) => {
                        const angle = index * innerAngleStep;
                        const x = innerRadius * Math.cos(angle);
                        const y = innerRadius * Math.sin(angle);
                        return (
                            <div
                                key={`${indClub.id}-inner`}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 group-hover:scale-110"
                                style={{ transform: `translate(${x}px, ${y}px)` }}
                            >
                                <img
                                    src={indClub.logoUrl}
                                    alt={`${indClub.name} logo`}
                                    className="w-14 h-14 object-cover rounded-full bg-white/10 p-1 shadow-md backdrop-blur-sm border-2 border-white/20 transition-all duration-300 hover:!scale-125 hover:border-pink-400"
                                />
                            </div>
                        );
                    })}
                </div>

                <div className="relative w-40 h-40 rounded-full bg-gray-900/50 backdrop-blur-md flex items-center justify-center text-center z-10 border border-white/10 shadow-2xl">
                    <h2 className="text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">
                        Clubs
                    </h2>
                </div>
            </div>

            <Link
                to="/clubs"
                className="button-glow-effect mt-6 bg-indigo-600 text-white font-bold py-4 px-8 rounded-full hover:bg-indigo-700 transition-all duration-300 flex items-center group shadow-lg transform hover:scale-105"
            >
                <span>Explore All Clubs</span>
                 <div className="ml-3 h-8 w-8 rounded-full bg-white/20 text-white flex items-center justify-center transform group-hover:translate-x-1 transition-transform">
                    &rarr;
                </div>
            </Link>
       </div>
    </section>
  );
};

export default CallToAction;