"use client";

import { CheFuUserDropdown } from "@chefu/ui";
import {
  ChevronDown,
  Download,
  Edit3,
  LogIn,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Sparkles,
  Star,
  Settings,
  Trash2,
  UserRound,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type FormEvent, type ReactNode, useState } from "react";
import {
  CHEFU_ACCOUNT_MANAGE_HREF,
  CHEFU_LOGIN_HREF,
  MODELS,
  apiUrl,
  buildChefuLogoutHref,
  type QuantumModel,
} from "../_lib/constants";
import { sessionHeaders } from "../_lib/conversations";
import type { AuthStatus, ChatThread, SessionUser } from "../_lib/types";
import { QuantumLogo } from "./QuantumLogo";

type TopBarProps = {
  activeThread?: ChatThread;
  conversationCount: number;
  sidebarOpen: boolean;
  selectedModel: QuantumModel;
  authStatus: AuthStatus;
  sessionUser: SessionUser | null;
  onClearConversations: () => void;
  onDeleteThread: (threadId: string) => void;
  onExportConversations: () => void;
  onNewConversation: () => void;
  onOpenSettings: () => void;
  onRenameThread: (threadId: string, title: string) => void;
  onToggleThreadStar: (threadId: string) => void;
  onToggleSidebar: () => void;
  onSelectModel: (model: QuantumModel) => void;
};

