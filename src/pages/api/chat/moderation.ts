import { NextApiRequest, NextApiResponse } from 'next';
import { moderateText, moderateImage } from '@/lib/ai/moderation';

// In-memory storage for violations and blocked users
const userViolations = new Map<string, number>();
const blockedUsers = new Set<string>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, contentType, userId, sessionId } = req.body;

    if (!content || !contentType || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user is already blocked
    if (blockedUsers.has(userId)) {
      return res.status(403).json({ 
        blocked: true, 
        reason: 'User has been blocked due to multiple violations' 
      });
    }

    let moderationResult;

    if (contentType === 'text') {
      moderationResult = await moderateText(content);
    } else if (contentType === 'image') {
      moderationResult = await moderateImage(content);
    } else {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    if (moderationResult.flagged) {
      // Log violation
      const currentViolations = userViolations.get(userId) || 0;
      const newViolations = currentViolations + 1;
      userViolations.set(userId, newViolations);

      // Block user after 3 violations
      if (newViolations >= 3) {
        blockedUsers.add(userId);
        return res.status(403).json({
          blocked: true,
          reason: 'User blocked due to multiple violations',
          violations: newViolations
        });
      }

      // Warn user
      return res.json({
        flagged: true,
        action: moderationResult.action,
        categories: moderationResult.categories,
        violations: newViolations,
        warning: `Content flagged. You have ${3 - newViolations} warnings remaining.`
      });
    }

    // Content is clean
    return res.json({
      flagged: false,
      action: 'allow'
    });

  } catch (error) {
    console.error('Moderation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
