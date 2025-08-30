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
    
    console.log(`Matchmaking request: ${sessionId} with interests:`, interests);
    console.log(`Current sessions:`, Array.from(sessions.keys()));
    console.log(`Current queue:`, matchmakingQueue);
    
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
    console.log(`Potential matches found:`, potentialMatches.length);
    
    if (potentialMatches.length > 0) {
      // Match with the most compatible user
      const bestMatch = potentialMatches[0];
      console.log(`Matching ${sessionId} with ${bestMatch.id} (score: ${bestMatch.score})`);
      
      createChatSession(sessionId, bestMatch.id, interests);
      
      return res.json({ 
        matched: true, 
        matchId: bestMatch.id,
        score: bestMatch.score,
        sessionId: `${sessionId}-${bestMatch.id}`,
        message: 'Match found! Starting chat...'
      });
    }
    
    // No match found, add to waiting queue
    if (!matchmakingQueue.includes(sessionId)) {
      matchmakingQueue.push(sessionId);
      console.log(`Added ${sessionId} to queue. Queue length: ${matchmakingQueue.length}`);
    }
    
    return res.json({ 
      matched: false, 
      queuePosition: matchmakingQueue.indexOf(sessionId) + 1,
      estimatedWait: matchmakingQueue.length * 30, // Rough estimate: 30 seconds per person in queue
      message: 'Looking for matches... Please wait.',
      queueLength: matchmakingQueue.length
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
  
  console.log(`Looking for matches for ${excludeSession} with interests:`, interests);
  console.log(`Available sessions:`, Array.from(sessions.entries()).map(([id, session]) => ({ id, interests: session.interests, matched: session.matchedWith })));
  
  for (const [sessionId, session] of sessions) {
    if (sessionId === excludeSession || session.matchedWith) {
      console.log(`Skipping ${sessionId}: ${sessionId === excludeSession ? 'same session' : 'already matched'}`);
      continue;
    }
    
    const score = calculateInterestScore(interests, session.interests);
    console.log(`Session ${sessionId} score: ${score} (interests: ${session.interests})`);
    
    if (score > 0.1) { // Lowered threshold for better matching
      matches.push({ 
        id: session.uuid, 
        interests: session.interests,
        score 
      });
    }
  }
  
  console.log(`Final matches:`, matches);
  return matches.sort((a, b) => b.score - a.score);
}

function calculateInterestScore(interests1: string[], interests2: string[]): number {
  if (!interests1 || !interests2 || interests1.length === 0 || interests2.length === 0) {
    return 0;
  }
  
  const set1 = new Set(interests1.map(i => i.toLowerCase().trim()));
  const set2 = new Set(interests2.map(i => i.toLowerCase().trim()));
  
  const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
  const union = new Set([...Array.from(set1), ...Array.from(set2)]);
  
  const score = union.size === 0 ? 0 : intersection.size / union.size;
  console.log(`Interest score: ${intersection.size}/${union.size} = ${score}`);
  
  return score;
}

function createChatSession(
  session1: string, 
  session2: string, 
  interests: string[]
): void {
  const chatSessionId = `${session1}-${session2}`;
  console.log(`Creating chat session: ${chatSessionId}`);
  
  // Mark both users as matched
  const session1Data = sessions.get(session1);
  const session2Data = sessions.get(session2);
  
  if (session1Data) {
    session1Data.matchedWith = session2;
    sessions.set(session1, session1Data);
    console.log(`Marked ${session1} as matched with ${session2}`);
  }
  
  if (session2Data) {
    session2Data.matchedWith = session1;
    sessions.set(session2, session2Data);
    console.log(`Marked ${session2} as matched with ${session1}`);
  }
  
  // Remove from waiting queue
  const index1 = matchmakingQueue.indexOf(session1);
  if (index1 > -1) {
    matchmakingQueue.splice(index1, 1);
    console.log(`Removed ${session1} from queue`);
  }
  
  const index2 = matchmakingQueue.indexOf(session2);
  if (index2 > -1) {
    matchmakingQueue.splice(index2, 1);
    console.log(`Removed ${session2} from queue`);
  }
  
  // Create chat session
  chatSessions.set(chatSessionId, {
    participants: [session1, session2],
    interests,
    startedAt: new Date().toISOString(),
    messages: [],
    status: 'active'
  });
  
  console.log(`Chat session created successfully: ${chatSessionId}`);
}

// Add a debug endpoint to check current state
export async function GET(req: NextApiRequest, res: NextApiResponse) {
  return res.json({
    sessions: Array.from(sessions.entries()),
    queue: matchmakingQueue,
    chatSessions: Array.from(chatSessions.entries()),
    totalSessions: sessions.size,
    queueLength: matchmakingQueue.length,
    totalChats: chatSessions.size
  });
}
