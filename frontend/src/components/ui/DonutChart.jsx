import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const DonutChart = ({ gain, loss }) => {
  const total = Math.abs(gain) + Math.abs(loss);
  const data = {
    labels: ['Gain', 'Loss'],
    datasets: [
      {
        data: [Math.abs(gain), Math.abs(loss)],
        backgroundColor: [
          'rgba(0, 255, 0, 0.7)', // Green for gain
          'rgba(255, 76, 76, 0.7)' // Red for loss
        ],
        borderWidth: 2,
        borderColor: ['#00ff00', '#ff4c4c'],
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    cutout: '70%',
    animation: {
      animateRotate: true,
      animateScale: true,
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    maintainAspectRatio: false,
  };

  return (
    <div style={{ position: 'relative', width: 90, height: 90 }}>
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default DonutChart; 