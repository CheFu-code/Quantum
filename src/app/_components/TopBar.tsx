"use client";

import { CheFuUserDropdown } from "chefu-ui";
import {
    Download,
    Edit3,
    LogIn,
    LogOut,
    Menu,
    MoreHorizontal,
    Plus,
    Settings,
    Star,
    Trash2,
    UserRound,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type FormEvent, type ReactNode, useState } from "react";
import {
    CHEFU_ACCOUNT_MANAGE_HREF,
    CHEFU_LOGIN_HREF,
    apiUrl,
    buildChefuLogoutHref,
} from "../_lib/constants";
import { sessionHeaders } from "../_lib/conversations";
import type { AuthStatus, ChatThread, SessionUser } from "../_lib/types";
import { QuantumLogo } from "./QuantumLogo";

type TopBarProps = {
    activeThread?: ChatThread;
    authStatus: AuthStatus;
    conversationCount: number;
    sessionUser: SessionUser | null;
    sidebarOpen: boolean;
    onClearConversations: () => void;
    onDeleteThread: (threadId: string) => void;
    onExportConversations: () => void;
    onNewConversation: () => void;
    onOpenSettings: () => void;
    onRenameThread: (threadId: string, title: string) => void;
    onToggleSidebar: () => void;
    onToggleThreadStar: (threadId: string) => void;
};

export function TopBar({
    activeThread,
    authStatus,
    conversationCount,
    sessionUser,
    sidebarOpen,
    onClearConversations,
    onDeleteThread,
    onExportConversations,
    onNewConversation,
    onOpenSettings,
    onRenameThread,
    onToggleSidebar,
    onToggleThreadStar,
}: TopBarProps) {
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
                typeof window === "undefined" ? undefined : `${window.location.origin}/`;

            window.location.assign(buildChefuLogoutHref(returnTo));
        }
    }

    function closeMenu() {
        setConversationMenuOpen(false);
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
        closeMenu();
    }

    function deleteActiveConversation() {
        if (!activeThread) return;

        const confirmed = window.confirm(
            `Delete "${activeThread.title}"? This cannot be undone.`,
        );

        if (!confirmed) return;

        onDeleteThread(activeThread.id);
        closeMenu();
    }

    return (
        <>
            <header className="relative z-30 flex h-[68px] shrink-0 items-center gap-3 px-3 sm:h-20 sm:px-6">
                <button
                    onClick={onToggleSidebar}
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/55 hover:text-foreground ${sidebarOpen ? "md:pointer-events-none md:opacity-0" : ""
                        }`}
                    aria-label={sidebarOpen ? "Hide sidebar" : "Open sidebar"}
                >
                    <Menu size={19} />
                </button>

                {!sidebarOpen && (
                    <div className="flex min-w-0 items-center gap-2">
                        <QuantumLogo className="size-6" />
                        <span className="hidden truncate text-base font-semibold text-foreground min-[420px]:inline">
                            Quantum
                        </span>
                    </div>
                )}

                <div className="ml-auto flex items-center gap-2">
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
                            className="hidden items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-medium text-foreground/85 shadow-lg shadow-black/10 transition hover:border-primary/45 hover:bg-muted/70 hover:text-foreground sm:flex"
                        >
                            <LogIn size={15} />
                            {authStatus === "checking" ? "Loading" : "Sign in"}
                        </a>
                    )}



                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setConversationMenuOpen((value) => !value);
                                setIsRenaming(false);
                            }}
                            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/55 hover:text-foreground"
                            title="Conversation actions"
                        >
                            <MoreHorizontal size={20} />
                        </button>

                        <AnimatePresence>
                            {conversationMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-1rem)] max-w-80 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/40"
                                >
                                    <MobileAccountBlock
                                        authStatus={authStatus}
                                        isSigningOut={isSigningOut}
                                        sessionUser={sessionUser}
                                        onClose={closeMenu}
                                        onSignOut={() => void handleSignOut()}
                                    />

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
                                                className="mt-2 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/55"
                                            />
                                            <div className="mt-3 flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsRenaming(false)}
                                                    className="rounded-full px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={!renameDraft.trim()}
                                                    className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition disabled:opacity-40"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="border-b border-border p-2">
                                            <MenuItem
                                                disabled={!activeThread}
                                                icon={<Edit3 size={14} />}
                                                label="Rename"
                                                onClick={beginRename}
                                            />
                                            <MenuItem
                                                disabled={!activeThread}
                                                icon={
                                                    <Star
                                                        size={14}
                                                        fill={activeThread?.starred ? "currentColor" : "none"}
                                                    />
                                                }
                                                label={
                                                    activeThread?.starred
                                                        ? "Remove star"
                                                        : "Star conversation"
                                                }
                                                onClick={() => {
                                                    if (!activeThread) return;
                                                    onToggleThreadStar(activeThread.id);
                                                    closeMenu();
                                                }}
                                            />
                                            <MenuItem
                                                danger
                                                disabled={!activeThread}
                                                icon={<Trash2 size={14} />}
                                                label="Delete conversation"
                                                onClick={deleteActiveConversation}
                                            />
                                        </div>
                                    )}

                                    <div className="p-2">
                                        <MenuItem
                                            icon={<Plus size={14} />}
                                            label="New chat"
                                            onClick={() => {
                                                onNewConversation();
                                                closeMenu();
                                            }}
                                        />
                                        <MenuItem
                                            disabled={conversationCount === 0}
                                            icon={<Download size={14} />}
                                            label="Export conversations"
                                            onClick={() => {
                                                onExportConversations();
                                                closeMenu();
                                            }}
                                        />
                                        <MenuItem
                                            icon={<Settings size={14} />}
                                            label="Settings"
                                            onClick={() => {
                                                onOpenSettings();
                                                closeMenu();
                                            }}
                                        />
                                        <MenuItem
                                            danger
                                            disabled={conversationCount === 0}
                                            icon={<Trash2 size={14} />}
                                            label="Clear all conversations"
                                            onClick={() => {
                                                const confirmed = window.confirm(
                                                    "Clear all conversations? This cannot be undone.",
                                                );
                                                if (!confirmed) return;
                                                onClearConversations();
                                                closeMenu();
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {conversationMenuOpen && (
                <div className="fixed inset-0 z-20" onClick={closeMenu} />
            )}
        </>
    );
}

function MobileAccountBlock({
    authStatus,
    isSigningOut,
    sessionUser,
    onClose,
    onSignOut,
}: {
    authStatus: AuthStatus;
    isSigningOut: boolean;
    sessionUser: SessionUser | null;
    onClose: () => void;
    onSignOut: () => void;
}) {
    return (
        <div className="border-b border-border p-3 sm:hidden">
            {authStatus === "authenticated" && sessionUser ? (
                <>
                    <div className="mb-2 flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-2.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
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
                        className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                        href={CHEFU_ACCOUNT_MANAGE_HREF}
                        onClick={onClose}
                    >
                        <UserRound size={14} />
                        Manage account
                    </a>
                    <button
                        type="button"
                        disabled={isSigningOut}
                        onClick={onSignOut}
                        className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-wait disabled:opacity-60"
                    >
                        <LogOut size={14} />
                        {isSigningOut ? "Signing out..." : "Sign out"}
                    </button>
                </>
            ) : (
                <a
                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/50"
                    href={CHEFU_LOGIN_HREF}
                    onClick={onClose}
                >
                    <LogIn size={14} />
                    {authStatus === "checking" ? "Loading account" : "Sign in"}
                </a>
            )}
        </div>
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
            className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${danger
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-muted-foreground hover:bg-muted/55 hover:text-foreground"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}
