// import React from 'react';
// import { Link } from 'react-router-dom';

// const Hero: React.FC = () => {
//   return (
//     <section className="min-h-[calc(100vh-5rem)] flex items-center rounded-xl">
//       <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
//         <div className="md:col-span-3 text-center md:text-left">
//           <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-tight tracking-tighter">
//             Innovate & Connect:
//             <br />
//             <span className="text-indigo-500">Your Ultimate Campus Hub.</span>
//           </h1>
//           <p className="mt-8 max-w-2xl mx-auto md:mx-0 text-lg text-gray-400">
//             The single source of truth for all student activities. Discover events, join clubs, and connect with a vibrant community of innovators. We streamline event discovery and simplify registration to boost your campus engagement.
//           </p>
//           <div className="mt-10 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
//              <Link
//                 to="/events"
//                 className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
//               >
//               Explore Events
//             </Link>
//              <Link
//                 to="/clubs"
//                 className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-transparent border-2 border-slate-600 text-gray-300 font-semibold rounded-lg hover:bg-slate-800 hover:border-slate-500 transition-colors"
//               >
//               Discover Clubs
//             </Link>
//           </div>
//         </div>
//         <div className="md:col-span-2 relative h-96">
//             <div className="absolute top-0 right-1/4 w-60 h-80 bg-gray-800 rounded-lg transform -rotate-12 transition-transform duration-500 hover:rotate-0 hover:scale-105 animate-float" style={{animationDelay: '0.5s'}}>
//                 <img src="https://picsum.photos/seed/ticket1/300/400" className="w-full h-full object-cover rounded-lg" alt="Ticket 1"/>
//                 <div className="absolute inset-0 bg-black/30 rounded-lg"></div>
//                  <div className="absolute bottom-4 left-4 text-white">
//                     <p className="font-bold text-lg">ONE WAY TICKET</p>
//                     <p className="text-xs">***</p>
//                 </div>
//             </div>
//              <div className="absolute bottom-0 left-1/4 w-60 h-80 bg-slate-800 rounded-lg transform rotate-6 transition-transform duration-500 hover:rotate-0 hover:scale-105 animate-float shadow-2xl border border-slate-700">
//                 <img src="https://picsum.photos/seed/ticket2/300/400" className="w-full h-52 object-cover rounded-t-lg" alt="Ticket 2"/>
//                 <div className="p-4 text-white">
//                     <p className="font-bold text-lg">ONE WAY TICKET</p>
//                     <p className="text-yellow-500 text-xs">***</p>
//                 </div>
//             </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default Hero;



import React from 'react';
import { View } from '../types';
import { Link } from 'react-router-dom';

interface HeroProps {
  onNavigate: (view: View) => void;
}

const AbstractIllustration: React.FC = () => (
    <div className="relative w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 400 400" className="w-full h-full">
            <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="15" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                 <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: 'rgb(99, 102, 241)', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: 'rgb(168, 85, 247)', stopOpacity: 1}} />
                </linearGradient>
                 <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: 'rgb(236, 72, 153)', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: 'rgb(239, 68, 68)', stopOpacity: 1}} />
                </linearGradient>
            </defs>
            {/* Animated shapes */}
            <circle cx="200" cy="200" r="100" fill="url(#grad1)" className="animate-subtle-pulse" style={{ animationDelay: '0s' }} filter="url(#glow)"/>
            <path d="M 100 100 Q 200 50 300 100 T 100 100" fill="none" stroke="url(#grad2)" strokeWidth="8" className="animate-subtle-float" style={{ animationDelay: '1s' }}/>
            <circle cx="120" cy="280" r="40" fill="url(#grad2)" className="animate-subtle-pulse" style={{ animationDelay: '2s' }}/>
            <circle cx="280" cy="120" r="30" fill="white" className="animate-subtle-float opacity-20" style={{ animationDelay: '0.5s' }}/>
        </svg>
    </div>
);


const Card: React.FC<{ icon: React.ReactNode; title: string; description: string, color: string, className?: string, style?: React.CSSProperties }> = ({ icon, title, description, color, className, style }) => (
    <div className={`bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg hover:border-${color}-500/50 hover:-translate-y-1 transition-all duration-300 h-full ${className || ''}`} style={style}>
        <div className={`w-12 h-12 rounded-full bg-${color}-500/10 flex items-center justify-center mb-4`}>
            <div className={`text-${color}-400`}>{icon}</div>
        </div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm text-gray-400">{description}</p>
    </div>
);

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
    return (
        <section className="relative bg-slate-950 text-gray-300 overflow-hidden font-sans">
            <div className="container mx-auto px-6 py-20 min-h-[90vh]">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column: Text Content & Cards */}
                    <div className="relative z-10 text-center lg:text-left">
                        <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-3xl -z-10"></div>
                        <h1 
                            className="text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tighter animate-staggered-fade-in"
                            style={{ animationDelay: '100ms' }}
                        >
                            Innovate & Connect:
                            <br/>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Your Campus Hub.</span>
                        </h1>
                        <p 
                            className="mt-6 text-lg text-gray-400 max-w-lg mx-auto lg:mx-0 animate-staggered-fade-in"
                            style={{ animationDelay: '200ms' }}
                        >
                            Discover events, join clubs, and shape your college experience. All in one place.
                        </p>
                        <div 
                            className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-staggered-fade-in"
                            style={{ animationDelay: '300ms' }}
                        >
                            <Link to="/events">
                                <button className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors transform hover:scale-105 shadow-lg">
                                Explore Events
                            </button>
                            </Link>
                            <Link to="/clubs">
                                <button className="w-full sm:w-auto px-8 py-3 bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors">
                                    Find Clubs
                                </button>
                            </Link>
                        </div>
                        {/* Cards Section */}
                        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card 
                                className="animate-staggered-fade-in"
                                style={{ animationDelay: '400ms' }}
                                title="Discover Events"
                                description="Browse workshops, competitions, and fests."
                                color="indigo"
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                            />
                             <Card 
                                className="animate-staggered-fade-in"
                                style={{ animationDelay: '500ms' }}
                                title="Join Clubs"
                                description="Find your community and get involved on campus."
                                color="purple"
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                            />
                             <Card 
                                className="animate-staggered-fade-in"
                                style={{ animationDelay: '600ms' }}
                                title="Stay Updated"
                                description="Get the latest news on recruitments and results."
                                color="pink"
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h2m-4 3H9m-7 4h15M3 15h15" /></svg>}
                            />
                        </div>
                    </div>

                    {/* Right Column: Illustration */}
                    <div className="relative h-[400px] lg:h-[500px] hidden md:block animate-staggered-fade-in" style={{ animationDelay: '200ms' }}>
                        <AbstractIllustration />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;