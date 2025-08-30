import { NextApiRequest, NextApiResponse } from 'next';
import { moderateText, moderateImage } from '@/lib/ai/moderation';
import { getRedisClient } from '@/lib/redis';
import { getDatabase } from '@/lib/database';
import { ModerationResult } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, type, sessionId, targetSessionId } = req.body;
    
    if (!content || !type || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    let moderationResult: ModerationResult;
    
    // Moderate content based on type
    if (type === 'text') {
      moderationResult = await moderateText(content);
    } else if (type === 'image') {
      moderationResult = await moderateImage(content);
    } else {
      return res.status(400).json({ error: 'Invalid content type' });
    }
    
    // If content is flagged, take action
    if (moderationResult.flagged) {
      await handleFlaggedContent(sessionId, moderationResult, content);
      
      // Return moderation result with action
      return res.json({
        ...moderationResult,
        content: moderationResult.action === 'block' ? null : content
      });
    }
    
    // Content is clean, allow it
    return res.json({
      ...moderationResult,
      content
    });
    
  } catch (error) {
    console.error('Moderation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleFlaggedContent(
  sessionId: string, 
  moderationResult: ModerationResult, 
  content: string
): Promise<void> {
  const redis = await getRedisClient();
  const db = await getDatabase();
  
  // Log the violation
  await redis.set(`violation:${sessionId}:${Date.now()}`, JSON.stringify({
    content: content.substring(0, 200), // Store truncated content
    categories: moderationResult.categories,
    scores: moderationResult.scores,
    action: moderationResult.action,
    timestamp: new Date().toISOString()
  }));
  
  // Check violation count for this session
  const violations = await redis.keys(`violation:${sessionId}:*`);
  
  if (violations.length >= 3) {
    // Third violation - block user
    await blockUser(sessionId, 'Multiple content violations', db);
    
    // Notify chat partner
    const sessionData = await redis.get(`session:${sessionId}`);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      if (session.matchedWith) {
        await redis.set(`blocked:${session.matchedWith}`, JSON.stringify({
          reason: 'Partner blocked due to violations',
          timestamp: new Date().toISOString()
        }));
      }
    }
  } else if (violations.length >= 2) {
    // Second violation - warn user
    await redis.set(`warning:${sessionId}`, JSON.stringify({
      count: violations.length,
      timestamp: new Date().toISOString(),
      message: 'This is your second warning. One more violation will result in a ban.'
    }));
  }
  
  // Set expiration for violation records (24 hours)
  await redis.expire(`violation:${sessionId}:${Date.now()}`, 86400);
}

async function blockUser(sessionId: string, reason: string, db: any): Promise<void> {
  try {
    // Add to blocked users table
    await db`
      INSERT INTO blocked_users (uuid, reason)
      VALUES (${sessionId}, ${reason})
      ON CONFLICT (uuid) DO UPDATE SET
        reason = EXCLUDED.reason,
        created_at = NOW()
    `;
    
    console.log(`User ${sessionId} blocked for: ${reason}`);
  } catch (error) {
    console.error('Error blocking user:', error);
  }
}

// Additional endpoint for checking if user is blocked
export async function checkUserStatus(sessionId: string): Promise<{
  blocked: boolean;
  warning?: any;
  violations: number;
}> {
  const redis = await getRedisClient();
  const db = await getDatabase();
  
  try {
    // Check if user is blocked in database
    const blockedUser = await db`
      SELECT * FROM blocked_users WHERE uuid = ${sessionId}
    `;
    
    if (blockedUser.length > 0) {
      return { blocked: true, violations: 0 };
    }
    
    // Check warnings
    const warning = await redis.get(`warning:${sessionId}`);
    const violations = await redis.keys(`violation:${sessionId}:*`);
    
    return {
      blocked: false,
      warning: warning ? JSON.parse(warning) : undefined,
      violations: violations.length
    };
  } catch (error) {
    console.error('Error checking user status:', error);
    return { blocked: false, violations: 0 };
  }
}
