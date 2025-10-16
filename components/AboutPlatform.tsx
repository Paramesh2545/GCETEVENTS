import React from 'react';
// Fix: Import useNavigate from react-router-dom to handle navigation.
import { useNavigate } from 'react-router-dom';
import SectionHeader from './SectionHeader';

// Fix: Removed the onNavigate prop and its associated 'View' type which was causing an error.
const AboutPlatform: React.FC = () => {
  // Fix: Initialize the navigate function.
  const navigate = useNavigate();
  return (
    <section className="py-24 bg-[#10141D] text-white rounded-xl">
       <div className="container mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid md:grid-cols-2 gap-12 items-center">
               <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-indigo-400">Detailed Custing</p>
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white mt-2">
                        We Have Put Together A Special Combination of Strategy.
                    </h2>
               </div>
               <div>
                   <p className="text-gray-400">
                       Our platform is designed to be the single source of truth for all student activities. We streamline event discovery, simplify registration, and dramatically increase student engagement in campus life.
                   </p>
                    {/* Fix: Use the navigate function to go to the '/clubs' route. */}
                    <button onClick={() => navigate('/clubs')} className="mt-8 bg-transparent text-white font-bold py-3 px-6 rounded-full border-2 border-gray-600 hover:bg-gray-800 hover:border-gray-500 transition-colors duration-300 flex items-center group">
                        <span>Learn More</span>
                         <div className="ml-3 h-8 w-8 rounded-full bg-white text-black flex items-center justify-center transform group-hover:translate-x-1 transition-transform">
                            &rarr;
                        </div>
                    </button>
               </div>
           </div>
       </div>
    </section>
  );
};

export default AboutPlatform;
