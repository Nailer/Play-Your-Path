
import React, { useEffect, useRef, useState } from "react";
import './App.css';
import { createSummon, getSummonByCode, acceptSummon, assignQuest, completeQuest, getUserHederaAccount, getHtsConfig } from './lib/supabase';
import { claimDailyReward } from './services/dailyRewardService';
import { hederaService } from './services/hederaService';
import TalismanCollection from './components/TalismanCollection';
import { AuthPage } from "./AuthPage.js";

export default function GameFrame() {
  const iframeRef = useRef(null);
  const [showTalismanCollection, setShowTalismanCollection] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

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
                // Demo mode: create fake user
                if (iframeRef.current?.contentWindow?.PYP?.demoMode) {
                  const demoUser = { profileId: 'demo-user-123', name: 'Demo Player' };
                  const summon = { invite_code: 'DEMO123' };
                  navigator.clipboard.writeText(summon.invite_code);
                  if (iframeRef.current?.contentWindow?.PYP?.showNotification) {
                    iframeRef.current.contentWindow.PYP.showNotification(`Demo Summon created! Code: ${summon.invite_code} (Copied to clipboard)`, 'success');
                  }
                  return;
                }
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
              if (iframeRef.current?.contentWindow?.PYP?.showNotification) {
                iframeRef.current.contentWindow.PYP.showNotification(`Summon created! Code: ${summon.invite_code} (Copied to clipboard)`, 'success');
              } else {
                alert(`Summon created! Code: ${summon.invite_code}\n(Copied to clipboard)`);
              }
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
              if (iframeRef.current?.contentWindow?.PYP?.showNotification) {
                iframeRef.current.contentWindow.PYP.showNotification('Successfully joined! You can now teleport to their house.', 'success');
              } else {
                alert('Successfully joined! You can now teleport to their house.');
              }
            }
            break;
            
          case 'PYP_QUEST_ASSIGN':
            if (questCode) {
              const auth = JSON.parse(localStorage.getItem('pyp-auth') || '{}');
              if (!auth.user?.profileId) {
                // Demo mode: fake quest assignment
                if (iframeRef.current?.contentWindow?.PYP?.demoMode) {
                  if (iframeRef.current?.contentWindow?.PYP?.showNotification) {
                    iframeRef.current.contentWindow.PYP.showNotification(`Demo: Quest assigned: ${questCode}`, 'info');
                  } else {
                    alert(`Demo: Quest assigned: ${questCode}`);
                  }
                  // Show quest status in game
                  if (iframeRef.current?.contentWindow?.PYP?.showQuestStatus) {
                    iframeRef.current.contentWindow.PYP.showQuestStatus([{ title: questCode, reward_points: 10 }]);
                  }
                  return;
                }
                alert('Please login first');
                return;
              }
              
              await assignQuest({ userId: auth.user.profileId, questCode });
              if (iframeRef.current?.contentWindow?.PYP?.showNotification) {
                iframeRef.current.contentWindow.PYP.showNotification(`Quest assigned: ${questCode}`, 'info');
              } else {
                alert(`Quest assigned: ${questCode}`);
              }
              
              // Show quest status in game
              if (iframeRef.current?.contentWindow?.PYP?.showQuestStatus) {
                iframeRef.current.contentWindow.PYP.showQuestStatus([{ title: questCode, reward_points: 10 }]);
              }
            }
            break;
            
          case 'PYP_QUEST_COMPLETE':
            if (questCode) {
              const auth = JSON.parse(localStorage.getItem('pyp-auth') || '{}');
              if (!auth.user?.profileId) {
                // Demo mode: fake quest completion
                if (iframeRef.current?.contentWindow?.PYP?.demoMode) {
                  if (iframeRef.current?.contentWindow?.PYP?.showNotification) {
                    iframeRef.current.contentWindow.PYP.showNotification(`Demo: Quest completed! +10 points`, 'success');
                  } else {
                    alert(`Demo: Quest completed! +10 points`);
                  }
                  // Hide quest status in game
                  if (iframeRef.current?.contentWindow?.PYP?.showQuestStatus) {
                    iframeRef.current.contentWindow.PYP.showQuestStatus([]);
                  }
                  return;
                }
                alert('Please login first');
                return;
              }
              
              const result = await completeQuest({ userId: auth.user.profileId, questCode });
              if (iframeRef.current?.contentWindow?.PYP?.showNotification) {
                iframeRef.current.contentWindow.PYP.showNotification(`Quest completed! +${result.reward_points} points`, 'success');
              } else {
                alert(`Quest completed! +${result.reward_points} points`);
              }
              
              // Hide quest status in game
              if (iframeRef.current?.contentWindow?.PYP?.showQuestStatus) {
                iframeRef.current.contentWindow.PYP.showQuestStatus([]);
              }
            }
            break;
            
          case 'PYP_DAILY_CLAIM':
            try {
              const auth = JSON.parse(localStorage.getItem('pyp-auth') || '{}');
              console.log('Auth object:', auth);
              console.log('User object:', auth.user);
              console.log('Hedera account:', auth.user?.hederaAccount);
              
              if (!auth.user?.profileId) {
                // Demo mode: fake daily claim
                if (iframeRef.current?.contentWindow?.PYP?.demoMode) {
                  // notify iframe modal listener
                  iframeRef.current?.contentWindow?.postMessage({
                    type: 'PYP_DAILY_RESULT',
                    ok: true,
                    points: 10,
                    message: 'Demo: Daily reward claimed!'
                  }, '*');
                  return;
                }
                alert('Please login first');
                return;
              }
              
              // Get Hedera account ID from auth or fetch from database
              let hederaAccountId = auth.user.hederaAccount?.accountId;
              if (!hederaAccountId) {
                console.log('Hedera account not in auth, fetching from database...');
                const hederaAccount = await getUserHederaAccount(auth.user.profileId);
                hederaAccountId = hederaAccount?.account_id;
                console.log('Fetched Hedera account:', hederaAccount);
              }
              
              const result = await claimDailyReward({ 
                userProfileId: auth.user.profileId,
                hederaAccountId: hederaAccountId
              });
              
              if (result.ok) {
                // Send structured result back to the iframe for fancy UI
                iframeRef.current?.contentWindow?.postMessage({
                  type: 'PYP_DAILY_RESULT',
                  ok: true,
                  points: result.points,
                  basePoints: result.basePoints,
                  bonus: result.bonus,
                  bonusMessage: result.bonusMessage,
                  message: `Daily reward claimed! +${result.points} points${result.bonusMessage ? ` (${result.bonusMessage})` : ''}`
                }, '*');
              } else {
                iframeRef.current?.contentWindow?.postMessage({
                  type: 'PYP_DAILY_RESULT',
                  ok: false,
                  message: result.message || 'Failed to claim daily reward'
                }, '*');
              }
            } catch (error) {
              console.error('Error claiming daily reward:', error);
              iframeRef.current?.contentWindow?.postMessage({
                type: 'PYP_DAILY_RESULT',
                ok: false,
                message: `Error: ${error.message}`
              }, '*');
            }
            break;

          case 'PYP_ASSOCIATE':
            try {
              const auth = JSON.parse(localStorage.getItem('pyp-auth') || '{}');
              if (!auth.user?.profileId) {
                alert('Please login first');
                return;
              }
              const [userHedera, hts] = await Promise.all([
                getUserHederaAccount(auth.user.profileId),
                getHtsConfig()
              ]);
              if (!userHedera?.account_id || !userHedera?.private_key) {
                throw new Error('Missing Hedera account or private key');
              }
              if (!hts?.reward_token_id) {
                throw new Error('Reward token not configured');
              }
              await hederaService.associateToken({
                accountId: userHedera.account_id,
                accountPrivateKey: userHedera.private_key,
                tokenId: hts.reward_token_id
              });
              if (iframeRef.current?.contentWindow?.PYP?.showNotification) {
                iframeRef.current.contentWindow.PYP.showNotification('Token associated successfully', 'success');
              } else {
                alert('Token associated successfully');
              }
            } catch (e) {
              if (iframeRef.current?.contentWindow?.PYP?.showNotification) {
                iframeRef.current.contentWindow.PYP.showNotification(`Association failed: ${e.message}`, 'error');
              } else {
                alert(`Association failed: ${e.message}`);
              }
            }
            break;
            
          case 'PYP_TALISMAN_COLLECTION':
            try {
              console.log('Talisman collection button clicked');
              const auth = JSON.parse(localStorage.getItem('pyp-auth') || '{}');
              console.log('Auth data:', auth);
              if (!auth.user?.profileId) {
                alert('Please login first');
                return;
              }
              console.log('Setting talisman collection to open for user:', auth.user.profileId);
              setCurrentUserId(auth.user.profileId);
              setShowTalismanCollection(true);
            } catch (error) {
              console.error('Error opening talisman collection:', error);
              alert(`Error: ${error.message}`);
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

  console.log('GameFrame render:', { showTalismanCollection, currentUserId });

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
      
      <TalismanCollection
        isOpen={showTalismanCollection}
        onClose={() => {
          console.log('Closing talisman collection');
          setShowTalismanCollection(false);
        }}
        userId={currentUserId}
      />
    </div>
  );
}
