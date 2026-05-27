export type Role = "user" | "assistant";
export type AuthStatus = "checking" | "authenticated" | "guest";

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

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  thinking?: boolean;
  attachments?: ImageAttachment[];
  generatedImages?: GeneratedImage[];
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
  timestamp: string;
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
