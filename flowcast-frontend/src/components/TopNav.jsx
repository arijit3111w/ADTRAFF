import React from 'react';
import { FaBell, FaCamera, FaLink, FaCircleNotch } from 'react-icons/fa';

const TopNav = () => {
  return (
    <div className="absolute top-0 left-96 w-[calc(100%-24rem)] px-6 py-4 flex justify-between items-center z-10 pointer-events-none">
      
      {/* Top Left Center - Update Status */}
      <div className="flex items-center gap-2 text-slate-300 pointer-events-auto">
        <FaCircleNotch className="animate-spin text-sm" />
        <span className="text-xs font-semibold tracking-wider font-mono">UPDATE: {new Date().toLocaleDateString('en-GB')} - {new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}</span>
      </div>

      {/* Top Right - Actions */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button className="bg-accentRed hover:bg-red-600 text-white p-2.5 rounded-lg shadow-lg shadow-red-500/20 transition-colors flex items-center justify-center relative">
          <FaBell />
          <span className="absolute -top-1 -right-1 bg-white text-accentRed text-[10px] font-bold px-1.5 rounded-full ring-2 ring-accentRed">5</span>
        </button>
        <button className="bg-accentRed hover:bg-red-600 text-white p-2.5 rounded-lg shadow-lg shadow-red-500/20 transition-colors flex items-center justify-center relative">
          <FaCamera />
          <span className="absolute -top-1 -right-1 bg-white text-accentRed text-[10px] font-bold px-1.5 rounded-full ring-2 ring-accentRed">2</span>
        </button>
        <button className="bg-panelDark/80 backdrop-blur-md hover:bg-panelLighter text-slate-300 p-2.5 rounded-lg border border-slate-700/50 shadow-lg transition-colors flex items-center justify-center ml-2">
          <FaLink />
        </button>
        <button className="bg-panelDark/80 backdrop-blur-md hover:bg-panelLighter text-slate-300 p-2.5 rounded-lg border border-slate-700/50 shadow-lg transition-colors flex items-center justify-center">
           <div className="w-4 h-4 rounded-full border border-slate-400"></div>
        </button>
      </div>

    </div>
  );
};

export default TopNav;
