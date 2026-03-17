import React from 'react';
import { FaCarSide } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary text-white p-2 rounded-lg">
              <FaCarSide className="text-xl" />
            </div>
            <span className="font-bold text-xl text-primary tracking-tight">FlowCast</span>
          </Link>
          
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-slate-600 hover:text-primary font-medium transition-colors">Home</Link>
            <a href="#about" className="text-slate-600 hover:text-primary font-medium transition-colors">About</a>
            <a href="#contact" className="text-slate-600 hover:text-primary font-medium transition-colors">Contact</a>
          </div>
          
          {/* Mobile menu button could go here */}
          <div className="md:hidden flex items-center">
            <button className="text-slate-600 hover:text-primary focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
