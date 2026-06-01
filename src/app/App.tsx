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
import { fileToAttachment, getSpeechRecognition } from "./_lib/input";
import type {
  AuthStatus,
  ChatPreferences,
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
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [activeConv, setActiveConv] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
  const [preferences, setPreferences] = useState<ChatPreferences>(
    DEFAULT_CHAT_PREFERENCES,
  );
  const [isListening, setIsListening] = useState(false);
  const [inputNotice, setInputNotice] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
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
    if (
      !hasHydrated ||
      authStatus !== "authenticated" ||
      !preferences.saveConversations
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveSavedConversations(threads).catch(error => {
        console.error("Failed to save Quantum conversations:", error);
      });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [authStatus, hasHydrated, preferences.saveConversations, threads]);

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
      "quantum-chat-preferences",
      JSON.stringify(preferences),
    );
  }, [preferences]);

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

  async function requestQuantumResponse({
    attachments: activeAttachments,
    messageText,
    threadId,
    visibleMessages,
  }: {
    attachments: ImageAttachment[];
    messageText: string;
    threadId: string;
    visibleMessages: Message[];
  }) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
        history: visibleMessages.slice(-8).map((message) => ({
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
      images?: Array<{
        id?: string;
        mimeType?: string;
        data?: string;
        alt?: string;
      }>;
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
      generatedImages: Array.isArray(data.images)
        ? data.images
            .filter((image) =>
              Boolean(image.data && image.mimeType?.startsWith("image/")),
            )
            .map((image, index) => ({
              id: image.id || createId("generated-image"),
              mimeType: image.mimeType || "image/png",
              data: image.data || "",
              alt: image.alt || `Generated image ${index + 1}`,
            }))
        : [],
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

    if (!activeConv) setActiveConv(threadId);
    setThreads((currentThreads) => {
      const existingThread = currentThreads.find((thread) => thread.id === threadId);
      const nextThreads = existingThread
        ? currentThreads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: [...thread.messages, userMsg],
                  preview: previewText(summaryContent),
                  timestamp: now,
                }
              : thread,
          )
        : [
            {
              id: threadId,
              messages: [userMsg],
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

    try {
      await requestQuantumResponse({
        attachments: activeAttachments,
        messageText: text,
        threadId,
        visibleMessages: messages,
      });
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

    setThreads((current) =>
      current.map((thread) =>
        thread.id === activeThread.id
          ? {
              ...thread,
              messages: nextMessages,
              preview: previewText(userMessage.content || "Image attachment"),
              timestamp: new Date(),
            }
          : thread,
      ),
    );
    setIsTyping(true);

    try {
      await requestQuantumResponse({
        attachments: userMessage.attachments || [],
        messageText: userMessage.content,
        threadId: activeThread.id,
        visibleMessages: nextMessages.slice(0, -1),
      });
    } catch (error) {
      const fallbackMsg: Message = {
        id: createId("message"),
        role: "assistant",
        content:
          error instanceof Error
            ? `I could not regenerate that response: ${error.message}`
            : "I could not regenerate that response. Please try again.",
        timestamp: new Date(),
      };

      setThreads((current) =>
        current.map((thread) =>
          thread.id === activeThread.id
            ? { ...thread, messages: [...nextMessages, fallbackMsg] }
            : thread,
        ),
      );
    } finally {
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
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()),
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
        searchQuery={searchQuery}
        isMobile={isMobileLayout}
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
          onToggleLike={toggleMessageLike}
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
          isListening={isListening}
          inputNotice={inputNotice}
          textareaRef={textareaRef}
          fileInputRef={fileInputRef}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSend={sendMessage}
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
