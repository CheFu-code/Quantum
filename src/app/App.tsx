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
  MAX_IMAGE_ATTACHMENTS,
  MAX_IMAGE_SIZE,
  MODELS,
  VOICE_LANGUAGES,
  apiUrl,
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
import { fileToAttachment, getSpeechRecognition } from "./_lib/input";
import type {
  AuthStatus,
  ChatThread,
  ImageAttachment,
  Message,
  SessionUser,
  SpeechRecognitionLike,
} from "./_lib/types";

export default function App() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<QuantumModel>(MODELS[1]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeConv, setActiveConv] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authPromptFeature, setAuthPromptFeature] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [hasHydrated, setHasHydrated] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState("auto");
  const [isListening, setIsListening] = useState(false);
  const [inputNotice, setInputNotice] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const activeThread = threads.find((thread) => thread.id === activeConv);
  const messages = activeThread?.messages || [];

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
        setThreads(savedThreads);
        setActiveConv(savedThreads[0]?.id || "");
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
    if (!hasHydrated || authStatus !== "authenticated") return;
    const timeout = window.setTimeout(() => {
      void saveSavedConversations(threads).catch(error => {
        console.error("Failed to save Quantum conversations:", error);
      });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [authStatus, hasHydrated, threads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      speechRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const storedModel = window.localStorage.getItem("quantum-selected-model");
    const storedWebSearch =
      window.localStorage.getItem("quantum-web-search-enabled") === "true";
    const storedVoiceLanguage =
      window.localStorage.getItem("quantum-voice-language") || "auto";

    setSelectedModel(resolveStoredModel(storedModel));
    setWebSearchEnabled(storedWebSearch);
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
    if (authStatus === "authenticated") return;
    setAttachments([]);
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

  async function handleImageFiles(files: FileList | null) {
    if (authStatus !== "authenticated") {
      setAuthPromptFeature("image upload");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;

    const availableSlots = MAX_IMAGE_ATTACHMENTS - attachments.length;
    if (availableSlots <= 0) {
      setInputNotice(`You can attach up to ${MAX_IMAGE_ATTACHMENTS} images.`);
      return;
    }

    const imageFiles = selectedFiles
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, availableSlots);
    const oversized = imageFiles.find((file) => file.size > MAX_IMAGE_SIZE);

    if (oversized) {
      setInputNotice("Images must be 5 MB or smaller.");
      return;
    }

    try {
      const nextAttachments = await Promise.all(imageFiles.map(fileToAttachment));
      setAttachments((current) => [...current, ...nextAttachments]);
      setInputNotice("");
    } catch (error) {
      setInputNotice(
        error instanceof Error ? error.message : "Could not attach image.",
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function toggleVoiceInput() {
    if (authStatus !== "authenticated") {
      setAuthPromptFeature("voice input");
      return;
    }

    if (isListening) {
      speechRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = getSpeechRecognition();
    if (!recognition) {
      setInputNotice("Voice input is not supported in this browser.");
      return;
    }

    recognition.continuous = false;
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

      setInput((current) => {
        const separator = current.trim() ? " " : "";
        return `${current}${separator}${transcript.trim()}`;
      });
      window.setTimeout(autoResize, 0);
    };
    recognition.onerror = () => {
      setInputNotice("Voice input stopped. Please try again.");
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    speechRef.current = recognition;
    setInputNotice("");
    setIsListening(true);
    recognition.start();
  }

  async function sendMessage() {
    const text = input.trim();
    if ((!text && attachments.length === 0) || isTyping) return;
    setInput("");
    const activeAttachments = attachments;
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const threadId = activeConv || createId("thread");
    const now = new Date();
    const displayContent =
      text ||
      `Attached ${activeAttachments.length} image${activeAttachments.length === 1 ? "" : "s"}`;
    const userMsg: Message = {
      id: createId("message"),
      role: "user",
      content: displayContent,
      timestamp: now,
      attachments: activeAttachments,
    };

    if (!activeConv) setActiveConv(threadId);
    setThreads((currentThreads) => {
      const existingThread = currentThreads.find((thread) => thread.id === threadId);
      const nextThreads = existingThread
        ? currentThreads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: [...thread.messages, userMsg],
                  preview: previewText(displayContent),
                  timestamp: now,
                }
              : thread,
          )
        : [
            {
              id: threadId,
              messages: [userMsg],
              preview: previewText(displayContent),
              starred: false,
              timestamp: now,
              title: threadTitle(displayContent),
            },
            ...currentThreads,
          ];

      return sortThreads(nextThreads);
    });
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text || "Describe the attached image.",
          model: selectedModel.id,
          attachments: activeAttachments.map(({ name, mimeType, data, size }) => ({
            name,
            mimeType,
            data,
            size,
          })),
          webSearch: webSearchEnabled,
          history: messages.slice(-8).map((message) => ({
            role: message.role,
            content: message.content,
          })),
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

      const data = (await response.json()) as {
        message?: string;
        createdAt?: string;
      };
      const reply = data.message?.trim();

      if (!reply) {
        throw new Error("Quantum returned an empty response.");
      }

      const assistantMsg: Message = {
        id: createId("message"),
        role: "assistant",
        content: reply,
        timestamp: data.createdAt ? new Date(data.createdAt) : new Date(),
      };

      setThreads((currentThreads) =>
        sortThreads(
          currentThreads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: [...thread.messages, assistantMsg],
                  preview: previewText(reply),
                  timestamp: assistantMsg.timestamp,
                }
              : thread,
          ),
        ),
      );
    } catch (error) {
      const fallbackMsg: Message = {
        id: createId("message"),
        role: "assistant",
        content:
          error instanceof Error
            ? `I could not complete that request: ${error.message}`
            : "I could not complete that request. Please try again.",
        timestamp: new Date(),
      };

      setThreads((currentThreads) =>
        currentThreads.map((thread) =>
          thread.id === threadId
            ? { ...thread, messages: [...thread.messages, fallbackMsg] }
            : thread,
        ),
      );
    } finally {
      setIsTyping(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function copyMessage(id: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
    setInputNotice("Preferences reset.");
  }

  function startNewConversation() {
    setActiveConv("");
    setInput("");
    setAttachments([]);
    setLikedIds(new Set());
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

  function toggleMessageLike(messageId: string) {
    setLikedIds((current) => {
      const next = new Set(current);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }

  const filteredConvs = threads.filter((thread) =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden">
      <ChatSidebar
        open={sidebarOpen}
        threads={filteredConvs}
        activeThreadId={activeConv}
        authStatus={authStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewConversation={startNewConversation}
        onSelectThread={setActiveConv}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <TopBar
          sidebarOpen={sidebarOpen}
          selectedModel={selectedModel}
          authStatus={authStatus}
          sessionUser={sessionUser}
          onToggleSidebar={() => setSidebarOpen((value) => !value)}
          onSelectModel={setSelectedModel}
        />

        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          copiedId={copiedId}
          likedIds={likedIds}
          messagesEndRef={messagesEndRef}
          onCopy={copyMessage}
          onToggleLike={toggleMessageLike}
          onSuggestion={setInput}
        />

        <ChatComposer
          input={input}
          attachments={attachments}
          isTyping={isTyping}
          authStatus={authStatus}
          webSearchEnabled={webSearchEnabled}
          isListening={isListening}
          inputNotice={inputNotice}
          textareaRef={textareaRef}
          fileInputRef={fileInputRef}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSend={sendMessage}
          onPickImages={handleImageFiles}
          onRemoveAttachment={removeAttachment}
          onToggleVoice={toggleVoiceInput}
          onToggleWebSearch={() => setWebSearchEnabled((value) => !value)}
        />
      </div>

      <SettingsModal
        open={settingsOpen}
        selectedModel={selectedModel}
        webSearchEnabled={webSearchEnabled}
        voiceLanguage={voiceLanguage}
        threadsCount={threads.length}
        onClose={() => setSettingsOpen(false)}
        onSelectModel={setSelectedModel}
        onWebSearchChange={setWebSearchEnabled}
        onVoiceLanguageChange={setVoiceLanguage}
        onExportConversations={exportConversations}
        onClearConversations={clearConversations}
        onResetPreferences={resetPreferences}
      />

      <AuthPromptModal
        feature={authPromptFeature}
        loginHref={CHEFU_LOGIN_HREF}
        onClose={() => setAuthPromptFeature("")}
      />
    </div>
  );
}