export type Role = "user" | "assistant";
export type AuthStatus = "checking" | "authenticated" | "guest";
export type ResponseStyle = "balanced" | "concise" | "detailed";
export type ServiceTier = "standard" | "flex" | "priority";
export type MessageStatus =
  | "thinking"
  | "streaming"
  | "complete"
  | "failed"
  | "stopped";
export type MessageFeedbackRating = "up" | "down";
export type ConversationFilter =
  | "all"
  | "starred"
  | "hasImages"
  | "usedWeb"
  | "failed"
  | "today"
  | "week";

export type ChatPreferences = {
  autoScroll: boolean;
  compactMessages: boolean;
  codeExecution: boolean;
  enterToSend: boolean;
  fileSearch: boolean;
  mapsGrounding: boolean;
  responseStyle: ResponseStyle;
  saveConversations: boolean;
  serviceTier: ServiceTier;
  showTimestamps: boolean;
  urlContext: boolean;
};

export type ImageAttachment = {
  id: string;
  name: string;
  mimeType: string;
  data: string;
  size: number;
};

export type GeneratedImage = {
  id: string;
  mimeType: string;
  data: string;
  alt: string;
};

export type MessageSource = {
  title: string;
  uri: string;
  type?: string;
};

export type MessageToolActivity = {
  type: "search" | "code" | "tool";
  title: string;
  detail?: string;
  code?: string;
  output?: string;
};

export type MessageMetadata = {
  activities?: MessageToolActivity[];
  latencyMs?: number;
  model?: string;
  requestId?: string;
  sources?: MessageSource[];
  statusReason?: string;
  tools?: {
    enabled?: string[];
    skipped?: string[];
  };
  usage?: {
    cachedContentTokenCount?: number;
    thoughtsTokenCount?: number;
    totalTokenCount?: number;
  };
};

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  status?: MessageStatus;
  thinking?: boolean;
  attachments?: ImageAttachment[];
  generatedImages?: GeneratedImage[];
  metadata?: MessageMetadata;
  feedback?: MessageFeedbackRating;
}

export interface ChatThread {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  starred?: boolean;
  messages: Message[];
}

export type StoredMessage = {
  id: string;
  role: Role;
  content: string;
  feedback?: MessageFeedbackRating;
  generatedImages?: GeneratedImage[];
  metadata?: MessageMetadata;
  status?: MessageStatus;
  timestamp: string;
};

export type StoredMessageFeedback = {
  id: string;
  comment?: string;
  createdAt: string;
  messageId: string;
  modelId: string;
  promptLength: number;
  rating: MessageFeedbackRating;
  requestId?: string;
  threadId: string;
  toolsUsed: string[];
  userId?: string;
};

export type StoredThread = Omit<ChatThread, "timestamp" | "messages"> & {
  timestamp: string;
  messages: StoredMessage[];
};

export type SessionUser = {
  uid: string;
  email: string;
  roles?: string[];
  displayName?: string | null;
};

export type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: {
    length: number;
    isFinal?: boolean;
    [index: number]: {
      transcript: string;
    };
  };
};

export type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult:
    | ((event: {
        resultIndex: number;
        results: SpeechRecognitionResultListLike;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
};
