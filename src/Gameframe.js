
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
        style={{
          border: "none",
          width: "100%",
          height: "100vh", // full viewport height
          display: "block", // remove inline spacing
          overflow: "hidden",
          border: "none",
          padding: "0",
          margin: "0",
          overflow: "hidden"
        }}
      />
    </div>
  );
}
