import React from 'react';
import { FaMapMarkerAlt, FaDesktop, FaCar, FaMap, FaCog, FaFileAlt, FaChevronDown } from 'react-icons/fa';

const Sidebar = () => {
  return (
    <>
      {/* Primary Left Navigation Strip */}
      <div className="absolute left-0 top-0 h-full w-16 bg-panelDark border-r border-slate-800 z-20 flex flex-col items-center py-6 shadow-2xl">
        <div className="mb-8 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
            <FaMapMarkerAlt className="text-panelDark" />
          </div>
        </div>
        
        <div className="flex flex-col space-y-6 flex-grow w-full">
          <div className="w-full flex justify-center border-l-2 border-accentBlue text-accentBlue cursor-pointer">
            <FaMapMarkerAlt size={20} />
          </div>
          <div className="w-full flex justify-center text-slate-500 hover:text-slate-300 cursor-pointer">
            <FaDesktop size={20} />
          </div>
          <div className="w-full flex justify-center text-slate-500 hover:text-slate-300 cursor-pointer">
            <FaCar size={20} />
          </div>
          <div className="w-full flex justify-center text-slate-500 hover:text-slate-300 cursor-pointer">
            <FaMap size={20} />
          </div>
          <div className="w-full flex justify-center text-slate-500 hover:text-slate-300 cursor-pointer">
            <FaFileAlt size={20} />
          </div>
        </div>

        <div className="mt-auto w-full flex justify-center text-slate-500 hover:text-slate-300 cursor-pointer mb-6">
          <FaCog size={20} />
        </div>
      </div>

      {/* Secondary Detailed Sidebar Panel */}
      <div className="absolute left-16 top-0 h-full w-80 bg-panelDark/95 backdrop-blur-md border-r border-slate-800 z-10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Mappa <span className="text-slate-500 text-sm">ⓘ</span>
          </h2>
          <button className="text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* Accordion Item: Eventi */}
          <div className="mb-4">
            <div className="flex justify-between items-center text-sm font-medium text-slate-300 mb-3 cursor-pointer hover:text-white">
              <span className="flex items-center gap-2">
                <FaChevronDown className="text-xs" /> Eventi
              </span>
              <FaMapMarkerAlt />
            </div>
            <div className="ml-5 flex flex-col gap-2">
              <label className="flex items-center gap-3 text-sm text-slate-400 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-panelLighter border-slate-700 text-accentBlue focus:ring-accentBlue" />
                Programmati
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-400 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded bg-panelLighter border-slate-700 focus:ring-accentBlue" />
                Non programmati
              </label>
               <label className="flex items-center gap-3 text-sm text-slate-400 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded bg-panelLighter border-slate-700 focus:ring-accentBlue" />
                Tutti
              </label>
            </div>
          </div>

          {/* Accordion Item: Rete Stradale */}
          <div className="mb-4 pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center text-sm font-medium text-slate-300 mb-3 cursor-pointer hover:text-white">
              <span className="flex items-center gap-2">
                <FaChevronDown className="text-xs" /> Rete Stradale CAV
              </span>
              <FaMap />
            </div>
            <div className="ml-5 flex flex-col gap-2">
              <label className="flex items-center gap-3 text-sm text-slate-400 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-panelLighter border-slate-700 text-accentBlue focus:ring-accentBlue" />
                Archi di rete
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-400 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded bg-panelLighter border-slate-700 focus:ring-accentBlue" />
                Nodi di rete
              </label>
            </div>
          </div>

        </div>

        {/* Bottom Section: Search & Active Events */}
        <div className="bg-panelLighter p-4 border-t border-slate-800">
           <div className="relative mb-4">
             <input type="text" placeholder="Cerca" className="w-full bg-slate-800 border-none rounded-lg py-2 pl-3 pr-10 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-slate-600" />
             <FaSearch className="absolute right-3 top-2.5 text-slate-500" />
           </div>
           
           <div className="flex justify-between text-xs text-slate-500 mb-2 font-semibold">
             <span>Event</span>
             <span className="ml-auto mr-4">Stato</span>
             <span>Tratta</span>
           </div>
           
           <div className="flex flex-col gap-3 max-h-40 overflow-y-auto pr-1">
             <div className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-800 p-1 rounded">
               <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-accentRed flex items-center justify-center text-[10px]">&times;</div> Occidente</div>
               <span className="text-slate-400 ml-auto mr-4">Attivo</span>
               <span className="text-slate-400">A57</span>
             </div>
             <div className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-800 p-1 rounded">
               <div className="flex items-center gap-2"><div className="w-4 h-2 bg-yellow-400"></div> Nebbia in banchi</div>
               <span className="text-slate-400 ml-auto mr-4">Attivo</span>
               <span className="text-slate-400">A04</span>
             </div>
           </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
