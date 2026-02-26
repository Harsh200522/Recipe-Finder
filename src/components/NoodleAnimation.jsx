import React from "react";
import "../style/noodleAnimation.css";

export default function NoodleAnimation() {
  return (
    <div>
    <div className="frame">
      <div className="scene1">
        <div className="boy">
          <div className="boy__head">
            <div className="boy__hair"></div>
            <div className="boy__eyes"></div>
            <div className="boy__mouth"></div>
            <div className="boy__cheeks"></div>
          </div>
          <div className="noodle"></div>
          <div className="boy__leftArm">
            <div className="chopsticks"></div>
          </div>
        </div>
        <div className="plate"></div>
        <div className="rightArm"></div>
      </div>
     
    </div>
    <div className="loader-wrapper">
      <p className="loader-text">
        Please wait, loading delicious recipes<span className="dots"></span>
      </p>
    </div>
</div>
  );
}
