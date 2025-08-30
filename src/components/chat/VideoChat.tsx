import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface VideoChatProps {
  sessionId: string;
  socket: Socket | null;
}

export default function VideoChat({ sessionId, socket }: VideoChatProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Initialize WebRTC
    initializeWebRTC();

    // Listen for WebRTC signals
    socket.on('webrtc_signal', handleWebRTCSignal);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);

    return () => {
      socket.off('webrtc_signal');
      socket.off('user_joined');
      socket.off('user_left');
      cleanupWebRTC();
    };
  }, [socket]);

  const initializeWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create RTCPeerConnection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc_signal', {
            type: 'ice-candidate',
            candidate: event.candidate,
            target: sessionId,
            sender: socket.id
          });
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        switch (peerConnection.connectionState) {
          case 'connected':
            setConnectionStatus('connected');
            setIsConnecting(false);
            break;
          case 'connecting':
            setConnectionStatus('connecting');
            setIsConnecting(true);
            break;
          case 'disconnected':
          case 'failed':
            setConnectionStatus('disconnected');
            setIsConnecting(false);
            break;
        }
      };

    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Unable to access camera/microphone. Please check permissions.');
    }
  };

  const handleUserJoined = async () => {
    if (!peerConnectionRef.current) return;

    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');

      // Create and send offer
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      if (socket) {
        socket.emit('webrtc_signal', {
          type: 'offer',
          sdp: offer,
          target: sessionId,
          sender: socket.id
        });
      }
    } catch (err) {
      console.error('Error creating offer:', err);
      setError('Failed to establish connection');
    }
  };

  const handleWebRTCSignal = async (signal: any) => {
    if (!peerConnectionRef.current) return;

    try {
      switch (signal.type) {
        case 'offer':
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          
          // Create and send answer
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);

          if (socket) {
            socket.emit('webrtc_signal', {
              type: 'answer',
              sdp: answer,
              target: sessionId,
              sender: socket.id
            });
          }
          break;

        case 'answer':
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          break;

        case 'ice-candidate':
          if (signal.candidate) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
          break;
      }
    } catch (err) {
      console.error('Error handling WebRTC signal:', err);
      setError('Connection error occurred');
    }
  };

  const handleUserLeft = () => {
    setRemoteStream(null);
    setConnectionStatus('disconnected');
    setIsConnecting(false);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const cleanupWebRTC = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionStatus('disconnected');
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  const endCall = () => {
    cleanupWebRTC();
    if (socket) {
      socket.emit('leave_chat', sessionId);
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Connection Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Video Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Video Chat</h2>
              <p className="text-purple-100 text-sm">
                Session: {sessionId.substring(0, 8)}...
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </div>
            </div>
          </div>
        </div>

        {/* Video Container */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Remote Video */}
            <div className="relative">
              <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video">
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-lg font-medium">Waiting for partner...</p>
                      {isConnecting && (
                        <div className="mt-2">
                          <div className="flex space-x-1 justify-center">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                Partner
              </div>
            </div>

            {/* Local Video */}
            <div className="relative">
              <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video">
                {localStream ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-lg font-medium">Loading camera...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                You
              </div>
            </div>
          </div>
        </div>

        {/* Video Controls */}
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={toggleMute}
              className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              title="Toggle Mute"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            
            <button
              onClick={toggleVideo}
              className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              title="Toggle Video"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            
            <button
              onClick={endCall}
              className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
              title="End Call"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Video Chat Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">📹 Video Chat Tips</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Ensure good lighting for better video quality</li>
          <li>• Find a quiet environment for clear audio</li>
          <li>• Be mindful of your background and surroundings</li>
          <li>• Use headphones to avoid audio feedback</li>
        </ul>
      </div>
    </div>
  );
}
