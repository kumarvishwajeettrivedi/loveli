import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function TestInstructions() {
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.origin);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Test Instructions - Loveli</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
              🧪 How to Test Loveli Matchmaking
            </h1>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold text-blue-800 mb-2">📍 Current URL</h2>
                <p className="text-blue-700 font-mono text-sm break-all">
                  {currentUrl || 'Loading...'}
                </p>
                <p className="text-blue-600 text-sm mt-2">
                  Both devices must use <strong>exactly the same URL</strong> for matchmaking to work!
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold text-green-800 mb-2">✅ Step-by-Step Testing</h2>
                <ol className="list-decimal list-inside space-y-2 text-green-700">
                  <li><strong>Device 1:</strong> Open <code className="bg-green-100 px-2 py-1 rounded">/chat</code> on this URL</li>
                  <li><strong>Device 2:</strong> Open <code className="bg-green-100 px-2 py-1 rounded">/chat</code> on the <strong>same URL</strong></li>
                  <li><strong>Both:</strong> Select <strong>similar interests</strong> (e.g., "gaming", "music")</li>
                  <li><strong>Both:</strong> Click "Start Matchmaking"</li>
                  <li><strong>Wait:</strong> The system will automatically match you!</li>
                </ol>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold text-yellow-800 mb-2">⚠️ Common Issues & Solutions</h2>
                <div className="space-y-3 text-yellow-700">
                  <div>
                    <strong>Problem:</strong> "Finding matches..." but no match
                    <br />
                    <strong>Solution:</strong> Make sure both devices use the same URL and select similar interests
                  </div>
                  <div>
                    <strong>Problem:</strong> Different URLs on different devices
                    <br />
                    <strong>Solution:</strong> Copy the exact URL from one device to the other
                  </div>
                  <div>
                    <strong>Problem:</strong> No interests in common
                    <br />
                    <strong>Solution:</strong> Select at least 1-2 common interests like "gaming", "music", "technology"
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold text-purple-800 mb-2">🔧 Debug Tools</h2>
                <div className="space-y-2 text-purple-700">
                  <p><strong>Test Page:</strong> <a href="/test-matchmaking" className="underline hover:text-purple-900">/test-matchmaking</a></p>
                  <p><strong>Status Check:</strong> <a href="/api/chat/matchmaking" className="underline hover:text-purple-900">/api/chat/matchmaking</a></p>
                  <p><strong>Console Logs:</strong> Open browser dev tools to see detailed matchmaking logs</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">📱 Testing on Different Devices</h2>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Phone + Laptop:</strong> Use the same URL on both devices</p>
                  <p><strong>Two Browsers:</strong> Open incognito/private window on one</p>
                  <p><strong>Different Browsers:</strong> Chrome, Firefox, Safari - all work the same</p>
                  <p><strong>Network:</strong> Both devices must have internet access</p>
                </div>
              </div>
              
              <div className="text-center">
                <a 
                  href="/chat" 
                  className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  🚀 Start Testing Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
