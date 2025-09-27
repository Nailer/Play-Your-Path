-- Seed some initial quests for PYP
INSERT INTO quests (code, title, description, reward_points) VALUES 
('FISH_DAILY_1', 'Daily Oracle Consultation', 'Ask the Oracle Fish a question about quests, tasks, or challenges', 10),
('EXPLORE_HOUSE', 'House Explorer', 'Visit all 4 main rooms in the PYP Hub', 15),
('FIRST_SUMMON', 'Social Butterfly', 'Create your first summon invite', 5),
('JOIN_SUMMON', 'Friend Connector', 'Join someone else''s house via invite code', 5),
('TELEPORT_MASTER', 'Portal Walker', 'Use the teleporter to visit external maps', 20),
('LEARN_BASICS', 'Knowledge Seeker', 'Complete a learning activity in the Study Room', 25),
('TRADE_ITEM', 'Market Trader', 'Make a trade in the Marketplace Room', 30),
('GOVERN_VOTE', 'Community Leader', 'Cast a vote in the Council Room', 35)
ON CONFLICT (code) DO NOTHING;
