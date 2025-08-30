export interface UserSession {
  id: string;
  uuid: string;
  interests: string[];
  connectionId: string;
  createdAt: Date;
  matchedWith: string | null;
  deploymentId?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  moderated: boolean;
  flagged: boolean;
}

export interface MatchmakingRequest {
  userId: string;
  interests: string[];
  sessionId: string;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  sdp?: any;
  candidate?: any;
  target: string;
  sender: string;
}

export interface ModerationResult {
  flagged: boolean;
  categories: string[];
  scores: { [key: string]: number };
  action: 'allow' | 'warn' | 'block';
}

export interface ChatSession {
  id: string;
  participants: string[];
  interests: string[];
  startedAt: string;
  endedAt?: string;
  duration?: number;
  messages: ChatMessage[];
}

export interface InterestCategory {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
}

export interface UserReport {
  id: string;
  reporterUuid: string;
  reportedUuid: string;
  reason: string;
  evidence?: string;
  createdAt: Date;
  resolved: boolean;
}

export interface BlockedUser {
  id: string;
  uuid: string;
  reason: string;
  createdAt: Date;
}
