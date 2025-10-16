import React, { useRef } from 'react';
import SectionHeader from './SectionHeader';
import { LeadershipMember } from '../types';

const LeadershipCard: React.FC<{ member: LeadershipMember, index: number }> = ({ member, index }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const { left, top, width, height } = cardRef.current.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        
        cardRef.current.style.setProperty('--mouse-x', `${x}px`);
        cardRef.current.style.setProperty('--mouse-y', `${y}px`);

        const rotateX = (y / height - 0.5) * -25;
        const rotateY = (x / width - 0.5) * 25;
        // Reduced scale slightly to prevent any potential clipping on smaller viewports
        cardRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    };

    return (
        <div 
            className="perspective-container animate-card-enter group/container"
            style={{ animationDelay: `${index * 150}ms` }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div ref={cardRef} className="tilt-card w-full h-full">
                {/* Gradient border wrapper */}
                <div className="spotlight-card relative rounded-xl p-[2px] h-full transition-all duration-400 
                                bg-gray-800 group-hover/container:bg-gradient-to-br from-pink-500 via-indigo-500 to-cyan-400
                                group-hover/container:shadow-[0_0_5px_rgba(236,72,153,0.5),_0_0_5px_rgba(99,102,241,0.5)]">
                    
                    {/* Inner content with solid background */}
                    <div className="relative bg-gray-900/80 backdrop-blur-lg rounded-[10px] p-8 h-full flex flex-col items-center text-center">
                        <div className="tilt-card-inner relative z-10 flex flex-col items-center">
                            {/* Gradient border wrapper for image */}
                            <div 
                                className="relative rounded-full p-1 transition-all duration-400 
                                           bg-gray-700 group-hover/container:bg-gradient-to-br from-pink-500 via-indigo-500 to-cyan-400
                                           group-hover/container:scale-105 "
                                style={{ transform: 'translateZ(40px)' }}
                            >
                                <img 
                                    className="w-32 h-32 object-cover rounded-full shadow-lg border-2 border-gray-900"
                                    src={member.imageUrl} 
                                    alt={member.name} 
                                />
                            </div>
                            <h3 className="text-2xl font-extrabold text-white mt-6" style={{ transform: 'translateZ(30px)' }}>{member.name}</h3>
                            <p className="text-lg font-bold text-indigo-400 mt-1" style={{ transform: 'translateZ(20px)' }}>{member.title}</p>
                            <blockquote className="mt-6" style={{ transform: 'translateZ(10px)' }}>
                                 <div>
                                    <p className="text-md text-gray-400 italic">
                                        "{member.quote}"
                                    </p>
                                </div>
                            </blockquote>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface LeadershipSectionProps {
  leadership: LeadershipMember[];
}

const LeadershipSection: React.FC<LeadershipSectionProps> = ({ leadership }) => {
  return (
    // Removed overflow-hidden to prevent the card's hover scale effect from being clipped
    <section className="py-24 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Meet Our Leadership" subtitle="Guiding the vision of tomorrow's innovators and creators." />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                {leadership.map((member, index) => (
                <LeadershipCard key={member.id} member={member} index={index} />
                ))}
            </div>
      </div>
    </section>
  );
};

export default LeadershipSection;