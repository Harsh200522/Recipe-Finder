import React from "react";
import "../style/noodleAnimation.css";

export default function NoodleAnimation() {
  return (
    <div>
    <div class="frame">
      <div class="scene1">
        <div class="boy">
          <div class="boy__head">
            <div class="boy__hair"></div>
            <div class="boy__eyes"></div>
            <div class="boy__mouth"></div>
            <div class="boy__cheeks"></div>
          </div>
          <div class="noodle"></div>
          <div class="boy__leftArm">
            <div class="chopsticks"></div>
          </div>
        </div>
        <div class="plate"></div>
        <div class="rightArm"></div>
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
