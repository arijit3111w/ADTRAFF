import React, { useState } from 'react';
import { FaMapMarkerAlt, FaLocationArrow, FaSearch, FaCalendarAlt, FaCar } from 'react-icons/fa';
import { motion } from 'framer-motion';

const SearchPanel = ({ onSearch, loading }) => {
  const [formData, setFormData] = useState({
    start: '',
    destination: '',
    day: 'Monday',
    mode: 'car'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.start && formData.destination) {
      onSearch(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl mx-auto p-6 md:p-8 relative z-10 border border-white mt-[-40px]"
    >
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
        
        {/* Start Location */}
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-slate-700 mb-2">Start Location</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaMapMarkerAlt className="text-slate-400" />
            </div>
            <input
              type="text"
              name="start"
              required
              value={formData.start}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-slate-50 transition-colors placeholder-slate-400"
              placeholder="e.g., Downtown"
            />
          </div>
        </div>

        {/* Destination */}
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-slate-700 mb-2">Destination</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLocationArrow className="text-slate-400" />
            </div>
            <input
              type="text"
              name="destination"
              required
              value={formData.destination}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-slate-50 transition-colors placeholder-slate-400"
              placeholder="e.g., Airport"
            />
          </div>
        </div>

        {/* Filters (Day/Mode) */}
        <div className="w-full md:w-32">
          <label className="block text-sm font-medium text-slate-700 mb-2">Day</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaCalendarAlt className="text-slate-400" />
            </div>
            <select
              name="day"
              value={formData.day}
              onChange={handleChange}
              className="block w-full pl-10 pr-8 py-3 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-slate-50 appearance-none"
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <option key={day} value={day}>{day.substring(0,3)}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="w-full md:w-32">
          <label className="block text-sm font-medium text-slate-700 mb-2">Mode</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaCar className="text-slate-400" />
            </div>
            <select
              name="mode"
              value={formData.mode}
              onChange={handleChange}
              className="block w-full pl-10 pr-8 py-3 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-slate-50 appearance-none"
            >
              <option value="car">Car</option>
              <option value="bike">Bike</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="w-full md:w-auto h-[46px]">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-full bg-primary hover:bg-blue-800 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <span>Analyze</span>
                <FaSearch className="text-sm" />
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default SearchPanel;
