import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ApiRequestError, request, useHealthcare } from "../healthcare/client";
import { useApp } from "../store";
import type { PageResult } from "../community/types";
import type {
  ConversationDetail,
  MemberConversation,
  MemberMessage,
} from "./types";

interface MessagingContextValue {
  conversations: MemberConversation[];
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
  detail: ConversationDetail | null;
  selectedId: string | null;
  threadLoading: boolean;
  threadError: string | null;
  pending: boolean;
  refreshConversations: (more?: boolean) => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  closeConversation: () => void;
  refreshThread: (more?: boolean) => Promise<void>;
  openConversation: (circleId: string, recipientId: string) => Promise<void>;
  sendMessage: (body: string) => Promise<void>;
  setBlocked: (blocked: boolean) => Promise<void>;
  markRead: () => Promise<void>;
  deleteConversation: () => Promise<void>;
  reportMessage: (id: string, reason: string) => Promise<string>;
}
const MessagingContext = createContext<MessagingContextValue | null>(null);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useHealthcare();
  const identity = user?.id ?? null;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  return (
    <MessagingSession
      key={identity ?? "guest"}
      ownerId={identity}
      identityRef={identityRef}
    >
      {children}
    </MessagingSession>
  );
}

function MessagingSession({
  children,
  ownerId,
  identityRef,
}: {
  children: React.ReactNode;
  ownerId: string | null;
  identityRef: React.MutableRefObject<string | null>;
}) {
  const { navigate, tab } = useApp();
  const [conversations, setConversations] = useState<MemberConversation[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const alive = useRef(true);
  const listVersion = useRef(0);
  const mutationBusy = useRef(false);
  const selection = useRef<string | null>(null);
  const threadVersion = useRef(0);
  const listCursor = useRef<string | null>(null);
  const historyCursor = useRef<string | null>(null);
  const isCurrent = useCallback(
    () => alive.current && identityRef.current === ownerId,
    [identityRef, ownerId],
  );
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const revokeThread = useCallback((id: string) => {
    if (selection.current !== id) return;
    ++threadVersion.current;
    selection.current = null;
    historyCursor.current = null;
    setSelectedId(null);
    setDetail(null);
    setThreadError(null);
    setThreadLoading(false);
    setConversations((previous) => previous.filter((item) => item.id !== id));
    setError(
      "This conversation is no longer available. Its cached messages have been cleared.",
    );
  }, []);

  const refreshConversations = useCallback(
    async (more = false) => {
      if (!ownerId || !isCurrent() || (more && !listCursor.current)) return;
      const version = ++listVersion.current;
      setLoading(true);
      setError(null);
      try {
        const result = await request<PageResult<MemberConversation>>(
          `/messaging/conversations${more ? `?cursor=${encodeURIComponent(listCursor.current ?? "")}` : ""}`,
        );
        if (!isCurrent() || version !== listVersion.current) return;
        setConversations((previous) =>
          more
            ? [
                ...previous,
                ...result.items.filter(
                  (item) => !previous.some((old) => old.id === item.id),
                ),
              ]
            : result.items,
        );
        listCursor.current = result.nextCursor;
        setNextCursor(result.nextCursor);
        if (
          !more &&
          result.nextCursor === null &&
          selection.current &&
          !result.items.some((item) => item.id === selection.current)
        )
          revokeThread(selection.current);
      } catch (cause) {
        if (isCurrent() && version === listVersion.current)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load member messages.",
          );
      } finally {
        if (isCurrent() && version === listVersion.current) setLoading(false);
      }
    },
    [isCurrent, ownerId, revokeThread],
  );

  const loadThread = useCallback(
    async (id: string, more = false) => {
      if (!ownerId || !isCurrent() || (more && !historyCursor.current)) return;
      const version = ++threadVersion.current;
      setThreadLoading(true);
      setThreadError(null);
      try {
        const result = await request<ConversationDetail>(
          `/messaging/conversations/${encodeURIComponent(id)}${more ? `?cursor=${encodeURIComponent(historyCursor.current ?? "")}` : ""}`,
        );
        if (
          !isCurrent() ||
          version !== threadVersion.current ||
          selection.current !== id
        )
          return;
        setDetail((previous) =>
          more && previous?.conversation.id === id
            ? {
                ...result,
                messages: {
                  ...result.messages,
                  items: [
                    ...previous.messages.items,
                    ...result.messages.items.filter(
                      (item) =>
                        !previous.messages.items.some(
                          (old) => old.id === item.id,
                        ),
                    ),
                  ],
                },
              }
            : result,
        );
        historyCursor.current = result.messages.nextCursor;
        setConversations((previous) =>
          previous.map((item) => (item.id === id ? result.conversation : item)),
        );
      } catch (cause) {
        if (isCurrent() && version === threadVersion.current) {
          if (
            cause instanceof ApiRequestError &&
            (cause.status === 403 || cause.status === 404)
          )
            revokeThread(id);
          else
            setThreadError(
              cause instanceof Error
                ? cause.message
                : "Could not load this conversation.",
            );
        }
      } finally {
        if (isCurrent() && version === threadVersion.current)
          setThreadLoading(false);
      }
    },
    [isCurrent, ownerId, revokeThread],
  );
  const selectConversation = useCallback(
    async (id: string) => {
      selection.current = id;
      historyCursor.current = null;
      setSelectedId(id);
      setDetail(null);
      await loadThread(id);
    },
    [loadThread],
  );
  const refreshThread = useCallback(
    async (more = false) => {
      if (selection.current) await loadThread(selection.current, more);
    },
    [loadThread],
  );
  const closeConversation = useCallback(() => {
    ++threadVersion.current;
    selection.current = null;
    historyCursor.current = null;
    setSelectedId(null);
    setDetail(null);
    setThreadError(null);
    setThreadLoading(false);
  }, []);

  const mutate = useCallback(
    async <T,>(path: string, method: string, body: unknown): Promise<T> => {
      if (!ownerId || !isCurrent())
        throw new Error("Sign in again to continue.");
      if (mutationBusy.current)
        throw new Error("Wait for the current messaging action to finish.");
      mutationBusy.current = true;
      setPending(true);
      try {
        const result = await request<T>(path, { method, body });
        if (!isCurrent())
          throw new Error(
            "Your account changed. This result is no longer shown.",
          );
        return result;
      } finally {
        mutationBusy.current = false;
        if (isCurrent()) setPending(false);
      }
    },
    [isCurrent, ownerId],
  );
  const openConversation = useCallback(
    async (circleId: string, recipientId: string) => {
      const result = await mutate<ConversationDetail>(
        "/messaging/conversations",
        "POST",
        { circleId, recipientId },
      );
      ++threadVersion.current;
      selection.current = result.conversation.id;
      historyCursor.current = result.messages.nextCursor;
      setSelectedId(result.conversation.id);
      setDetail(result);
      setThreadError(null);
      setThreadLoading(false);
      setConversations((previous) => [
        result.conversation,
        ...previous.filter((item) => item.id !== result.conversation.id),
      ]);
      navigate("messages");
    },
    [mutate, navigate],
  );
  const sendMessage = useCallback(
    async (body: string) => {
      const id = selection.current;
      if (!id) throw new Error("Select a conversation first.");
      ++threadVersion.current;
      setThreadLoading(false);
      const result = await mutate<MemberMessage>(
        `/messaging/conversations/${encodeURIComponent(id)}/messages`,
        "POST",
        { body },
      );
      if (selection.current === id)
        setDetail((previous) =>
          previous?.conversation.id === id
            ? {
                ...previous,
                conversation: {
                  ...previous.conversation,
                  updatedAt: result.createdAt,
                },
                messages: {
                  ...previous.messages,
                  items: [result, ...previous.messages.items],
                },
              }
            : previous,
        );
      void refreshConversations();
    },
    [mutate, refreshConversations],
  );
  const threadAction = useCallback(
    async (action: "read" | "block" | "delete", body: unknown) => {
      const id = selection.current;
      if (!id) throw new Error("Select a conversation first.");
      await mutate<{ ok: true }>(
        `/messaging/conversations/${encodeURIComponent(id)}${action === "delete" ? "" : `/${action}`}`,
        action === "delete" ? "DELETE" : "POST",
        body,
      );
      if (selection.current === id) {
        if (action === "delete") closeConversation();
        else await loadThread(id);
      }
      await refreshConversations();
    },
    [closeConversation, loadThread, mutate, refreshConversations],
  );
  const markRead = useCallback(() => threadAction("read", {}), [threadAction]);
  const setBlocked = useCallback(
    (blocked: boolean) => threadAction("block", { blocked }),
    [threadAction],
  );
  const deleteConversation = useCallback(
    () => threadAction("delete", {}),
    [threadAction],
  );
  const reportMessage = useCallback(
    async (id: string, reason: string) => {
      const result = await mutate<{ id: string; status: "received" }>(
        `/messaging/messages/${encodeURIComponent(id)}/report`,
        "POST",
        { reason, consent: true },
      );
      return result.id;
    },
    [mutate],
  );
  useEffect(() => {
    if (tab === "messages") {
      void refreshConversations();
      void refreshThread();
    }
  }, [tab, refreshConversations, refreshThread]);

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        nextCursor,
        loading,
        error,
        detail,
        selectedId,
        threadLoading,
        threadError,
        pending,
        refreshConversations,
        selectConversation,
        closeConversation,
        refreshThread,
        openConversation,
        sendMessage,
        setBlocked,
        markRead,
        deleteConversation,
        reportMessage,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
}
export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) throw new Error("useMessaging requires MessagingProvider.");
  return context;
}
