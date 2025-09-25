import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css';
import GameFrame from './Gameframe';
import { AuthPage } from './AuthPage';


function App() {

  return (
    <BrowserRouter>
      
      <Routes>
        <Route path="/" element={<GameFrame />} />
        <Route path="/connect-wallet" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
