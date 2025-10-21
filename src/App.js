import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css';
import GameFrame from './Gameframe.js';
import { AuthPage } from './AuthPage.js';
import NftTest from './services/NftTest.js';


function App() {

  return (
    <BrowserRouter>
      
      <Routes>
        <Route path="/" element={<GameFrame />} />
        <Route path="/nft" element={<NftTest />} />
        <Route path="/connect-wallet" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
