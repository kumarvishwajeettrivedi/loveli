import { NextApiRequest, NextApiResponse } from 'next';
import { getRedisClient } from '@/lib/redis';
import { UserSession, MatchmakingRequest } from '@/types';
import { calculateInterestScore, findBestMatch } from '@/lib/utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, interests, sessionId }: MatchmakingRequest = req.body;
    
    if (!userId || !interests || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const redis = await getRedisClient();
    
    // Store user session
    const userSession: UserSession = {
      id: userId,
      uuid: sessionId,
      interests,
      connectionId: '',
      createdAt: new Date(),
      matchedWith: null
    };
    
    await redis.set(`session:${sessionId}`, JSON.stringify(userSession));
    await redis.set(`interests:${sessionId}`, JSON.stringify(interests));
    
    // Find match with similar interests
    const potentialMatches = await findMatches(redis, interests, sessionId);
    
    if (potentialMatches.length > 0) {
      // Match with the most compatible user
      const bestMatch = findBestMatch(interests, potentialMatches);
      
      if (bestMatch) {
        await createChatSession(redis, sessionId, bestMatch.id, interests);
        
        return res.json({ 
          matched: true, 
          matchId: bestMatch.id,
          score: bestMatch.score,
          sessionId: `${sessionId}-${bestMatch.id}`
        });
      }
    }
    
    // No match found, add to waiting queue
    await redis.lPush('matchmaking:queue', sessionId);
    await redis.set(`waiting:${sessionId}`, JSON.stringify({
      timestamp: Date.now(),
      interests
    }));
    
    const queuePosition = await getQueuePosition(redis, sessionId);
    
    return res.json({ 
      matched: false, 
      queuePosition,
      estimatedWait: queuePosition * 30 // Rough estimate: 30 seconds per person in queue
    });
    
  } catch (error) {
    console.error('Matchmaking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function findMatches(
  redis: any, 
  interests: string[], 
  excludeSession: string
): Promise<Array<{ id: string; interests: string[] }>> {
  const allSessions = await redis.keys('session:*');
  const matches: Array<{ id: string; interests: string[]; score: number }> = [];
  
  for (const key of allSessions) {
    const sessionData = await redis.get(key);
    if (!sessionData) continue;
    
    const session: UserSession = JSON.parse(sessionData);
    if (session.uuid === excludeSession || session.matchedWith) continue;
    
    const score = calculateInterestScore(interests, session.interests);
    if (score > 0.3) { // Minimum similarity threshold
      matches.push({ 
        id: session.uuid, 
        interests: session.interests,
        score 
      });
    }
  }
  
  return matches
    .sort((a, b) => b.score - a.score)
    .map(m => ({ id: m.id, interests: m.interests }));
}

async function getQueuePosition(redis: any, sessionId: string): Promise<number> {
  const queue = await redis.lRange('matchmaking:queue', 0, -1);
  return queue.indexOf(sessionId);
}

async function createChatSession(
  redis: any, 
  session1: string, 
  session2: string, 
  interests: string[]
): Promise<void> {
  const chatSessionId = `${session1}-${session2}`;
  
  // Mark both users as matched
  await Promise.all([
    redis.set(`session:${session1}`, JSON.stringify({
      ...JSON.parse(await redis.get(`session:${session1}`) || '{}'),
      matchedWith: session2
    })),
    redis.set(`session:${session2}`, JSON.stringify({
      ...JSON.parse(await redis.get(`session:${session2}`) || '{}'),
      matchedWith: session1
    }))
  ]);
  
  // Remove from waiting queue
  await redis.lRem('matchmaking:queue', 0, session1);
  await redis.lRem('matchmaking:queue', 0, session2);
  
  // Create chat session
  await redis.set(`chat:${chatSessionId}`, JSON.stringify({
    participants: [session1, session2],
    interests,
    startedAt: new Date().toISOString(),
    messages: [],
    status: 'active'
  }));
  
  // Set expiration for chat session (24 hours)
  await redis.expire(`chat:${chatSessionId}`, 86400);
}
