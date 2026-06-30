"use client";

import {
    Image as ImageIcon,
    PanelLeftClose,
    Plus,
    Search,
    Settings,
    Sparkles,
    X
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import type {
    AuthStatus,
    ChatThread,
    ConversationFilter,
    SessionUser,
} from "../_lib/types";
import { ConversationItem } from "./ConversationItem";
import { QuantumLogo } from "./QuantumLogo";

type ChatSidebarProps = {
    open: boolean;
    threads: ChatThread[];
    activeThreadId: string;
    authStatus: AuthStatus;
    conversationFilter: ConversationFilter;
    isMobile: boolean;
    searchQuery: string;
    sessionUser: SessionUser | null;
    onClose: () => void;
    onFilterChange: (filter: ConversationFilter) => void;
    onSearchChange: (query: string) => void;
    onNewConversation: () => void;
    onSelectThread: (threadId: string) => void;
    onToggleStar: (threadId: string) => void;
    onOpenSettings: () => void;
};

export function ChatSidebar({
    open,
    threads,
    activeThreadId,
    authStatus,
    conversationFilter,
    isMobile,
    searchQuery,
    sessionUser,
    onClose,
    onFilterChange,
    onSearchChange,
    onNewConversation,
    onSelectThread,
    onToggleStar,
    onOpenSettings,
}: ChatSidebarProps) {
    const starredThreads = threads.filter((thread) => thread.starred);
    const recentThreads = threads.filter((thread) => !thread.starred);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        type="button"
                        aria-label="Close sidebar"
                        className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.aside
                        initial={{ x: -360, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -360, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 32 }}
                        className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(88vw,360px)] shrink-0 flex-col bg-sidebar shadow-2xl shadow-black/40 md:relative md:z-10 md:h-full md:w-[320px] md:border-r md:border-sidebar-border md:shadow-none lg:w-90"
                    >
                        <div className="flex h-18 shrink-0 items-center gap-3 px-5">
                            <QuantumLogo className="size-7" />
                            <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
                                Quantum
                            </span>
                            <button
                                type="button"
                                onClick={onClose}
                                className="ml-auto flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                aria-label="Close sidebar"
                            >
                                {isMobile ? <X size={18} /> : <PanelLeftClose size={18} />}
                            </button>
                        </div>

                        <div className="grid gap-1 px-3 pb-4">
                            <button
                                onClick={() => {
                                    onNewConversation();
                                    if (isMobile) onClose();
                                }}
                                className="flex h-10 w-full items-center gap-3 rounded-full bg-background/45 px-4 text-sm font-semibold text-sidebar-foreground transition hover:bg-sidebar-accent"
                            >
                                <Plus size={20} strokeWidth={2.2} />
                                New chat
                            </button>

                            <label className="flex h-10 items-center gap-3 rounded-full px-4 text-sm text-sidebar-foreground transition focus-within:bg-sidebar-accent hover:bg-sidebar-accent">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search chats"
                                    value={searchQuery}
                                    onChange={(event) => onSearchChange(event.target.value)}
                                    className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-sidebar-foreground"
                                />
                            </label>

                            <SidebarAction
                                active={conversationFilter === "hasImages"}
                                icon={<ImageIcon size={18} />}
                                label="Images"
                                badge="New"
                                onClick={() => onFilterChange("hasImages")}
                            />

                        </div>

                        <div className="scrollbar-hide flex-1 overflow-y-auto px-4 pb-4">
                            {starredThreads.length > 0 && (
                                <ThreadSection
                                    activeThreadId={activeThreadId}
                                    isMobile={isMobile}
                                    label="Starred"
                                    threads={starredThreads}
                                    onClose={onClose}
                                    onSelectThread={onSelectThread}
                                    onToggleStar={onToggleStar}
                                />
                            )}

                            <ThreadSection
                                activeThreadId={activeThreadId}
                                authStatus={authStatus}
                                emptyLabel={
                                    authStatus === "checking"
                                        ? "Checking saved conversations..."
                                        : authStatus === "guest"
                                            ? "Temporary chats appear here while this page is open."
                                            : "Your chats will appear here."
                                }
                                isMobile={isMobile}
                                label="Recents"
                                threads={recentThreads}
                                onClose={onClose}
                                onSelectThread={onSelectThread}
                                onToggleStar={onToggleStar}
                            />
                        </div>

                        <div className="flex shrink-0 items-center gap-3 px-4 py-5">

                            <button
                                type="button"
                                onClick={() => {
                                    onOpenSettings();
                                    if (isMobile) onClose();
                                }}
                                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                title="Settings"
                            >
                                <Settings size={18} />
                            </button>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

function SidebarAction({
    active,
    badge,
    icon,
    label,
    onClick,
}: {
    active: boolean;
    badge?: string;
    icon: ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex h-10 w-full items-center gap-3 rounded-full px-4 text-sm font-medium transition ${active
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
        >
            {icon}
            <span>{label}</span>
            {badge && (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-sidebar-foreground">
                    {badge}
                </span>
            )}
        </button>
    );
}

function ThreadSection({
    activeThreadId,
    emptyLabel,
    isMobile,
    label,
    threads,
    onClose,
    onSelectThread,
    onToggleStar,
}: {
    activeThreadId: string;
    authStatus?: AuthStatus;
    emptyLabel?: string;
    isMobile: boolean;
    label: string;
    threads: ChatThread[];
    onClose: () => void;
    onSelectThread: (threadId: string) => void;
    onToggleStar: (threadId: string) => void;
}) {
    return (
        <section className="mb-5">
            <div className="mb-2 flex items-center gap-2 px-1">
                <Sparkles size={12} className="text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
            </div>
            {threads.length > 0 ? (
                <div className="grid gap-1">
                    {threads.map((thread) => (
                        <ConversationItem
                            key={thread.id}
                            active={activeThreadId === thread.id}
                            conv={thread}
                            onClick={() => {
                                onSelectThread(thread.id);
                                if (isMobile) onClose();
                            }}
                            onToggleStar={() => onToggleStar(thread.id)}
                        />
                    ))}
                </div>
            ) : (
                <p className="px-1 py-2 text-sm leading-5 text-muted-foreground/75">
                    {emptyLabel}
                </p>
            )}
        </section>
    );
}

function displayName(user: SessionUser | null, authStatus: AuthStatus) {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    if (authStatus === "checking") return "Loading account";
    return "Guest session";
}

function userInitial(user: SessionUser | null) {
    return (user?.displayName || user?.email || "Q").charAt(0).toUpperCase();
}
