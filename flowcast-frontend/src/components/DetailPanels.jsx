import React from 'react';
import { FaArrowRight, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const DetailPanels = () => {
  return (
    <div className="absolute top-24 right-6 w-80 flex flex-col gap-4 z-10 pointer-events-none">
      
      {/* Primary Detail Card: Dettaglio apparato */}
      <div className="bg-panelDark/95 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-5 relative pointer-events-auto">
        {/* Close button pill */}
        <button className="absolute -top-3 right-4 bg-panelLighter hover:bg-slate-700 text-slate-400 p-1.5 rounded-full shadow-lg border border-slate-700/50 transition-colors">
          <FaTimes size={12} />
        </button>

        <div className="flex justify-between items-start mb-4">
          <h3 className="text-slate-200 font-semibold">Dettaglio apparato</h3>
          <button className="bg-accentBlue hover:bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-blue-500/20">
            <FaArrowRight size={12} />
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <p className="flex justify-between"><span className="text-slate-500">ID:</span> <span className="text-slate-300 font-mono">RT_040.1</span></p>
          <p className="flex justify-between"><span className="text-slate-500">Tipo:</span> <span className="text-slate-300">3L_15+F</span></p>
          <p className="flex justify-between"><span className="text-slate-500">Nome:</span> <span className="text-slate-300">PMV - A19W</span></p>
          <div className="flex flex-col mt-1">
            <span className="text-slate-500">Tratta/Strada:</span>
            <span className="text-slate-300 leading-tight mt-0.5">A57 Tangenziale di Mestre (tratto chiuso)</span>
          </div>
          <p className="flex justify-between mt-1"><span className="text-slate-500">Km:</span> <span className="text-slate-300">8.4</span></p>
          <p className="flex justify-between"><span className="text-slate-500">Direzione:</span> <span className="text-slate-300">Ovest</span></p>
          <div className="flex flex-col mt-1">
            <span className="text-slate-500">Denominazione asse:</span>
            <span className="text-slate-300 leading-tight mt-0.5">Sv. Mira-Oriago - Barriera</span>
          </div>
          <p className="flex justify-between items-center mt-2"><span className="text-slate-500">Stato Diagnostica:</span> <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div></p>
        </div>
      </div>

      {/* Secondary Card: Messaggio corrente */}
      <div className="bg-panelDark/95 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-5 pointer-events-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-slate-200 font-semibold">Messaggio corrente</h3>
          <button className="bg-accentBlue hover:bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-blue-500/20">
            <FaArrowRight size={12} />
          </button>
        </div>

        {/* LED Style Matrix Display */}
        <div className="bg-baseDark rounded-xl border border-slate-800 p-4 font-mono">
          <div className="flex items-center gap-4 text-accentRed mb-4 border-b border-slate-800 pb-3">
            <FaExclamationTriangle className="text-2xl" />
            <div className="text-sm leading-tight tracking-wider font-bold">
              Lavori in corso<br/>
              al km 22
            </div>
          </div>
          
          <div className="flex justify-between items-center px-2">
            {/* Speed limits / Signs */}
            <div className="flex flex-col items-center gap-1">
               <span className="text-green-500 font-bold text-xs">&uarr;</span>
               <div className="w-6 h-6 rounded-full border-2 border-red-500 flex items-center justify-center text-[10px] font-bold text-white bg-slate-900">50</div>
            </div>
            <div className="flex flex-col items-center gap-1">
               <span className="text-green-500 font-bold text-xs">&uarr;</span>
               <div className="w-6 h-6 rounded-full border-2 border-red-500 flex items-center justify-center text-[10px] font-bold text-white bg-slate-900">50</div>
            </div>
            <div className="flex flex-col items-center gap-1">
               <span className="text-red-500 font-bold text-xs">&times;</span>
               <div className="w-6 h-6 rounded-full border-4 border-red-500 bg-white"></div>
            </div>
          </div>
        </div>
      </div>

     {/* Map Controls */}
      <div className="flex justify-end gap-2 mt-auto pt-6 pointer-events-auto">
        <div className="flex bg-panelDark/80 backdrop-blur-md rounded-lg shadow-lg border border-slate-700/50 overflow-hidden">
          <button className="w-10 h-10 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white border-r border-slate-700/50 transition-colors">-</button>
          <button className="w-10 h-10 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">+</button>
        </div>
        <button className="w-10 h-10 rounded-lg bg-panelDark/80 backdrop-blur-md border border-slate-700/50 shadow-lg flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
          <svg className="w-4 h-4 transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

    </div>
  );
};

export default DetailPanels;
