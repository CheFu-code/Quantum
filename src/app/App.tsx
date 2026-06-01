"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { AuthPromptModal } from "./_components/AuthPromptModal";
import { ChatComposer } from "./_components/ChatComposer";
import { ChatMessages } from "./_components/ChatMessages";
import { ChatSidebar } from "./_components/ChatSidebar";
import { SettingsModal } from "./_components/SettingsModal";
import { TopBar } from "./_components/TopBar";
import {
  CHEFU_LOGIN_HREF,
  DEFAULT_CHAT_PREFERENCES,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE,
  MODELS,
  SUPPORTED_ATTACHMENT_ACCEPT,
  VOICE_LANGUAGES,
  apiUrl,
  isSupportedAttachmentFile,
  resolveResponseStyle,
  resolveServiceTier,
  resolveStoredModel,
  type QuantumModel,
} from "./_lib/constants";
import {
  clearLocalConversationStorage,
  createId,
  loadSavedConversations,
  previewText,
  saveSavedConversations,
  sessionHeaders,
  sortThreads,
  threadTitle,
  toStoredThreads,
} from "./_lib/conversations";
import {
  feedbackByMessageId,
  saveMessageFeedback,
} from "./_lib/feedback";
import { fileToAttachment, getSpeechRecognition } from "./_lib/input";
import type {
  AuthStatus,
  ChatPreferences,
  ChatThread,
  ConversationFilter,
  ImageAttachment,
  Message,
  MessageFeedbackRating,
  SessionUser,
  SpeechRecognitionLike,
} from "./_lib/types";

type QuantumResponsePayload = {
  createdAt?: string;
  images?: Message["generatedImages"];
  message?: string;
  metadata?: Message["metadata"];
};
type ActiveRequest = {
  controller: AbortController;
  messageId: string;
  threadId: string;
};
type SendMessageOptions = {
  source?: "text" | "voice";
  text?: string;
};
type QuantumActivity = NonNullable<
  NonNullable<Message["metadata"]>["activities"]
>[number];

