import React from "react";
import { CardBody, CardContainer, CardItem } from "./3d-card";
import "./GainersCard.css";

export default function GainersCard({ gainers, loading, error }) {
  return (
    <CardContainer 
      className="gainers-card-container"
      containerClassName="gainers-card-outer"
    >
      <CardBody className="gainers-card-body">
        <CardItem
          translateZ="50"
          className="gainers-card-title"
        >
          Top Gainers
        </CardItem>
        
        {loading ? (
          <CardItem translateZ="60" className="gainers-card-loading">
            Loading...
          </CardItem>
        ) : error ? (
          <CardItem translateZ="60" className="gainers-card-error">
            {error}
          </CardItem>
        ) : gainers?.length > 0 ? (
          <CardItem translateZ="40" className="gainers-card-list">
            {gainers.map((stock) => (
              <div
                key={stock.symbol}
                className="gainers-card-item"
              >
                <div className="stock-info">
                  <span className="symbol">{stock.symbol}</span>
                  <span className="name">{stock.name}</span>
                </div>
                <span className="change gain">+{stock.change}%</span>
              </div>
            ))}
          </CardItem>
        ) : (
          <CardItem translateZ="60" className="gainers-card-empty">
            No gainers data available
          </CardItem>
        )}
      </CardBody>
    </CardContainer>
  );
}