import React from 'react';
import { motion } from 'framer-motion';
import TrafficCard from './TrafficCard';
import TrafficChart from './TrafficChart';
import MapView from './MapView';
import { FaClock, FaCarCrash, FaTrafficLight, FaChartLine } from 'react-icons/fa';

const ResultDashboard = ({ data, searchParams }) => {
  if (!data) return null;

  const { best_time, traffic_level, estimated_travel_time, congestion_index, hourly_prediction } = data;
  const { start, destination } = searchParams;

  // Determine traffic level color
  const getTrafficColor = (level) => {
    switch(level.toLowerCase()) {
      case 'low': return 'bg-teal-500';
      case 'moderate': return 'bg-amber-500';
      case 'high':
      case 'severe': return 'bg-rose-500';
      default: return 'bg-blue-500';
    }
  };

  // Determine congestion color
  const getCongestionColor = (index) => {
    if (index < 0.4) return 'bg-teal-500';
    if (index < 0.7) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 mt-4"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Traffic Prediction Results</h2>
        <p className="text-slate-500 mt-1">
          From <span className="font-semibold">{start}</span> to <span className="font-semibold">{destination}</span>
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <TrafficCard 
          title="Best Travel Time" 
          value={best_time} 
          icon={<FaClock className="text-2xl" />} 
          color="bg-primary"
          delay={0.1}
        />
        <TrafficCard 
          title="Traffic Level" 
          value={traffic_level} 
          icon={<FaTrafficLight className="text-2xl" />} 
          color={getTrafficColor(traffic_level)}
          delay={0.2}
        />
        <TrafficCard 
          title="Est. Travel Time" 
          value={estimated_travel_time} 
          icon={<FaCarCrash className="text-2xl" />} 
          color="bg-indigo-500"
          delay={0.3}
        />
        <TrafficCard 
          title="Congestion Index" 
          value={(congestion_index * 10).toFixed(1) + " / 10"} 
          icon={<FaChartLine className="text-2xl" />} 
          color={getCongestionColor(congestion_index)}
          delay={0.4}
        />
      </div>

      {/* Traffic Severity Meter */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg p-6 w-full mb-8 border border-slate-100"
      >
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Traffic Severity Meter</h3>
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
          <div className="bg-teal-500 h-full" style={{ width: '33%' }}></div>
          <div className="bg-amber-500 h-full" style={{ width: '33%' }}></div>
          <div className="bg-rose-500 h-full" style={{ width: '34%' }}></div>
        </div>
        <div className="flex justify-between mt-2 text-xs font-medium text-slate-500">
          <span>Low</span>
          <span>Moderate</span>
          <span>Heavy</span>
        </div>
        {/* Needle indicator based on congestion */}
        <div className="relative mt-[-2.5rem] w-full px-2">
          <div 
            className="absolute top-0 w-4 h-4 rounded-full bg-slate-800 border-2 border-white shadow-md transform -translate-x-1/2"
            style={{ left: `${Math.min(100, Math.max(0, congestion_index * 100))}%` }}
          ></div>
        </div>
      </motion.div>

      {/* Chart and Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficChart data={hourly_prediction} recommendedTime={best_time} />
        <MapView start={start} destination={destination} />
      </div>
    </motion.div>
  );
};

export default ResultDashboard;
