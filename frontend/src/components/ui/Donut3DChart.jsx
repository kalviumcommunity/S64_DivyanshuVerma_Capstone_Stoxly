import React from 'react';
import ReactECharts from 'echarts-for-react';

const Donut3DChart = ({ gain, loss }) => {
  const total = Math.abs(gain) + Math.abs(loss);
  const option = {
    series: [
      {
        name: 'Gain vs Loss',
        type: 'pie',
        radius: ['60%', '90%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: false } },
        labelLine: { show: false },
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(0, 0, 0, 0.35)',
          borderRadius: 10,
        },
        data: [
          {
            value: Math.abs(gain),
            name: 'Gain',
            itemStyle: {
              color: 'rgba(0,255,0,0.85)',
              borderColor: '#00ff00',
              borderWidth: 2,
              shadowColor: 'rgba(0,255,0,0.5)',
              shadowBlur: 10,
            },
          },
          {
            value: Math.abs(loss),
            name: 'Loss',
            itemStyle: {
              color: 'rgba(255,76,76,0.85)',
              borderColor: '#ff4c4c',
              borderWidth: 2,
              shadowColor: 'rgba(255,76,76,0.5)',
              shadowBlur: 10,
            },
          },
        ],
      },
    ],
    tooltip: { show: false },
    animation: true,
  };

  return (
    <div style={{ width: 90, height: 90 }}>
      <ReactECharts option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default Donut3DChart; 