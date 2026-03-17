import React from 'react';
import MapView from './MapView';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import DetailPanels from './DetailPanels';

const DashboardLayout = () => {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-baseDark font-sans">
      {/* Background Map layer */}
      <MapView />

      {/* Floating UI Elements over the map */}
      <Sidebar />
      <TopNav />
      <DetailPanels />
    </div>
  );
};

export default DashboardLayout;
