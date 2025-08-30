import { useState } from 'react';
import Head from 'next/head';

export default function TestMatchmaking() {
  const [status, setStatus] = useState<string>('');
  const [sessions, setSessions] = useState<any>(null);

  const testMatchmaking = async () => {
    setStatus('Testing matchmaking...');
    
    try {
      // Test endpoint
      const response = await fetch('/api/chat/matchmaking', {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
        setStatus('Matchmaking status retrieved successfully!');
      } else {
        setStatus('Failed to get matchmaking status');
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const createTestSession = async () => {
    setStatus('Creating test session...');
    
    try {
      const testId = `test-${Date.now()}`;
      const response = await fetch('/api/chat/matchmaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testId,
          interests: ['gaming', 'music', 'technology'],
          sessionId: testId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setStatus(`Test session created: ${JSON.stringify(result)}`);
        setTimeout(testMatchmaking, 1000); // Refresh status
      } else {
        setStatus('Failed to create test session');
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  return (
    <>
      <Head>
        <title>Test Matchmaking - Loveli</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Matchmaking Test Page</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
              
              <button
                onClick={createTestSession}
                className="w-full mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create Test Session
              </button>
              
              <button
                onClick={testMatchmaking}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Check Matchmaking Status
              </button>
              
              <div className="mt-4 p-3 bg-gray-100 rounded">
                <p className="text-sm text-gray-700">{status}</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Current Status</h2>
              
              {sessions && (
                <div className="space-y-4">
                  <div>
                    <strong>Total Sessions:</strong> {sessions.totalSessions}
                  </div>
                  <div>
                    <strong>Queue Length:</strong> {sessions.queueLength}
                  </div>
                  <div>
                    <strong>Active Chats:</strong> {sessions.totalChats}
                  </div>
                  
                  {sessions.sessions.length > 0 && (
                    <div>
                      <strong>Active Sessions:</strong>
                      <ul className="mt-2 space-y-1">
                        {sessions.sessions.map(([id, session]: [string, any]) => (
                          <li key={id} className="text-sm bg-gray-50 p-2 rounded">
                            <strong>{id}</strong> - {session.interests.join(', ')}
                            {session.matchedWith && ` (matched with ${session.matchedWith})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {sessions.queue.length > 0 && (
                    <div>
                      <strong>Queue:</strong>
                      <ul className="mt-2 space-y-1">
                        {sessions.queue.map((id: string, index: number) => (
                          <li key={id} className="text-sm bg-yellow-50 p-2 rounded">
                            #{index + 1}: {id}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">How to Test</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Click "Create Test Session" to add a user to the system</li>
              <li>Open another browser/incognito window and go to <code className="bg-gray-100 px-2 py-1 rounded">/chat</code></li>
              <li>Select interests and try to match</li>
              <li>Use "Check Matchmaking Status" to see current state</li>
              <li>Repeat with different interests to test matching algorithm</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
