import React from 'react';
import Plot from 'react-plotly.js';

const Donut3DPlotly = ({ gain, loss }) => {
  const values = [Math.abs(gain), Math.abs(loss)];
  const colors = ['#00ff00', '#ff4c4c'];
  const labels = ['Gain', 'Loss'];

  return (
    <div style={{ width: 200, height: 200 }}>
      <Plot
        data={[
          {
            values,
            labels,
            marker: {
              colors,
              line: { color: '#222', width: 2 },
            },
            hole: 0.6,
            type: 'pie',
            direction: 'clockwise',
            sort: false,
            textinfo: 'none',
            hoverinfo: 'none',
            showlegend: false,
          },
        ]}
        layout={{
          width: 200,
          height: 200,
          margin: { l: 0, r: 0, t: 0, b: 0 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          showlegend: false,
          annotations: [],
          // 3D effect: use camera and perspective
          scene: {
            camera: {
              eye: { x: 0.0, y: -1.5, z: 1.5 },
            },
          },
        }}
        config={{ staticPlot: true, displayModeBar: false }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default Donut3DPlotly; 