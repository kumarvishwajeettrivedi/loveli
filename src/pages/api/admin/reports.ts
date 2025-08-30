import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getDatabase();
    
    // Get all abuse reports
    const reports = await db`
      SELECT 
        ar.*,
        bu1.uuid as reporter_uuid,
        bu2.uuid as reported_uuid
      FROM abuse_reports ar
      LEFT JOIN blocked_users bu1 ON ar.reporter_uuid = bu1.uuid
      LEFT JOIN blocked_users bu2 ON ar.reported_uuid = bu2.uuid
      ORDER BY ar.created_at DESC
    `;

    return res.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