export function TopBar({
  activeThread,
  conversationCount,
  sidebarOpen,
  selectedModel,
  authStatus,
  sessionUser,
  onClearConversations,
  onDeleteThread,
  onExportConversations,
  onNewConversation,
  onOpenSettings,
  onRenameThread,
  onToggleThreadStar,
  onToggleSidebar,
  onSelectModel,
}: TopBarProps) {
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [conversationMenuOpen, setConversationMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await fetch(apiUrl("/auth/session"), {
        method: "DELETE",
        credentials: "include",
        headers: sessionHeaders(),
      });
    } catch {
      // The central logout page gets a second chance to clear the shared session.
    } finally {
      const returnTo =
        typeof window === "undefined"
          ? undefined
          : `${window.location.origin}/`;

      window.location.assign(buildChefuLogoutHref(returnTo));
    }
  }

  function openConversationMenu() {
    setConversationMenuOpen((value) => !value);
    setModelMenuOpen(false);
    setIsRenaming(false);
  }

  function beginRename() {
    if (!activeThread) return;
    setRenameDraft(activeThread.title);
    setIsRenaming(true);
  }

  function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = renameDraft.trim();

    if (!activeThread || !nextTitle) return;

    onRenameThread(activeThread.id, nextTitle);
    setConversationMenuOpen(false);
    setIsRenaming(false);
  }

  function deleteActiveConversation() {
    if (!activeThread) return;

    const confirmed = window.confirm(
      `Delete "${activeThread.title}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    onDeleteThread(activeThread.id);
    setConversationMenuOpen(false);
    setIsRenaming(false);
  }

  return (
    <>
      <header className="relative z-50 flex min-w-0 items-center gap-1.5 border-b border-border bg-background/80 px-2 py-2.5 backdrop-blur-sm sm:gap-3 sm:px-4 sm:py-3">
        <button
          onClick={onToggleSidebar}
          className="shrink-0 rounded-lg p-2 text-muted-foreground transition-all duration-150 hover:bg-muted/60 hover:text-foreground"
          aria-label={sidebarOpen ? "Hide sidebar" : "Open sidebar"}
        >
          <Menu size={16} />
        </button>

        {!sidebarOpen && (
          <div className="flex min-w-0 items-center gap-2">
            <QuantumLogo />
            <span className="hidden text-sm font-semibold text-foreground min-[420px]:inline">
              Quantum
            </span>
          </div>
        )}

        <div className="relative ml-auto min-w-0">
          <button
            onClick={() => {
              setModelMenuOpen((value) => !value);
              setConversationMenuOpen(false);
            }}
            className="flex max-w-[42vw] items-center gap-1.5 rounded-xl border border-border py-1.5 pl-2.5 pr-2 text-xs font-medium text-foreground/80 transition-all duration-150 hover:border-primary/40 hover:bg-muted/30 hover:text-foreground sm:max-w-none sm:gap-2 sm:pl-3 sm:pr-2.5"
            title={selectedModel.description}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: selectedModel.color }} />
            <span className="truncate">{selectedModel.name}</span>
            <span className="hidden rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:inline" style={{ background: `${selectedModel.color}22`, color: selectedModel.color }}>
              {selectedModel.badge}
            </span>
            <ChevronDown size={12} className="text-muted-foreground" />
          </button>

          <AnimatePresence>
            {modelMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-1rem)] max-w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}
              >
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Select model</p>
                </div>
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model);
                      setModelMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 text-left ${selectedModel.id === model.id
                        ? "bg-primary/10"
                        : "hover:bg-muted/50"
                      }`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${model.color}22` }}>
                      <Sparkles size={14} style={{ color: model.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.description}</p>
                    </div>
                    {selectedModel.id === model.id && (
                      <span
                        className="rounded-full px-2 py-1 text-[10px] font-semibold"
                        style={{ background: `${model.color}22`, color: model.color }}
                      >
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {authStatus === "authenticated" && sessionUser ? (
          <CheFuUserDropdown
            accountHref={CHEFU_ACCOUNT_MANAGE_HREF}
            onSignOut={handleSignOut}
            pendingSignOut={isSigningOut}
            triggerClassName="hidden sm:flex"
            user={{
              displayName: sessionUser.displayName,
              email: sessionUser.email,
            }}
            variant="neutral"
          />
        ) : (
          <a
            href={CHEFU_LOGIN_HREF}
            className="hidden items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all duration-150 hover:border-primary/40 hover:bg-muted/30 hover:text-foreground sm:flex"
          >
            <LogIn size={13} />
            {authStatus === "checking" ? "Loading" : "Sign in"}
          </a>
        )}

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={openConversationMenu}
            className="rounded-lg p-2 text-muted-foreground transition-all duration-150 hover:bg-muted/60 hover:text-foreground"
            title="Conversation actions"
          >
            <MoreHorizontal size={16} />
          </button>

          <AnimatePresence>
            {conversationMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-1rem)] max-w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}
              >
                <div className="border-b border-border p-3 sm:hidden">
                  {authStatus === "authenticated" && sessionUser ? (
                    <>
                      <div className="mb-2 flex items-center gap-3 rounded-2xl bg-muted/35 px-3 py-2.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-300 text-xs font-bold text-slate-950">
                          {(sessionUser.displayName || sessionUser.email || "Q")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {sessionUser.displayName || "CheFu user"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {sessionUser.email}
                          </p>
                        </div>
                      </div>
                      <a
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                        href={CHEFU_ACCOUNT_MANAGE_HREF}
                        onClick={() => setConversationMenuOpen(false)}
                      >
                        <UserRound size={13} />
                        Manage account
                      </a>
                      <button
                        type="button"
                        disabled={isSigningOut}
                        onClick={() => void handleSignOut()}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-200 transition-colors hover:bg-red-500/10 disabled:cursor-wait disabled:opacity-60"
                      >
                        <LogOut size={13} />
                        {isSigningOut ? "Signing out..." : "Sign out"}
                      </button>
                    </>
                  ) : (
                    <a
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50"
                      href={CHEFU_LOGIN_HREF}
                      onClick={() => setConversationMenuOpen(false)}
                    >
                      <LogIn size={13} />
                      {authStatus === "checking" ? "Loading account" : "Sign in"}
                    </a>
                  )}
                </div>

                <div className="border-b border-border px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Conversation
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">
                    {activeThread?.title || "No conversation selected"}
                  </p>
                  {activeThread?.preview && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {activeThread.preview}
                    </p>
                  )}
                </div>

                {isRenaming && activeThread ? (
                  <form onSubmit={submitRename} className="border-b border-border p-3">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Rename
                    </label>
                    <input
                      autoFocus
                      value={renameDraft}
                      onChange={(event) => setRenameDraft(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
                    />
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsRenaming(false)}
                        className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!renameDraft.trim()}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="border-b border-border p-2">
                    <MenuItem
                      disabled={!activeThread}
                      icon={<Edit3 size={13} />}
                      label="Rename"
                      onClick={beginRename}
                    />
                    <MenuItem
                      disabled={!activeThread}
                      icon={<Star size={13} fill={activeThread?.starred ? "currentColor" : "none"} />}
                      label={activeThread?.starred ? "Remove star" : "Star conversation"}
                      onClick={() => {
                        if (!activeThread) return;
                        onToggleThreadStar(activeThread.id);
                        setConversationMenuOpen(false);
                      }}
                    />
                    <MenuItem
                      danger
                      disabled={!activeThread}
                      icon={<Trash2 size={13} />}
                      label="Delete conversation"
                      onClick={deleteActiveConversation}
                    />
                  </div>
                )}

                <div className="p-2">
                  <MenuItem
                    icon={<Plus size={13} />}
                    label="New conversation"
                    onClick={() => {
                      onNewConversation();
                      setConversationMenuOpen(false);
                    }}
                  />
                  <MenuItem
                    disabled={conversationCount === 0}
                    icon={<Download size={13} />}
                    label="Export conversations"
                    onClick={() => {
                      onExportConversations();
                      setConversationMenuOpen(false);
                    }}
                  />
                  <MenuItem
                    icon={<Settings size={13} />}
                    label="Settings & preferences"
                    onClick={() => {
                      onOpenSettings();
                      setConversationMenuOpen(false);
                    }}
                  />
                  <MenuItem
                    danger
                    disabled={conversationCount === 0}
                    icon={<Trash2 size={13} />}
                    label="Clear all conversations"
                    onClick={() => {
                      const confirmed = window.confirm(
                        "Clear all conversations? This cannot be undone.",
                      );
                      if (!confirmed) return;
                      onClearConversations();
                      setConversationMenuOpen(false);
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {modelMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setModelMenuOpen(false)} />
      )}
      {conversationMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setConversationMenuOpen(false)} />
      )}
    </>
  );
}

function MenuItem({
  danger,
  disabled,
  icon,
  label,
  onClick,
}: {
  danger?: boolean;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "text-red-200 hover:bg-red-500/10"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
