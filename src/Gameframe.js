
import React from "react";
import './App.css';

export default function GameFrame() {
  return (
    <div className="">
      <iframe
        src="/game/index.html"
        title="My Game"
        className=""
        name="iframe1" 
        id="iframe1"  
        frameborder="0" 
        border="0" 
        cellspacing="0"
        style={{ borderStyle: "none", width: "120%", height: "1000px" }}
      />
    </div>
  );
}
