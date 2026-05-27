"use client";

import { useState } from "react";
import {
  ChevronDown,
  LogIn,
  LogOut,
  Menu,
  MoreHorizontal,
  Sparkles,
  UserRound,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  CHEFU_ACCOUNT_BASE,
  CHEFU_LOGIN_HREF,
  CHEFU_LOGOUT_HREF,
  MODELS,
  type QuantumModel,
} from "../_lib/constants";
import type { AuthStatus, SessionUser } from "../_lib/types";
import { QuantumLogo } from "./QuantumLogo";

type TopBarProps = {
  sidebarOpen: boolean;
  selectedModel: QuantumModel;
  authStatus: AuthStatus;
  sessionUser: SessionUser | null;
  onToggleSidebar: () => void;
  onSelectModel: (model: QuantumModel) => void;
};

export function TopBar({
  sidebarOpen,
  selectedModel,
  authStatus,
  sessionUser,
  onToggleSidebar,
  onSelectModel,
}: TopBarProps) {
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm z-10">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all duration-150"
        >
          <Menu size={16} />
        </button>

        {!sidebarOpen && (
          <div className="flex items-center gap-2">
            <QuantumLogo />
            <span className="text-sm font-semibold text-foreground">Quantum</span>
          </div>
        )}

        <div className="relative ml-auto">
          <button
            onClick={() => setModelMenuOpen((value) => !value)}
            className="flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/30 transition-all duration-150 text-xs font-medium text-foreground/80 hover:text-foreground"
            title={selectedModel.description}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: selectedModel.color }} />
            {selectedModel.name}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${selectedModel.color}22`, color: selectedModel.color }}>
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
                className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-50"
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
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 text-left ${
                      selectedModel.id === model.id
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
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setUserMenuOpen((value) => !value)}
              className="flex items-center gap-2 rounded-xl border border-border px-2 py-1.5 text-xs font-medium text-foreground/80 transition-all duration-150 hover:border-primary/40 hover:bg-muted/30 hover:text-foreground"
            >
              <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserRound size={13} />
              </span>
              <span className="max-w-[140px] truncate">
                {sessionUser.displayName || sessionUser.email}
              </span>
              <ChevronDown size={12} className="text-muted-foreground" />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                  style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {sessionUser.displayName || "CheFu Account"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {sessionUser.email}
                    </p>
                  </div>

                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-[#81c995]" />
                      Conversations are saved to your account
                    </div>
                  </div>

                  <div className="border-t border-border p-2">
                    <a
                      href={CHEFU_ACCOUNT_BASE}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    >
                      <UserRound size={13} />
                      Manage account
                    </a>
                    <a
                      href={CHEFU_LOGOUT_HREF}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    >
                      <LogOut size={13} />
                      Sign out
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <a
            href={CHEFU_LOGIN_HREF}
            className="hidden items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all duration-150 hover:border-primary/40 hover:bg-muted/30 hover:text-foreground sm:flex"
          >
            <LogIn size={13} />
            {authStatus === "checking" ? "Loading" : "Sign in"}
          </a>
        )}

        <button className="p-2 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all duration-150">
          <MoreHorizontal size={16} />
        </button>
      </header>

      {modelMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setModelMenuOpen(false)} />
      )}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </>
  );
}
