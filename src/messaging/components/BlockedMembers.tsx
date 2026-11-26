import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { request, useHealthcare } from "../../healthcare/client";
import { Button, Card, Notice, Sheet, T } from "../../ui";
import type { PageResult } from "../../community/types";
import { useMessaging } from "../MessagingProvider";
import type { MemberBlock } from "../types";

export function BlockedMembers() {
  const { user } = useHealthcare();
  const identity = user?.id ?? null;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  if (!identity) return null;
  return (
    <BlockList key={identity} ownerId={identity} identityRef={identityRef} />
  );
}

function BlockList({
  ownerId,
  identityRef,
}: {
  ownerId: string;
  identityRef: React.MutableRefObject<string | null>;
}) {
  const messaging = useMessaging();
  const [items, setItems] = useState<MemberBlock[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState("");
  const [selected, setSelected] = useState<MemberBlock | null>(null);
  const alive = useRef(true);
  const sequence = useRef(0);
  const cursor = useRef<string | null>(null);
  const busy = useRef(false);
  const current = useCallback(
    () => alive.current && identityRef.current === ownerId,
    [identityRef, ownerId],
  );
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const refresh = useCallback(
    async (more = false) => {
      if (!current() || (more && !cursor.current)) return;
      const ticket = ++sequence.current;
      setLoading(true);
      setError("");
      try {
        const result = await request<PageResult<MemberBlock>>(
          `/messaging/blocks${more ? `?cursor=${encodeURIComponent(cursor.current ?? "")}` : ""}`,
        );
        if (!current() || sequence.current !== ticket) return;
        setItems((previous) =>
          more
            ? [
                ...previous,
                ...result.items.filter(
                  (item) => !previous.some((old) => old.userId === item.userId),
                ),
              ]
            : result.items,
        );
        cursor.current = result.nextCursor;
        setNextCursor(result.nextCursor);
      } catch (cause) {
        if (current() && sequence.current === ticket)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load blocked members.",
          );
      } finally {
        if (current() && sequence.current === ticket) setLoading(false);
      }
    },
    [current],
  );
  useEffect(() => {
    void refresh();
  }, [refresh, messaging.detail?.conversation.blockedByMe]);
  async function unblock() {
    if (!selected || busy.current || !current()) return;
    const member = selected;
    busy.current = true;
    setPending(true);
    setError("");
    setReceipt("");
    try {
      await request<{ ok: true }>(
        `/messaging/blocks/${encodeURIComponent(member.userId)}`,
        { method: "DELETE", body: {} },
      );
      if (!current()) return;
      setSelected(null);
      setItems((previous) =>
        previous.filter((item) => item.userId !== member.userId),
      );
      setReceipt(
        `Your block for ${member.alias} was removed. Any block they created remains in effect.`,
      );
      await Promise.all([
        refresh(),
        messaging.refreshConversations(),
        messaging.refreshThread(),
      ]);
    } catch (cause) {
      if (current())
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not remove your block. Please retry.",
        );
    } finally {
      busy.current = false;
      if (current()) setPending(false);
    }
  }
  return (
    <Card style={{ marginTop: 24, padding: 20, gap: 16 }}>
      <T variant="h2" accessibilityRole="header">
        Blocked members
      </T>
      <Notice>
        Your blocks apply across all circles and remain after either person
        deletes a shared conversation. Manage them here even when your inbox is
        empty. Only aliases previously shared with you are shown; there is no
        account search. Refresh for changes from another device.
      </Notice>
      <Button
        label="Refresh blocked members"
        variant="secondary"
        disabled={loading || pending || messaging.pending}
        onPress={() => void refresh()}
      />
      {loading && (
        <ActivityIndicator accessibilityLabel="Loading blocked members" />
      )}
      {error && <Notice>{error}</Notice>}
      {receipt && <T accessibilityLiveRegion="polite">{receipt}</T>}
      {!loading && !error && items.length === 0 && (
        <T>You have not blocked any members.</T>
      )}
      {items.map((item) => (
        <View key={item.userId} style={{ gap: 8 }}>
          <T variant="h3">{item.alias}</T>
          <T variant="small">
            Blocked {new Date(item.createdAt).toLocaleString()}
          </T>
          <Button
            label={`Unblock ${item.alias}`}
            variant="ghost"
            disabled={pending || loading || messaging.pending}
            onPress={() => {
              setError("");
              setSelected(item);
            }}
          />
        </View>
      ))}
      {nextCursor && (
        <Button
          label="Load more blocked members"
          variant="secondary"
          disabled={loading || pending || messaging.pending}
          onPress={() => void refresh(true)}
        />
      )}
      <Sheet
        visible={selected !== null}
        onClose={() => {
          if (!pending) setSelected(null);
        }}
        title="Remove your global block?"
        subtitle={selected?.alias}
      >
        <T>
          This removes only your block. It does not restore deleted
          conversations, change circle memberships, change either person's
          message opt-in, or remove a block the other person created.
        </T>
        {error && <Notice>{error}</Notice>}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <Button
            label="Keep block"
            variant="secondary"
            disabled={pending}
            onPress={() => setSelected(null)}
          />
          <Button
            label="Remove my block"
            disabled={pending || messaging.pending}
            onPress={() => void unblock()}
          />
        </View>
      </Sheet>
    </Card>
  );
}
