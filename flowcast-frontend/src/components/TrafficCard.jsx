import React from 'react';
import { motion } from 'framer-motion';

const TrafficCard = ({ title, value, subtitle, icon, color = 'bg-primary', delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:-translate-y-1 hover:border-blue-100"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-2">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg text-white ${color}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

export default TrafficCard;
