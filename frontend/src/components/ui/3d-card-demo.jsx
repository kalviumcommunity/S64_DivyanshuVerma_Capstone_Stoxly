import React from "react";
import { CardBody, CardContainer, CardItem } from "./3d-card";

export default function ThreeDCardDemo() {
  return (
    <CardContainer className="card-demo-container">
      <CardBody className="card-demo-body">
        <CardItem
          translateZ="50"
          className="card-demo-title"
        >
          Make things float in air
        </CardItem>
        <CardItem
          as="p"
          translateZ="60"
          className="card-demo-description"
        >
          Hover over this card to unleash the power of CSS perspective
        </CardItem>
        <CardItem translateZ="100" className="card-demo-image-container">
          <img
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            height="1000"
            width="1000"
            className="card-demo-image"
            alt="thumbnail"
          />
        </CardItem>
        <div className="card-demo-actions">
          <CardItem
            translateZ={20}
            as="a"
            href="https://twitter.com/mannupaaji"
            target="__blank"
            className="card-demo-link"
          >
            Try now →
          </CardItem>
          <CardItem
            translateZ={20}
            as="button"
            className="card-demo-button"
          >
            Sign up
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );
} 