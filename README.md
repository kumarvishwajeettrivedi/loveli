# ✨ Loveli - AI-Powered Anonymous Chat Platform

**Meet strangers, share stories, stay safe — with AI watching your back.**

Loveli is a next-generation anonymous chat platform that combines the excitement of meeting new people with cutting-edge AI technology to ensure a safe, enjoyable experience.

## 🚀 Features

- **🤖 AI-Powered Safety**: Advanced content moderation using OpenAI and Hugging Face APIs
- **🎯 Smart Matching**: Connect with people who share your interests using intelligent algorithms
- **💬 Text & Video Chat**: Both text and video chat modes with WebRTC support
- **🔒 Complete Privacy**: No personal information required, just anonymous conversations
- **⚡ Real-time Communication**: WebSocket-based real-time messaging and video calls
- **🛡️ Community Protection**: Report system and automatic user blocking for violations

## 🏗️ Architecture

- **Frontend**: Next.js 14 with React 18 and TypeScript
- **Backend**: Node.js with Socket.IO for real-time communication
- **Database**: PostgreSQL for persistent data storage
- **Cache**: Redis for session management and matchmaking
- **AI**: OpenAI Moderation API + Hugging Face models for content filtering
- **WebRTC**: Peer-to-peer video/audio communication
- **Styling**: Tailwind CSS with custom design system

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Redis 6+
- OpenAI API key
- Hugging Face API token

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd loveli
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/loveli"
   
   # Redis
   REDIS_URL="redis://localhost:6379"
   
   # OpenAI API
   OPENAI_API_KEY="your_openai_api_key"
   
   # Hugging Face API
   HUGGINGFACE_TOKEN="your_huggingface_token"
   
   # WebRTC
   TURN_SERVER_URL="your_turn_server_url"
   TURN_SERVER_USERNAME="your_turn_username"
   TURN_SERVER_CREDENTIAL="your_turn_credential"
   
   # Session
   SESSION_SECRET="your_session_secret_here"
   
   # Next.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your_nextauth_secret"
   
   # WebSocket
   WS_PORT="3001"
   NEXT_PUBLIC_WS_URL="http://localhost:3001"
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb loveli
   
   # The tables will be created automatically when you first run the app
   ```

5. **Start Redis server**
   ```bash
   # On macOS with Homebrew
   brew services start redis
   
   # On Ubuntu/Debian
   sudo systemctl start redis
   ```

## 🚀 Running the Application

### Development Mode

1. **Start the WebSocket server**
   ```bash
   npm run ws
   ```

2. **In a new terminal, start the Next.js app**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   - Frontend: http://localhost:3000
   - WebSocket: http://localhost:3001

### Production Mode

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
loveli/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── chat/          # Chat-specific components
│   │   └── layout/        # Layout components
│   ├── pages/             # Next.js pages and API routes
│   │   ├── api/           # API endpoints
│   │   │   ├── chat/      # Chat-related APIs
│   │   │   ├── webrtc/    # WebRTC signaling
│   │   │   └── admin/     # Admin APIs
│   │   ├── _app.tsx       # App wrapper
│   │   ├── _document.tsx  # Document wrapper
│   │   ├── index.tsx      # Landing page
│   │   └── chat.tsx       # Chat page
│   ├── lib/               # Utility libraries
│   │   ├── ai/            # AI integration
│   │   ├── redis.ts       # Redis client
│   │   ├── database.ts    # Database connection
│   │   └── utils.ts       # Utility functions
│   ├── types/             # TypeScript type definitions
│   ├── styles/            # CSS and styling
│   └── hooks/             # Custom React hooks
├── server.js              # WebSocket server
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## 🔧 Configuration

### AI Moderation

The platform uses a multi-layered approach to content moderation:

1. **OpenAI Moderation API**: Primary content filtering
2. **Hugging Face Models**: Fallback for text and image moderation
3. **Keyword Filtering**: Final fallback for basic content detection

### WebRTC Configuration

For production, configure TURN servers for NAT traversal:

```javascript
// In VideoChat component
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: process.env.TURN_SERVER_URL,
      username: process.env.TURN_SERVER_USERNAME,
      credential: process.env.TURN_SERVER_CREDENTIAL
    }
  ]
};
```

### Database Schema

The application automatically creates these tables:

- `blocked_users`: Users blocked for violations
- `abuse_reports`: User reports and moderation actions
- `chat_sessions`: Chat session metadata and analytics

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Test the application
# Open two browser windows and start chatting
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on push to main branch

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
REDIS_URL=your_production_redis_url
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_TOKEN=your_huggingface_token
```

## 🔒 Security Features

- **Content Moderation**: AI-powered filtering of inappropriate content
- **User Blocking**: Automatic blocking after multiple violations
- **Session Management**: Secure, anonymous session handling
- **Rate Limiting**: Built-in protection against spam and abuse
- **Privacy First**: No personal data collection or storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)

## 🙏 Acknowledgments

- OpenAI for content moderation APIs
- Hugging Face for open-source AI models
- Socket.IO for real-time communication
- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework

---

**Built with ❤️ by the Loveli Team**

*"Meet strangers, share stories, stay safe — with AI watching your back."*
