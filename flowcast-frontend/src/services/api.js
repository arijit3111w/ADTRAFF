export const predictTraffic = async (start, destination, mode = 'car', day = 'Monday') => {
  // Simulate an API call delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        best_time: "10:30 AM",
        traffic_level: "Moderate",
        estimated_travel_time: "35 minutes",
        congestion_index: 0.62,
        hourly_prediction: [
          { hour: "6 AM", traffic: 0.30 },
          { hour: "7 AM", traffic: 0.55 },
          { hour: "8 AM", traffic: 0.82 },
          { hour: "9 AM", traffic: 0.78 },
          { hour: "10 AM", traffic: 0.45 },
          { hour: "11 AM", traffic: 0.50 },
          { hour: "12 PM", traffic: 0.65 },
          { hour: "1 PM", traffic: 0.60 },
          { hour: "2 PM", traffic: 0.55 },
          { hour: "3 PM", traffic: 0.70 },
          { hour: "4 PM", traffic: 0.85 },
          { hour: "5 PM", traffic: 0.90 },
          { hour: "6 PM", traffic: 0.88 },
          { hour: "7 PM", traffic: 0.60 },
        ]
      });
    }, 1500); // 1.5 seconds mock delay
  });
};
