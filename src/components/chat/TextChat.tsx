import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { ChatMessage } from '@/types';
import { formatTimestamp } from '@/lib/utils';

interface TextChatProps {
  sessionId: string;
  socket: Socket | null;
}

export default function TextChat({ sessionId, socket }: TextChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [icebreaker, setIcebreaker] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('new_message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for typing indicators
    socket.on('user_typing', ({ userId, typing }) => {
      if (userId !== socket.id) {
        setOtherUserTyping(typing);
      }
    });

    // Listen for icebreakers
    socket.on('icebreaker', ({ message }) => {
      setIcebreaker(message);
    });

    // Listen for moderation warnings
    socket.on('message_warned', ({ reason }) => {
      alert(`Warning: ${reason}`);
    });

    // Listen for blocked messages
    socket.on('message_blocked', ({ reason }) => {
      alert(`Message blocked: ${reason}`);
    });

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('icebreaker');
      socket.off('message_warned');
      socket.off('message_blocked');
    };
  }, [socket]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      sessionId,
      message: newMessage.trim(),
      senderSessionId: sessionId.split('-')[0] // Extract sender's session ID
    };

    // Send message through socket
    socket.emit('send_message', messageData);

    // Add message to local state immediately for instant feedback
    const localMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'me',
      content: newMessage.trim(),
      timestamp: new Date(),
      moderated: false,
      flagged: false
    };

    setMessages(prev => [...prev, localMessage]);
    setNewMessage('');
    setIsTyping(false);

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit('typing_start', { sessionId });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('typing_stop', { sessionId });
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUseIcebreaker = () => {
    if (icebreaker) {
      setNewMessage(icebreaker);
      setIcebreaker(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Text Chat</h2>
              <p className="text-purple-100 text-sm">
                Session: {sessionId.substring(0, 8)}...
              </p>
            </div>
            
            {otherUserTyping && (
              <div className="flex items-center space-x-2 text-purple-100">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-200 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-200 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-200 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">Typing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Icebreaker Suggestion */}
        {icebreaker && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-800 font-medium mb-2">💡 Icebreaker Suggestion</p>
                <p className="text-blue-700">{icebreaker}</p>
              </div>
              <button
                onClick={handleUseIcebreaker}
                className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors"
              >
                Use This
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg font-medium">Start the conversation!</p>
              <p className="text-sm">Send a message to begin chatting</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.sender === 'me'
                      ? 'bg-purple-500 text-white rounded-br-md'
                      : 'bg-gray-200 text-gray-800 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'me' ? 'text-purple-100' : 'text-gray-500'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t bg-gray-50 p-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={1000}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-purple-500 text-white px-6 py-3 rounded-full font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
          
          {/* Character count */}
          <div className="text-right mt-2">
            <span className={`text-xs ${
              newMessage.length > 800 ? 'text-red-500' : 'text-gray-500'
            }`}>
              {newMessage.length}/1000
            </span>
          </div>
        </div>
      </div>

      {/* Chat Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">💬 Chat Tips</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Be respectful and kind to your chat partner</li>
          <li>• Ask open-ended questions to keep the conversation flowing</li>
          <li>• Share your thoughts and experiences</li>
          <li>• Report any inappropriate behavior</li>
        </ul>
      </div>
    </div>
  );
}
