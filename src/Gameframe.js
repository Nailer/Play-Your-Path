
import React from "react";
import './App.css';

export default function GameFrame() {
  return (
    <div className="">
      <iframe
        src={process.env.PUBLIC_URL + '/game/index.html'}
        title="My Game"
        className=""
        name="iframe1" 
        id="iframe1"
        frameBorder="0"
        style={{ border: "none", width: "100%", height: "calc(100vh - 60px)" }}
      />
    </div>
  );
}