export default function App() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<QuantumModel>(MODELS[1]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [activeConv, setActiveConv] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [conversationFilter, setConversationFilter] =
    useState<ConversationFilter>("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authPromptFeature, setAuthPromptFeature] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [hasHydrated, setHasHydrated] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState("auto");
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [preferences, setPreferences] = useState<ChatPreferences>(
    DEFAULT_CHAT_PREFERENCES,
  );
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputNotice, setInputNotice] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const activeRequestRef = useRef<ActiveRequest | null>(null);
  const isSpeakingRef = useRef(false);
  const isTypingRef = useRef(false);
  const voiceModeRef = useRef(false);
  const voiceTurnPendingRef = useRef(false);
  const activeThread = threads.find((thread) => thread.id === activeConv);
  const messages = activeThread?.messages || [];

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    function syncLayout() {
      const nextIsMobile = mediaQuery.matches;
      setIsMobileLayout(nextIsMobile);
      setSidebarOpen(!nextIsMobile);
    }

    syncLayout();
    mediaQuery.addEventListener("change", syncLayout);

    return () => mediaQuery.removeEventListener("change", syncLayout);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch(apiUrl("/auth/me"), {
          credentials: "include",
          headers: sessionHeaders(),
        });

        if (cancelled) return;

        if (!response.ok) {
          setSessionUser(null);
          setAuthStatus("guest");
          return;
        }

        const data = (await response.json().catch(() => null)) as {
          user?: SessionUser;
        } | null;

        if (!data?.user?.email || !data.user.uid) {
          setSessionUser(null);
          setAuthStatus("guest");
          return;
        }

        setSessionUser(data.user);
        setAuthStatus("authenticated");
      } catch {
        if (!cancelled) {
          setSessionUser(null);
          setAuthStatus("guest");
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authStatus === "checking") return;

    if (authStatus === "guest") {
      clearLocalConversationStorage();
      setThreads([]);
      setActiveConv("");
      setHasHydrated(true);
      return;
    }

    let cancelled = false;

    async function loadConversations() {
      try {
        const savedThreads = await loadSavedConversations();
        if (cancelled) return;
        const hydratedThreads = applyStoredFeedback(savedThreads);
        setThreads(hydratedThreads);
        setActiveConv(hydratedThreads[0]?.id || "");
      } catch {
        if (cancelled) return;
        setThreads([]);
        setActiveConv("");
      } finally {
        if (!cancelled) setHasHydrated(true);
      }
    }

    setHasHydrated(false);
    void loadConversations();

    return () => {
      cancelled = true;
    };
  }, [authStatus, sessionUser?.uid]);

  useEffect(() => {
    if (
      !hasHydrated ||
      authStatus !== "authenticated" ||
      !preferences.saveConversations
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (isTyping) return;
      void saveSavedConversations(threads).catch(error => {
        console.error("Failed to save Quantum conversations:", error);
      });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [authStatus, hasHydrated, isTyping, preferences.saveConversations, threads]);

  useEffect(() => {
    return () => {
      speechRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    voiceModeRef.current = voiceModeEnabled;
  }, [voiceModeEnabled]);

  useEffect(() => {
    const storedModel = window.localStorage.getItem("quantum-selected-model");
    const storedWebSearch =
      window.localStorage.getItem("quantum-web-search-enabled") === "true";
    const storedVoiceLanguage =
      window.localStorage.getItem("quantum-voice-language") || "auto";
    const storedPreferences = parseStoredPreferences(
      window.localStorage.getItem("quantum-chat-preferences"),
    );

    setSelectedModel(resolveStoredModel(storedModel));
    setWebSearchEnabled(storedWebSearch);
    setPreferences(storedPreferences);
    setVoiceLanguage(
      VOICE_LANGUAGES.some((language) => language.id === storedVoiceLanguage)
        ? storedVoiceLanguage
        : "auto",
    );
  }, []);

  useEffect(() => {
    window.localStorage.setItem("quantum-selected-model", selectedModel.id);
  }, [selectedModel.id]);

  useEffect(() => {
    window.localStorage.setItem(
      "quantum-web-search-enabled",
      String(webSearchEnabled),
    );
  }, [webSearchEnabled]);

  useEffect(() => {
    window.localStorage.setItem("quantum-voice-language", voiceLanguage);
  }, [voiceLanguage]);

  useEffect(() => {
    window.localStorage.setItem(
      "quantum-voice-conversation-enabled",
      String(voiceModeEnabled),
    );
  }, [voiceModeEnabled]);

  useEffect(() => {
    window.localStorage.setItem(
      "quantum-chat-preferences",
      JSON.stringify(preferences),
    );
  }, [preferences]);

  useEffect(() => {
    const storedFeedback = feedbackByMessageId();
    setLikedIds(
      new Set(
        Array.from(storedFeedback.entries())
          .filter(([, rating]) => rating === "up")
          .map(([messageId]) => messageId),
      ),
    );
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") return;
    setAttachments([]);
    setVoiceModeEnabled(false);
    voiceTurnPendingRef.current = false;
    setIsSpeaking(false);
    window.speechSynthesis?.cancel();
    if (isListening) {
      speechRef.current?.stop();
      setIsListening(false);
    }
  }, [authStatus, isListening]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  async function handleAttachmentFiles(files: FileList | null) {
    if (authStatus !== "authenticated") {
      setAuthPromptFeature("file upload");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;

    const availableSlots = MAX_ATTACHMENTS - attachments.length;
    if (availableSlots <= 0) {
      setInputNotice(`You can attach up to ${MAX_ATTACHMENTS} files.`);
      return;
    }

    const supportedFiles = selectedFiles
      .filter(isSupportedAttachmentFile)
      .slice(0, availableSlots);
    const oversized = supportedFiles.find((file) => file.size > MAX_ATTACHMENT_SIZE);

    if (supportedFiles.length === 0) {
      setInputNotice("Attach images, PDFs, or text-based files.");
      return;
    }

    if (oversized) {
      setInputNotice("Attachments must be 10 MB or smaller.");
      return;
    }

    try {
      const nextAttachments = await Promise.all(supportedFiles.map(fileToAttachment));
      setAttachments((current) => [...current, ...nextAttachments]);
      setInputNotice("");
    } catch (error) {
      setInputNotice(
        error instanceof Error ? error.message : "Could not attach file.",
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function toggleVoiceInput() {
    if (voiceModeEnabled) {
      toggleVoiceMode();
      return;
    }

    if (authStatus !== "authenticated") {
      setAuthPromptFeature("voice input");
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    startVoiceRecognition({ autoSend: false });
  }

  function toggleVoiceMode() {
    if (authStatus !== "authenticated") {
      setAuthPromptFeature("voice conversation");
      return;
    }

    if (voiceModeEnabled) {
      setVoiceModeEnabled(false);
      voiceTurnPendingRef.current = false;
      stopListening();
      stopSpeaking();
      setInputNotice("Voice conversation stopped.");
      return;
    }

    if (!canUseSpeechSynthesis()) {
      setInputNotice("Spoken responses are not supported in this browser.");
      return;
    }

    setVoiceModeEnabled(true);
    setInputNotice("Voice conversation ready.");

    if (!isTypingRef.current && !isSpeakingRef.current) {
      window.setTimeout(() => startVoiceRecognition({ autoSend: true }), 0);
    }
  }

  function startVoiceRecognition({ autoSend }: { autoSend: boolean }) {
    const recognition = getSpeechRecognition();
    if (!recognition) {
      setInputNotice("Voice input is not supported in this browser.");
      if (autoSend) {
        setVoiceModeEnabled(false);
        voiceTurnPendingRef.current = false;
      }
      return;
    }

    recognition.continuous = autoSend;
    recognition.interimResults = true;
    recognition.lang =
      voiceLanguage === "auto" ? navigator.language || "en-US" : voiceLanguage;
    recognition.onresult = (event) => {
      let transcript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) {
          transcript += event.results[index][0]?.transcript || "";
        }
      }

      if (!transcript.trim()) return;

      if (autoSend) {
        const spokenText = transcript.trim();
        voiceTurnPendingRef.current = true;
        stopListening();
        setInput(spokenText);
        window.setTimeout(() => {
          void sendMessage({ source: "voice", text: spokenText });
        }, 0);
        return;
      }

      setInput((current) => {
        const separator = current.trim() ? " " : "";
        return `${current}${separator}${transcript.trim()}`;
      });
      window.setTimeout(autoResize, 0);
    };
    recognition.onerror = () => {
      setInputNotice(
        autoSend
          ? "Voice conversation paused. Tap voice mode to resume."
          : "Voice input stopped. Please try again.",
      );
      setIsListening(false);
      if (autoSend) {
        setVoiceModeEnabled(false);
        voiceTurnPendingRef.current = false;
      }
    };
    recognition.onend = () => {
      setIsListening(false);
      if (
        autoSend &&
        voiceModeRef.current &&
        !voiceTurnPendingRef.current &&
        !isTypingRef.current &&
        !isSpeakingRef.current
      ) {
        window.setTimeout(() => {
          if (
            voiceModeRef.current &&
            !voiceTurnPendingRef.current &&
            !isTypingRef.current &&
            !isSpeakingRef.current
          ) {
            startVoiceRecognition({ autoSend: true });
          }
        }, 400);
      }
    };

    stopListening();
    speechRef.current = recognition;
    setInputNotice("");
    setIsListening(true);
    recognition.start();
  }

  function stopListening() {
    speechRef.current?.stop();
    speechRef.current = null;
    setIsListening(false);
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  }

  function speakAssistantReply(content: string) {
    if (!voiceModeRef.current) return;
    if (!canUseSpeechSynthesis()) {
      setInputNotice("Spoken responses are not supported in this browser.");
      setVoiceModeEnabled(false);
      voiceTurnPendingRef.current = false;
      return;
    }

    const speechText = toSpeechText(content);
    if (!speechText) {
      voiceTurnPendingRef.current = false;
      restartVoiceConversation();
      return;
    }

    stopListening();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang =
      voiceLanguage === "auto" ? navigator.language || "en-US" : voiceLanguage;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      isSpeakingRef.current = false;
      voiceTurnPendingRef.current = false;
      setIsSpeaking(false);
      restartVoiceConversation();
    };
    utterance.onerror = () => {
      isSpeakingRef.current = false;
      voiceTurnPendingRef.current = false;
      setIsSpeaking(false);
      setInputNotice("Voice playback stopped.");
      restartVoiceConversation();
    };

    window.speechSynthesis.speak(utterance);
  }

  function restartVoiceConversation() {
    if (!voiceModeRef.current || isTypingRef.current) return;

    window.setTimeout(() => {
      if (!voiceModeRef.current || isTypingRef.current || isSpeakingRef.current) {
        return;
      }

      startVoiceRecognition({ autoSend: true });
    }, 450);
  }

  function appendAssistantContent({
    messageId,
    text,
    threadId,
  }: {
    messageId: string;
    text: string;
    threadId: string;
  }) {
    setThreads((currentThreads) =>
      currentThreads.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              messages: thread.messages.map((message) =>
                message.id === messageId
                  ? {
                      ...message,
                      content: `${message.content}${text}`,
                      status: "streaming",
                    }
                  : message,
              ),
            }
          : thread,
      ),
    );
  }

  function appendAssistantActivity({
    activity,
    messageId,
    threadId,
  }: {
    activity: QuantumActivity;
    messageId: string;
    threadId: string;
  }) {
    setThreads((currentThreads) =>
      currentThreads.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              messages: thread.messages.map((message) =>
                message.id === messageId
                  ? {
                      ...message,
                      metadata: {
                        ...message.metadata,
                        activities: mergeActivities(
                          message.metadata?.activities || [],
                          activity,
                        ),
                      },
                      status:
                        message.status === "thinking"
                          ? "thinking"
                          : message.status || "streaming",
                    }
                  : message,
              ),
            }
          : thread,
      ),
    );
  }

  function finalizeAssistantMessage({
    content,
    createdAt,
    generatedImages,
    messageId,
    metadata,
    status = "complete",
    statusReason,
    threadId,
  }: {
    content: string;
    createdAt?: string;
    generatedImages?: Message["generatedImages"];
    messageId: string;
    metadata?: Message["metadata"];
    status?: Message["status"];
    statusReason?: string;
    threadId: string;
  }) {
    const timestamp = createdAt ? new Date(createdAt) : new Date();

    setThreads((currentThreads) =>
      sortThreads(
        currentThreads.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                messages: thread.messages.map((message) =>
                  message.id === messageId
                    ? {
                        ...message,
                        content,
                        generatedImages,
                        metadata: {
                          ...metadata,
                          statusReason: statusReason || metadata?.statusReason,
                        },
                        status,
                        thinking: false,
                        timestamp,
                      }
                    : message,
                ),
                preview: previewText(content),
                timestamp,
              }
            : thread,
        ),
      ),
    );
  }

  async function requestQuantumResponse({
    assistantMessageId,
    attachments: activeAttachments,
    messageText,
    signal,
    threadId,
    visibleMessages,
  }: {
    assistantMessageId: string;
    attachments: ImageAttachment[];
    messageText: string;
    signal: AbortSignal;
    threadId: string;
    visibleMessages: Message[];
  }) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Accept": "text/event-stream",
        "Content-Type": "application/json",
        ...(sessionUser?.uid ? { "x-quantum-user-id": sessionUser.uid } : {}),
      },
      signal,
      body: JSON.stringify({
        message: messageText || "Describe the attached image.",
        model: selectedModel.id,
        attachments: activeAttachments.map(({ name, mimeType, data, size }) => ({
          name,
          mimeType,
          data,
          size,
        })),
        serviceTier: preferences.serviceTier,
        tools: {
          codeExecution: preferences.codeExecution,
          fileSearch: preferences.fileSearch,
          mapsGrounding: preferences.mapsGrounding,
          urlContext: preferences.urlContext,
        },
        webSearch: webSearchEnabled,
        responseStyle: preferences.responseStyle,
        history: buildVisibleHistory(visibleMessages),
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(
        errorData.error || "Quantum could not generate a response.",
      );
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("text/event-stream") && response.body
      ? await readQuantumEventStream(response, {
          onActivity: (activity) =>
            appendAssistantActivity({
              activity,
              messageId: assistantMessageId,
              threadId,
            }),
          onChunk: (text) =>
            appendAssistantContent({
              messageId: assistantMessageId,
              text,
              threadId,
            }),
        })
      : ((await response.json()) as QuantumResponsePayload);
    const reply = data.message?.trim();

    if (!reply) {
      throw new Error("Quantum returned an empty response.");
    }

    finalizeAssistantMessage({
      content: reply,
      createdAt: data.createdAt,
      generatedImages: normalizeGeneratedImages(data.images),
      messageId: assistantMessageId,
      metadata: data.metadata,
      threadId,
    });

    return reply;
  }

  async function sendMessage(options: SendMessageOptions = {}) {
    const text = (options.text ?? input).trim();
    if ((!text && attachments.length === 0) || isTyping) return;
    setInput("");
    const activeAttachments = options.source === "voice" ? [] : attachments;
    if (options.source !== "voice") setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const threadId = activeConv || createId("thread");
    const now = new Date();
    const displayContent = text;
    const summaryContent =
      text ||
      `Image attachment${activeAttachments.length === 1 ? "" : "s"}`;
    const userMsg: Message = {
      id: createId("message"),
      role: "user",
      content: displayContent,
      timestamp: now,
      attachments: activeAttachments,
    };
    const assistantMessageId = createId("message");
    const assistantMsg: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      status: "thinking",
      timestamp: now,
      thinking: true,
    };
    const controller = new AbortController();

    if (!activeConv) setActiveConv(threadId);
    setThreads((currentThreads) => {
      const existingThread = currentThreads.find((thread) => thread.id === threadId);
      const nextThreads = existingThread
        ? currentThreads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: [...thread.messages, userMsg, assistantMsg],
                  preview: previewText(summaryContent),
                  timestamp: now,
                }
              : thread,
          )
        : [
            {
              id: threadId,
              messages: [userMsg, assistantMsg],
              preview: previewText(summaryContent),
              starred: false,
              timestamp: now,
              title: threadTitle(summaryContent),
            },
            ...currentThreads,
          ];

      return sortThreads(nextThreads);
    });
    setIsTyping(true);
    activeRequestRef.current = {
      controller,
      messageId: assistantMessageId,
      threadId,
    };

    try {
      const reply = await requestQuantumResponse({
        assistantMessageId,
        attachments: activeAttachments,
        messageText: text,
        signal: controller.signal,
        threadId,
        visibleMessages: messages,
      });
      if (options.source === "voice" && voiceModeRef.current) {
        speakAssistantReply(reply);
      } else if (options.source === "voice") {
        voiceTurnPendingRef.current = false;
      }
    } catch (error) {
      const stopped = isAbortError(error);
      finalizeAssistantMessage({
        content:
          stopped
            ? getAssistantContent(threadId, assistantMessageId) || "Response stopped."
            : error instanceof Error
            ? `I could not complete that request: ${error.message}`
            : "I could not complete that request. Please try again.",
        messageId: assistantMessageId,
        status: stopped ? "stopped" : "failed",
        statusReason: stopped
          ? "Stopped by user"
          : error instanceof Error
            ? error.message
            : "Unknown error",
        threadId,
      });
      if (options.source === "voice") {
        voiceTurnPendingRef.current = false;
        restartVoiceConversation();
      }
    } finally {
      if (activeRequestRef.current?.messageId === assistantMessageId) {
        activeRequestRef.current = null;
      }
      setIsTyping(false);
    }
  }

  function stopResponse() {
    const activeRequest = activeRequestRef.current;
    if (!activeRequest) return;

    activeRequest.controller.abort();
    voiceTurnPendingRef.current = false;
    finalizeAssistantMessage({
      content:
        getAssistantContent(activeRequest.threadId, activeRequest.messageId) ||
        "Response stopped.",
      messageId: activeRequest.messageId,
      status: "stopped",
      statusReason: "Stopped by user",
      threadId: activeRequest.threadId,
    });
    activeRequestRef.current = null;
    setIsTyping(false);
    restartVoiceConversation();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    const isSubmitShortcut =
      e.key === "Enter" &&
      (preferences.enterToSend
        ? !e.shiftKey
        : e.metaKey || e.ctrlKey);

    if (isSubmitShortcut) {
      e.preventDefault();
      sendMessage();
    }
  }

  function copyMessage(id: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setCopyNotice("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
    setTimeout(() => setCopyNotice(""), 1800);
  }

  function getAssistantContent(threadId: string, messageId: string) {
    return (
      threads
        .find((thread) => thread.id === threadId)
        ?.messages.find((message) => message.id === messageId)
        ?.content.trim() || ""
    );
  }

  async function regenerateResponse(messageId: string) {
    if (!activeThread || isTyping) return;

    const assistantIndex = activeThread.messages.findIndex(
      (message) => message.id === messageId,
    );
    if (assistantIndex <= 0) return;

    const userIndex = activeThread.messages
      .slice(0, assistantIndex)
      .findLastIndex((message) => message.role === "user");

    if (userIndex < 0) return;

    const userMessage = activeThread.messages[userIndex];
    const nextMessages = activeThread.messages.slice(0, assistantIndex);
    const assistantMessageId = createId("message");
    const assistantMsg: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      status: "thinking",
      timestamp: new Date(),
      thinking: true,
    };
    const controller = new AbortController();

    setThreads((current) =>
      current.map((thread) =>
        thread.id === activeThread.id
          ? {
              ...thread,
              messages: [...nextMessages, assistantMsg],
              preview: previewText(userMessage.content || "Image attachment"),
              timestamp: new Date(),
            }
          : thread,
      ),
    );
    setIsTyping(true);
    activeRequestRef.current = {
      controller,
      messageId: assistantMessageId,
      threadId: activeThread.id,
    };

    try {
      await requestQuantumResponse({
        assistantMessageId,
        attachments: userMessage.attachments || [],
        messageText: userMessage.content,
        signal: controller.signal,
        threadId: activeThread.id,
        visibleMessages: nextMessages.slice(0, -1),
      });
    } catch (error) {
      const stopped = isAbortError(error);
      finalizeAssistantMessage({
        content:
          stopped
            ? getAssistantContent(activeThread.id, assistantMessageId) ||
              "Response stopped."
            : error instanceof Error
            ? `I could not regenerate that response: ${error.message}`
            : "I could not regenerate that response. Please try again.",
        messageId: assistantMessageId,
        status: stopped ? "stopped" : "failed",
        statusReason: stopped
          ? "Stopped by user"
          : error instanceof Error
            ? error.message
            : "Unknown error",
        threadId: activeThread.id,
      });
    } finally {
      if (activeRequestRef.current?.messageId === assistantMessageId) {
        activeRequestRef.current = null;
      }
      setIsTyping(false);
    }
  }

  function clearConversations() {
    setThreads([]);
    setActiveConv("");
    setLikedIds(new Set());
    clearLocalConversationStorage();
    setInputNotice(
      authStatus === "authenticated"
        ? "Conversation history cleared."
        : "Temporary conversations cleared.",
    );
  }

  function exportConversations() {
    const payload = JSON.stringify(toStoredThreads(threads), null, 2);
    const url = URL.createObjectURL(
      new Blob([payload], { type: "application/json" }),
    );
    const link = document.createElement("a");

    link.href = url;
    link.download = `quantum-conversations-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetPreferences() {
    setSelectedModel(MODELS[1]);
    setWebSearchEnabled(false);
    setVoiceLanguage("auto");
    setPreferences(DEFAULT_CHAT_PREFERENCES);
    setInputNotice("Preferences reset.");
  }

  function updatePreference<Key extends keyof ChatPreferences>(
    key: Key,
    value: ChatPreferences[Key],
  ) {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function startNewConversation() {
    setActiveConv("");
    setInput("");
    setAttachments([]);
    setLikedIds(new Set());
    if (isMobileLayout) setSidebarOpen(false);
  }

  function handleInputChange(value: string) {
    setInput(value);
    window.setTimeout(autoResize, 0);
  }

  function removeAttachment(attachmentId: string) {
    setAttachments((current) =>
      current.filter((item) => item.id !== attachmentId),
    );
  }

  function rateMessage(messageId: string, rating: MessageFeedbackRating) {
    const targetThread = threads.find((thread) =>
      thread.messages.some((message) => message.id === messageId),
    );
    const targetMessage = targetThread?.messages.find(
      (message) => message.id === messageId,
    );
    const userMessage = targetThread
      ? previousUserMessage(targetThread, messageId)
      : undefined;

    if (!targetThread || !targetMessage) return;

    const comment =
      rating === "down"
        ? window.prompt("What should Quantum improve next time?") || undefined
        : undefined;

    saveMessageFeedback({
      comment,
      messageId,
      modelId: selectedModel.id,
      promptLength: userMessage?.content.length || 0,
      rating,
      requestId: targetMessage.metadata?.requestId,
      threadId: targetThread.id,
      toolsUsed: targetMessage.metadata?.tools?.enabled || [],
      userId: sessionUser?.uid,
    });

    setThreads((current) =>
      current.map((thread) =>
        thread.id === targetThread.id
          ? {
              ...thread,
              messages: thread.messages.map((message) =>
                message.id === messageId
                  ? { ...message, feedback: rating }
                  : message,
              ),
            }
          : thread,
      ),
    );
    setLikedIds((current) => {
      const next = new Set(current);
      if (rating === "up") {
        next.add(messageId);
      } else {
        next.delete(messageId);
      }
      return next;
    });
    setCopyNotice(rating === "up" ? "Feedback saved" : "Feedback saved with note");
    setTimeout(() => setCopyNotice(""), 1800);
  }

  function toggleThreadStar(threadId: string) {
    setThreads((current) =>
      sortThreads(
        current.map((thread) =>
          thread.id === threadId
            ? { ...thread, starred: !thread.starred }
            : thread,
        ),
      ),
    );
  }

  function renameThread(threadId: string, title: string) {
    setThreads((current) =>
      current.map((thread) =>
        thread.id === threadId
          ? { ...thread, title }
          : thread,
      ),
    );
  }

  function deleteThread(threadId: string) {
    const nextThreads = threads.filter((thread) => thread.id !== threadId);

    setThreads(nextThreads);

    if (activeConv === threadId) {
      setActiveConv(nextThreads[0]?.id || "");
      setLikedIds(new Set());
    }
  }

  const filteredConvs = threads.filter((thread) =>
    matchesConversationFilter(thread, searchQuery, conversationFilter),
  );

  function selectThread(threadId: string) {
    setActiveConv(threadId);
    if (isMobileLayout) setSidebarOpen(false);
  }

  function openSettings() {
    setSettingsOpen(true);
    if (isMobileLayout) setSidebarOpen(false);
  }

  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-background">
      <ChatSidebar
        open={sidebarOpen}
        threads={filteredConvs}
        activeThreadId={activeConv}
        authStatus={authStatus}
        conversationFilter={conversationFilter}
        searchQuery={searchQuery}
        isMobile={isMobileLayout}
        onFilterChange={setConversationFilter}
        onSearchChange={setSearchQuery}
        onNewConversation={startNewConversation}
        onSelectThread={selectThread}
        onToggleStar={toggleThreadStar}
        onOpenSettings={openSettings}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <TopBar
          activeThread={activeThread}
          conversationCount={threads.length}
          sidebarOpen={sidebarOpen}
          selectedModel={selectedModel}
          authStatus={authStatus}
          sessionUser={sessionUser}
          onClearConversations={clearConversations}
          onDeleteThread={deleteThread}
          onExportConversations={exportConversations}
          onNewConversation={startNewConversation}
          onOpenSettings={openSettings}
          onRenameThread={renameThread}
          onToggleThreadStar={toggleThreadStar}
          onToggleSidebar={() => setSidebarOpen((value) => !value)}
          onSelectModel={setSelectedModel}
        />

        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          isLoading={authStatus === "checking" || !hasHydrated}
          autoScroll={preferences.autoScroll}
          copiedId={copiedId}
          compactMessages={preferences.compactMessages}
          likedIds={likedIds}
          messagesEndRef={messagesEndRef}
          showTimestamps={preferences.showTimestamps}
          onCopy={copyMessage}
          onRegenerate={regenerateResponse}
          onFeedback={rateMessage}
          onSuggestion={setInput}
        />

        <ChatComposer
          input={input}
          attachments={attachments}
          isTyping={isTyping}
          authStatus={authStatus}
          codeExecutionEnabled={preferences.codeExecution}
          enterToSend={preferences.enterToSend}
          mapsGroundingEnabled={preferences.mapsGrounding}
          supportedAttachmentAccept={SUPPORTED_ATTACHMENT_ACCEPT}
          urlContextEnabled={preferences.urlContext}
          webSearchEnabled={webSearchEnabled}
          voiceModeEnabled={voiceModeEnabled}
          isListening={isListening}
          isSpeaking={isSpeaking}
          inputNotice={inputNotice}
          textareaRef={textareaRef}
          fileInputRef={fileInputRef}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSend={sendMessage}
          onStop={stopResponse}
          onPickFiles={handleAttachmentFiles}
          onRemoveAttachment={removeAttachment}
          onToggleCodeExecution={() =>
            updatePreference("codeExecution", !preferences.codeExecution)
          }
          onToggleMapsGrounding={() =>
            updatePreference("mapsGrounding", !preferences.mapsGrounding)
          }
          onToggleUrlContext={() =>
            updatePreference("urlContext", !preferences.urlContext)
          }
          onToggleVoice={toggleVoiceInput}
          onToggleVoiceMode={toggleVoiceMode}
          onToggleWebSearch={() => setWebSearchEnabled((value) => !value)}
        />
      </div>

      <SettingsModal
        open={settingsOpen}
        selectedModel={selectedModel}
        webSearchEnabled={webSearchEnabled}
        voiceLanguage={voiceLanguage}
        preferences={preferences}
        threadsCount={threads.length}
        onClose={() => setSettingsOpen(false)}
        onSelectModel={setSelectedModel}
        onWebSearchChange={setWebSearchEnabled}
        onVoiceLanguageChange={setVoiceLanguage}
        onPreferenceChange={updatePreference}
        onExportConversations={exportConversations}
        onClearConversations={clearConversations}
        onResetPreferences={resetPreferences}
      />

      <AuthPromptModal
        feature={authPromptFeature}
        loginHref={CHEFU_LOGIN_HREF}
        onClose={() => setAuthPromptFeature("")}
      />
      {copyNotice && (
        <div className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-full border border-border bg-card/95 px-4 py-2 text-xs font-medium text-foreground shadow-2xl backdrop-blur">
          {copyNotice}
        </div>
      )}
    </div>
  );
}

function parseStoredPreferences(value: string | null): ChatPreferences {
  if (!value) return DEFAULT_CHAT_PREFERENCES;

  try {
    const parsed = JSON.parse(value) as Partial<ChatPreferences>;

    return {
      autoScroll:
        typeof parsed.autoScroll === "boolean"
          ? parsed.autoScroll
          : DEFAULT_CHAT_PREFERENCES.autoScroll,
      compactMessages:
        typeof parsed.compactMessages === "boolean"
          ? parsed.compactMessages
          : DEFAULT_CHAT_PREFERENCES.compactMessages,
      codeExecution:
        typeof parsed.codeExecution === "boolean"
          ? parsed.codeExecution
          : DEFAULT_CHAT_PREFERENCES.codeExecution,
      enterToSend:
        typeof parsed.enterToSend === "boolean"
          ? parsed.enterToSend
          : DEFAULT_CHAT_PREFERENCES.enterToSend,
      fileSearch:
        typeof parsed.fileSearch === "boolean"
          ? parsed.fileSearch
          : DEFAULT_CHAT_PREFERENCES.fileSearch,
      mapsGrounding:
        typeof parsed.mapsGrounding === "boolean"
          ? parsed.mapsGrounding
          : DEFAULT_CHAT_PREFERENCES.mapsGrounding,
      responseStyle: resolveResponseStyle(parsed.responseStyle),
      saveConversations:
        typeof parsed.saveConversations === "boolean"
          ? parsed.saveConversations
          : DEFAULT_CHAT_PREFERENCES.saveConversations,
      serviceTier: resolveServiceTier(parsed.serviceTier),
      showTimestamps:
        typeof parsed.showTimestamps === "boolean"
          ? parsed.showTimestamps
          : DEFAULT_CHAT_PREFERENCES.showTimestamps,
      urlContext:
        typeof parsed.urlContext === "boolean"
          ? parsed.urlContext
          : DEFAULT_CHAT_PREFERENCES.urlContext,
    };
  } catch {
    return DEFAULT_CHAT_PREFERENCES;
  }
}

function normalizeGeneratedImages(images: QuantumResponsePayload["images"]) {
  if (!Array.isArray(images)) return [];

  return images
    .filter((image) =>
      Boolean(image?.data && image.mimeType?.startsWith("image/")),
    )
    .map((image, index) => ({
      id: image.id || createId("generated-image"),
      mimeType: image.mimeType || "image/png",
      data: image.data || "",
      alt: image.alt || `Generated image ${index + 1}`,
    }));
}

function buildVisibleHistory(messages: Message[]) {
  return messages
    .slice(-12)
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        message.status !== "failed" &&
        message.status !== "thinking" &&
        message.status !== "streaming",
    )
    .map((message) => ({
      role: message.role,
      content: sanitizeHistoryContent(message.content),
    }))
    .filter((message) => message.content.trim().length > 0)
    .slice(-8);
}

function sanitizeHistoryContent(value: string) {
  return value
    .replace(/^```[\w-]*\n[\s\S]*?\n```\s*/g, "")
    .replace(/\n{2,}#{2,3}\s+Sources\s*\n[\s\S]+$/i, "")
    .trim();
}

function canUseSpeechSynthesis() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function toSpeechText(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, "I included a code block in the transcript.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>#-]/g, " ")
    .replace(/\bhttps?:\/\/\S+/gi, "")
    .replace(/\n{2,}Sources\s*[\s\S]+$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

function matchesConversationFilter(
  thread: ChatThread,
  searchQuery: string,
  filter: ConversationFilter,
) {
  const query = searchQuery.trim().toLowerCase();
  const searchableText = [
    thread.title,
    thread.preview,
    ...thread.messages.map((message) => message.content),
  ]
    .join(" ")
    .toLowerCase();

  if (query && !searchableText.includes(query)) return false;

  const now = Date.now();
  const ageMs = now - thread.timestamp.getTime();

  if (filter === "starred") return Boolean(thread.starred);
  if (filter === "hasImages") {
    return thread.messages.some(
      (message) => (message.generatedImages?.length || 0) > 0,
    );
  }
  if (filter === "usedWeb") {
    return thread.messages.some((message) =>
      message.metadata?.tools?.enabled?.some((tool) =>
        ["searchGrounding", "urlContext", "mapsGrounding", "fileSearch"].includes(
          tool,
        ),
      ),
    );
  }
  if (filter === "failed") {
    return thread.messages.some(
      (message) => message.status === "failed" || message.status === "stopped",
    );
  }
  if (filter === "today") return ageMs < 24 * 60 * 60 * 1000;
  if (filter === "week") return ageMs < 7 * 24 * 60 * 60 * 1000;

  return true;
}

function previousUserMessage(thread: ChatThread, messageId: string) {
  const messageIndex = thread.messages.findIndex(
    (message) => message.id === messageId,
  );
  if (messageIndex <= 0) return undefined;

  return [...thread.messages]
    .slice(0, messageIndex)
    .reverse()
    .find((message) => message.role === "user");
}

function applyStoredFeedback(threads: ChatThread[]) {
  const feedback = feedbackByMessageId();
  if (feedback.size === 0) return threads;

  return threads.map((thread) => ({
    ...thread,
    messages: thread.messages.map((message) => ({
      ...message,
      feedback: feedback.get(message.id) || message.feedback,
    })),
  }));
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

async function readQuantumEventStream(
  response: Response,
  {
    onActivity,
    onChunk,
  }: {
    onActivity: (activity: QuantumActivity) => void;
    onChunk: (text: string) => void;
  },
) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Quantum returned an unreadable response stream.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let streamedActivities: QuantumActivity[] = [];
  let streamedMessage = "";
  let finalPayload: QuantumResponsePayload | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() || "";

    events.forEach((event) => {
      const parsed = parseQuantumStreamEvent(event);
      if (!parsed) return;

      if (parsed.event === "chunk") {
        const text = typeof parsed.data.text === "string" ? parsed.data.text : "";
        if (!text) return;
        streamedMessage += text;
        onChunk(text);
        return;
      }

      if (parsed.event === "activity" && isQuantumActivity(parsed.data.activity)) {
        streamedActivities = mergeActivities(
          streamedActivities,
          parsed.data.activity,
        );
        onActivity(parsed.data.activity);
        return;
      }

      if (parsed.event === "done") {
        finalPayload = parsed.data as QuantumResponsePayload;
        return;
      }

      if (parsed.event === "error") {
        throw new Error(
          typeof parsed.data.error === "string"
            ? parsed.data.error
            : "Quantum could not generate a response.",
        );
      }
    });
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    const parsed = parseQuantumStreamEvent(buffer);
    if (parsed?.event === "done") {
      finalPayload = parsed.data as QuantumResponsePayload;
    }
  }

  return {
    ...finalPayload,
    metadata: {
      ...finalPayload?.metadata,
      activities:
        finalPayload?.metadata?.activities?.length
          ? finalPayload.metadata.activities
          : streamedActivities,
    },
    message: finalPayload?.message || streamedMessage,
  };
}

function parseQuantumStreamEvent(event: string) {
  const lines = event.split(/\r?\n/);
  const eventName =
    lines.find((line) => line.startsWith("event:"))?.slice(6).trim() ||
    "message";
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n")
    .trim();

  if (!data) return null;

  try {
    return {
      data: JSON.parse(data) as Record<string, unknown>,
      event: eventName,
    };
  } catch {
    return null;
  }
}

function isQuantumActivity(value: unknown): value is QuantumActivity {
  if (!value || typeof value !== "object") return false;

  const activity = value as Record<string, unknown>;
  return (
    (activity.type === "search" ||
      activity.type === "code" ||
      activity.type === "tool") &&
    typeof activity.title === "string"
  );
}

function mergeActivities(
  activities: QuantumActivity[],
  activity: QuantumActivity,
) {
  const key = activityKey(activity);
  if (activities.some((item) => activityKey(item) === key)) return activities;
  return [...activities, activity];
}

function activityKey(activity: QuantumActivity) {
  return [
    activity.type,
    activity.title,
    activity.detail || "",
    activity.code || "",
    activity.output || "",
  ].join(":");
}
