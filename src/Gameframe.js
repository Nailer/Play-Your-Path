
import React, { useEffect, useRef } from "react";
import './App.css';
import { createSummon, getSummonByCode, acceptSummon, assignQuest, completeQuest } from './lib/supabase';

export default function GameFrame() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMessage = async (event) => {
      if (!event.data || typeof event.data !== 'object') return;
      
      const { type, action, kind, code, questCode } = event.data;
      
      try {
        switch (type) {
          case 'PYP_SUMMON':
            if (action === 'create') {
              // Get current user from localStorage
              const auth = JSON.parse(localStorage.getItem('pyp-auth') || '{}');
              if (!auth.user?.profileId) {
                alert('Please login first');
                return;
              }
              
              const summon = await createSummon({ 
                ownerId: auth.user.profileId, 
                kind: kind || 'summon',
                ttlMinutes: 15 
              });
              
              // Copy to clipboard and show
              navigator.clipboard.writeText(summon.invite_code);
              alert(`Summon created! Code: ${summon.invite_code}\n(Copied to clipboard)`);
            } else if (action === 'join' && code) {
              const auth = JSON.parse(localStorage.getItem('pyp-auth') || '{}');
              if (!auth.user?.profileId) {
                alert('Please login first');
                return;
              }
              
              const summon = await getSummonByCode(code);
              if (!summon || summon.status !== 'open') {
                alert('Invalid or expired invite code');
                return;
              }
              
              await acceptSummon(code);
              alert('Successfully joined! You can now teleport to their house.');
            }
            break;
            
          case 'PYP_QUEST_ASSIGN':
            if (questCode) {
              const auth = JSON.parse(localStorage.getItem('pyp-auth') || '{}');
              if (!auth.user?.profileId) {
                alert('Please login first');
                return;
              }
              
              await assignQuest({ userId: auth.user.profileId, questCode });
              alert(`Quest assigned: ${questCode}`);
            }
            break;
            
          case 'PYP_QUEST_COMPLETE':
            if (questCode) {
              const auth = JSON.parse(localStorage.getItem('pyp-auth') || '{}');
              if (!auth.user?.profileId) {
                alert('Please login first');
                return;
              }
              
              const result = await completeQuest({ userId: auth.user.profileId, questCode });
              alert(`Quest completed! +${result.reward_points} points`);
            }
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
        alert(`Error: ${error.message}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="">
      <iframe
        ref={iframeRef}
        src={process.env.PUBLIC_URL + '/game/index.html'}
        title="My Game"
        className=""
        name="iframe1" 
        id="iframe1"
        frameBorder="0"
        style={{
          border: "none",
          width: "100%",
          height: "100vh",
          display: "block",
          overflow: "hidden",
          padding: "0",
          margin: "0"
        }}
      />
    </div>
  );
}
