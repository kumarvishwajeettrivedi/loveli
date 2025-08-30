import { NextApiRequest, NextApiResponse } from 'next';

// In-memory storage for abuse reports
const abuseReports: Array<{
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  evidence: string;
  createdAt: string;
  resolved: boolean;
}> = [];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // Get all reports
    return res.json({
      reports: abuseReports,
      stats: {
        total: abuseReports.length,
        pending: abuseReports.filter(r => !r.resolved).length,
        resolved: abuseReports.filter(r => r.resolved).length
      }
    });
  }

  if (req.method === 'POST') {
    // Create new report
    const { reporterId, reportedId, reason, evidence } = req.body;
    
    if (!reporterId || !reportedId || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newReport = {
      id: Date.now().toString(),
      reporterId,
      reportedId,
      reason,
      evidence: evidence || '',
      createdAt: new Date().toISOString(),
      resolved: false
    };

    abuseReports.push(newReport);
    
    return res.status(201).json(newReport);
  }

  if (req.method === 'PUT') {
    // Resolve a report
    const { reportId } = req.body;
    
    const report = abuseReports.find(r => r.id === reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    report.resolved = true;
    
    return res.json(report);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
