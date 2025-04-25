import React from 'react';
import { 
  FaBitcoin, FaEthereum, 
  FaMonero, FaDollarSign, 
  FaYenSign, FaPoundSign, 
  FaEuroSign, FaRupeeSign 
} from 'react-icons/fa';
import { 
  SiLitecoin, SiDogecoin, SiRipple, SiCardano, 
  SiBinance, SiPolkadot, SiTether, SiStellar,
  SiDash, SiZcash
} from 'react-icons/si';
import './IconStrip.css';

const IconStrip = ({ position = 'top' }) => {
  // Create two identical sets of icons for seamless looping
  const renderIcons = () => {
    const icons = [
      <FaBitcoin />, <SiLitecoin />, <FaEthereum />, <SiDogecoin />, 
      <SiRipple />, <SiCardano />, <SiBinance />, <SiPolkadot />,
      <SiTether />, <SiStellar />, <SiDash />, <SiZcash />,
      <FaMonero />, <FaBitcoin />, <FaEthereum />, <FaDollarSign />,
      <FaYenSign />, <FaPoundSign />, <FaEuroSign />, <FaRupeeSign />
    ];
    
    return icons.map((icon, index) => (
      <div className="strip-icon" key={`${position}-icon-${index}`}>
        {icon}
      </div>
    ));
  };

  return (
    <div className={`icon-strip ${position}`}>
      <div className="icons-scroll">
        {renderIcons()}
        {renderIcons()} {/* Duplicate for seamless looping */}
      </div>
    </div>
  );
};

export default IconStrip; 