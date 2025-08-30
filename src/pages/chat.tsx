import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { io, Socket } from 'socket.io-client';
import Head from 'next/head';
import InterestSelector from '@/components/chat/InterestSelector';
import TextChat from '@/components/chat/TextChat';
import VideoChat from '@/components/chat/VideoChat';
import { UserSession } from '@/types';
import { generateUUID } from '@/lib/utils';

export default function ChatPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [matched, setMatched] = useState(false);
  const [matchDetails, setMatchDetails] = useState<any>(null);
  const [chatMode, setChatMode] = useState<'text' | 'video'>('text');
  const [isLoading, setIsLoading] = useState(false);
  const [matchStatus, setMatchStatus] = useState<string>('');
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Check if user has a session
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      router.push('/');
      return;
    }

    // Initialize session
    const userSession: UserSession = {
      id: sessionId,
      uuid: sessionId,
      interests: [],
      connectionId: '',
      createdAt: new Date(),
      matchedWith: null
    };
    
    setSession(userSession);
    
    // Connect to WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    socketRef.current = io(wsUrl);
    
    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server');
    });
    
    socketRef.current.on('match', handleMatch);
    socketRef.current.on('message', handleMessage);
    socketRef.current.on('disconnect', handleDisconnect);
    socketRef.current.on('error', handleError);
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [router]);

  const handleInterestsSelected = async (interests: string[]) => {
    if (!session || !socketRef.current) return;
    
    setIsLoading(true);
    
    try {
      const updatedSession = { ...session, interests };
      setSession(updatedSession);
      
      // Start matchmaking
      const response = await fetch('/api/chat/matchmaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.id,
          interests,
          sessionId: session.uuid
        })
      });
      
      if (!response.ok) {
        throw new Error('Matchmaking failed');
      }
      
      const result = await response.json();
      
      if (result.matched) {
        setMatched(true);
        setMatchDetails(result);
        setMatchStatus('Match found! Starting chat...');
        socketRef.current?.emit('join_chat', result.sessionId);
      } else {
        // Show queue status and wait for match
        setMatchStatus(result.message || 'Looking for matches...');
        setQueuePosition(result.queuePosition || 0);
        await waitForMatch();
      }
    } catch (error) {
      console.error('Error starting matchmaking:', error);
      alert('Failed to start matchmaking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const waitForMatch = async (): Promise<void> => {
    return new Promise((resolve) => {
      const checkMatch = async () => {
        try {
          const response = await fetch('/api/chat/matchmaking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: session?.id,
              interests: session?.interests,
              sessionId: session?.uuid
            })
          });
          
          const result = await response.json();
          
          if (result.matched) {
            setMatched(true);
            setMatchDetails(result);
            socketRef.current?.emit('join_chat', result.sessionId);
            resolve();
          } else {
            // Check again in 5 seconds
            setTimeout(checkMatch, 5000);
          }
        } catch (error) {
          console.error('Error checking for match:', error);
          setTimeout(checkMatch, 5000);
        }
      };
      
      checkMatch();
    });
  };

  const handleMatch = (data: any) => {
    setMatched(true);
    setMatchDetails(data);
  };

  const handleMessage = (data: any) => {
    console.log('Message received:', data);
  };

  const handleDisconnect = () => {
    console.log('Disconnected from server');
    setMatched(false);
    setMatchDetails(null);
  };

  const handleError = (error: any) => {
    console.error('WebSocket error:', error);
    alert('Connection error. Please refresh the page.');
  };

  const handleNewChat = () => {
    setMatched(false);
    setMatchDetails(null);
    setSession(prev => prev ? { ...prev, interests: [], matchedWith: null } : null);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!matched) {
    return (
      <>
        <Head>
          <title>Find Your Match - Loveli</title>
          <meta name="description" content="Select your interests and find the perfect chat partner on Loveli." />
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                {isLoading ? 'Finding Your Perfect Match...' : 'What Interests You?'}
              </h1>
              <p className="text-white/80 text-lg">
                {isLoading 
                  ? 'We\'re searching for someone who shares your interests...' 
                  : 'Select topics you\'d love to chat about'
                }
              </p>
            </div>
            
            <InterestSelector 
              onInterestsSelected={handleInterestsSelected}
              disabled={isLoading}
            />
            
            {isLoading && (
              <div className="text-center mt-8">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white/80 text-lg mb-2">{matchStatus}</p>
                {queuePosition > 0 && (
                  <p className="text-white/60 text-sm">
                    Position in queue: {queuePosition} • Estimated wait: {Math.ceil(queuePosition * 0.5)} minutes
                  </p>
                )}
                <div className="mt-4 p-4 bg-white/10 rounded-lg">
                  <p className="text-white/80 text-sm">
                    💡 <strong>Tip:</strong> Open this page in another browser or incognito window to test matching!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Chat - Loveli</title>
        <meta name="description" content="Chat with your matched partner on Loveli." />
      </Head>
      
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/')}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Chat</h1>
                  <p className="text-sm text-gray-500">
                    Matched with someone who shares your interests
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleNewChat}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  New Chat
                </button>
                
                <div className="flex space-x-1 bg-gray-200 rounded-lg p-1">
                  <button
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      chatMode === 'text' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setChatMode('text')}
                  >
                    Text
                  </button>
                  <button
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      chatMode === 'video' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setChatMode('video')}
                  >
                    Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Chat Content */}
        <main className="container mx-auto px-4 py-8">
          {chatMode === 'text' ? (
            <TextChat 
              sessionId={matchDetails.sessionId} 
              socket={socketRef.current} 
            />
          ) : (
            <VideoChat 
              sessionId={matchDetails.sessionId} 
              socket={socketRef.current} 
            />
          )}
        </main>
      </div>
    </>
  );
}
