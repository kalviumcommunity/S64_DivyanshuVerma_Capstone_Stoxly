import React from 'react';
import './TriangleIcons.css';

export const UpwardTriangle = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="#00FF00" xmlns="http://www.w3.org/2000/svg">
    <polygon points="12,4 4,20 20,20" />
  </svg>
);

export const DownwardTriangle = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="red" xmlns="http://www.w3.org/2000/svg">
    <polygon points="12,20 4,4 20,4" />
  </svg>
);
