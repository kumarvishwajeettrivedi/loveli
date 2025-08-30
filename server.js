const { Server } = require('socket.io');
const { createServer } = require('http');
const Redis = require('redis');
const { moderateText } = require('./src/lib/ai/moderation');

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Redis client
let redisClient = null;

async function connectRedis() {
  try {
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    redisClient.on('connect', () => console.log('Redis Client Connected'));

    await redisClient.connect();
  } catch (error) {
    console.error('Redis connection failed:', error);
  }
}

// Connect to Redis
connectRedis();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join chat room
  socket.on('join_chat', async (sessionId) => {
    try {
      socket.join(sessionId);
      console.log(`User ${socket.id} joined chat ${sessionId}`);
      
      // Update user's connection ID
      if (redisClient) {
        const sessionData = await redisClient.get(`session:${socket.id}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          session.connectionId = socket.id;
          await redisClient.set(`session:${socket.id}`, JSON.stringify(session));
        }
      }
      
      // Notify the other user
      socket.to(sessionId).emit('user_joined', { userId: socket.id });
      
      // Send icebreaker if available
      const chatData = await redisClient.get(`chat:${sessionId}`);
      if (chatData) {
        const chat = JSON.parse(chatData);
        if (chat.icebreaker) {
          socket.emit('icebreaker', { message: chat.icebreaker });
        }
      }
    } catch (error) {
      console.error('Error joining chat:', error);
    }
  });
  
  // Handle text messages
  socket.on('send_message', async (data) => {
    try {
      const { sessionId, message, sessionId: senderSessionId } = data;
      
      if (!message || !sessionId) return;
      
      // Moderate message
      const moderationResult = await moderateText(message);
      
      if (moderationResult.action === 'block') {
        // Block user and notify
        socket.emit('message_blocked', { 
          reason: 'Violation of community guidelines',
          action: 'block'
        });
        return;
      }
      
      if (moderationResult.action === 'warn') {
        // Warn user but still send message
        socket.emit('message_warned', { 
          reason: 'Content flagged for review',
          action: 'warn'
        });
      }
      
      // Store message in Redis
      const messageData = {
        id: Date.now().toString(),
        sender: senderSessionId,
        content: message,
        timestamp: new Date().toISOString(),
        moderated: moderationResult.flagged,
        flagged: moderationResult.flagged
      };
      
      if (redisClient) {
        const chatData = await redisClient.get(`chat:${sessionId}`);
        if (chatData) {
          const chat = JSON.parse(chatData);
          chat.messages.push(messageData);
          await redisClient.set(`chat:${sessionId}`, JSON.stringify(chat));
        }
      }
      
      // Broadcast message to chat room
      io.to(sessionId).emit('new_message', messageData);
      
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle WebRTC signals
  socket.on('webrtc_signal', (data) => {
    try {
      const { target, type, sdp, candidate } = data;
      
      // Relay WebRTC signals to other user in the chat
      socket.to(target).emit('webrtc_signal', {
        type,
        sdp,
        candidate,
        sender: socket.id
      });
    } catch (error) {
      console.error('Error handling WebRTC signal:', error);
    }
  });
  
  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(data.sessionId).emit('user_typing', { 
      userId: socket.id,
      typing: true 
    });
  });
  
  socket.on('typing_stop', (data) => {
    socket.to(data.sessionId).emit('user_typing', { 
      userId: socket.id,
      typing: false 
    });
  });
  
  // Handle user leaving
  socket.on('leave_chat', async (sessionId) => {
    try {
      socket.leave(sessionId);
      
      // Notify other users
      socket.to(sessionId).emit('user_left', { userId: socket.id });
      
      // Update session status
      if (redisClient) {
        const sessionData = await redisClient.get(`session:${socket.id}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          session.matchedWith = null;
          await redisClient.set(`session:${socket.id}`, JSON.stringify(session));
        }
      }
      
      console.log(`User ${socket.id} left chat ${sessionId}`);
    } catch (error) {
      console.error('Error leaving chat:', error);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      console.log('User disconnected:', socket.id);
      
      // Notify chat partners
      const rooms = Array.from(socket.rooms);
      for (const room of rooms) {
        if (room !== socket.id) {
          socket.to(room).emit('user_left', { userId: socket.id });
        }
      }
      
      // Clean up session
      if (redisClient) {
        const sessionData = await redisClient.get(`session:${socket.id}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          session.matchedWith = null;
          await redisClient.set(`session:${socket.id}`, JSON.stringify(session));
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down WebSocket server...');
  
  if (redisClient) {
    await redisClient.quit();
  }
  
  httpServer.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.WS_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
