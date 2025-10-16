import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1D2434] text-white pt-8 pb-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-center md:text-left">
          {/* Logo and Info */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-extrabold tracking-tighter inline-block md:inline">GCET</h3>
            <p className="mt-4 text-gray-400 max-w-xs mx-auto md:mx-0">
              The official hub for clubs, events, and campus life at the University of Excellence.
            </p>
          </div>

          {/* Studios */}
          <div className="hidden md:block">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-400">Navigation</h3>
            <ul className="mt-4 space-y-3">
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/clubs" className="text-gray-300 hover:text-white transition-colors">Clubs</Link></li>
              <li><Link to="/events" className="text-gray-300 hover:text-white transition-colors">Events</Link></li>
              <li><Link to="/news" className="text-gray-300 hover:text-white transition-colors">News</Link></li>
            </ul>
          </div>

           {/* Features */}
           <div className="hidden md:block">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-400">Resources</h3>
            <ul className="mt-4 space-y-3">
              <li><Link to="/opportunities" className="text-gray-300 hover:text-white transition-colors">Opportunities</Link></li>
               <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Social */}
          <div className="hidden md:block">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-400">Social</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Youtube</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-800 pt-4 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} GCET. All Rights Reserved.</p>
            <p className="mt-2">Developed & Maintained by Pavan & Paramesh</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;