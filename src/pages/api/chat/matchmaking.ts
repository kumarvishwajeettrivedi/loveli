import { NextApiRequest, NextApiResponse } from 'next';
import { UserSession, MatchmakingRequest } from '@/types';

// In-memory storage for sessions and matchmaking
const sessions = new Map<string, UserSession>();
const matchmakingQueue: string[] = [];
const chatSessions = new Map<string, any>();

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
    
    // Store user session in memory
    const userSession: UserSession = {
      id: userId,
      uuid: sessionId,
      interests,
      connectionId: '',
      createdAt: new Date(),
      matchedWith: null
    };
    
    sessions.set(sessionId, userSession);
    
    // Find match with similar interests
    const potentialMatches = findMatches(interests, sessionId);
    
    if (potentialMatches.length > 0) {
      // Match with the most compatible user
      const bestMatch = potentialMatches[0];
      
      createChatSession(sessionId, bestMatch.id, interests);
      
      return res.json({ 
        matched: true, 
        matchId: bestMatch.id,
        score: bestMatch.score,
        sessionId: `${sessionId}-${bestMatch.id}`
      });
    }
    
    // No match found, add to waiting queue
    matchmakingQueue.push(sessionId);
    
    return res.json({ 
      matched: false, 
      queuePosition: matchmakingQueue.length,
      estimatedWait: matchmakingQueue.length * 30 // Rough estimate: 30 seconds per person in queue
    });
    
  } catch (error) {
    console.error('Matchmaking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function findMatches(
  interests: string[], 
  excludeSession: string
): Array<{ id: string; interests: string[]; score: number }> {
  const matches: Array<{ id: string; interests: string[]; score: number }> = [];
  
  for (const [sessionId, session] of sessions) {
    if (sessionId === excludeSession || session.matchedWith) continue;
    
    const score = calculateInterestScore(interests, session.interests);
    if (score > 0.3) { // Minimum similarity threshold
      matches.push({ 
        id: session.uuid, 
        interests: session.interests,
        score 
      });
    }
  }
  
  return matches.sort((a, b) => b.score - a.score);
}

function calculateInterestScore(interests1: string[], interests2: string[]): number {
  const set1 = new Set(interests1.map(i => i.toLowerCase().trim()));
  const set2 = new Set(interests2.map(i => i.toLowerCase().trim()));
  
  const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
  const union = new Set([...Array.from(set1), ...Array.from(set2)]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function createChatSession(
  session1: string, 
  session2: string, 
  interests: string[]
): void {
  const chatSessionId = `${session1}-${session2}`;
  
  // Mark both users as matched
  const session1Data = sessions.get(session1);
  const session2Data = sessions.get(session2);
  
  if (session1Data) {
    session1Data.matchedWith = session2;
    sessions.set(session1, session1Data);
  }
  
  if (session2Data) {
    session2Data.matchedWith = session1;
    sessions.set(session2, session2Data);
  }
  
  // Remove from waiting queue
  const index1 = matchmakingQueue.indexOf(session1);
  if (index1 > -1) matchmakingQueue.splice(index1, 1);
  
  const index2 = matchmakingQueue.indexOf(session2);
  if (index2 > -1) matchmakingQueue.splice(index2, 1);
  
  // Create chat session
  chatSessions.set(chatSessionId, {
    participants: [session1, session2],
    interests,
    startedAt: new Date().toISOString(),
    messages: [],
    status: 'active'
  });
}
