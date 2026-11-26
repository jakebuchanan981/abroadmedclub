import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { request, useHealthcare } from "../healthcare/client";
import { Button, Card, Notice, Sheet, T } from "../ui";
import type { PageResult } from "../community/types";
import type { MessageReport } from "./types";

export function MessagingModerationPanel() {
  const { user } = useHealthcare();
  const identity = user?.role === "staff" ? user.id : null;
  const current = useRef(identity);
  current.current = identity;
  if (!identity) return null;
  return (
    <ReportedMessages key={identity} ownerId={identity} current={current} />
  );
}

function ReportedMessages({
  ownerId,
  current,
}: {
  ownerId: string;
  current: React.MutableRefObject<string | null>;
}) {
  const [status, setStatus] = useState<"open" | "resolved">("open");
  const [items, setItems] = useState<MessageReport[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState("");
  const [remove, setRemove] = useState<MessageReport | null>(null);
  const alive = useRef(true);
  const version = useRef(0);
  const busy = useRef(false);
  const cursor = useRef<string | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;
  const active = useCallback(
    () => alive.current && current.current === ownerId,
    [current, ownerId],
  );
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const refresh = useCallback(
    async (more = false) => {
      if (!active() || (more && !cursor.current)) return;
      const ticket = ++version.current;
      setLoading(true);
      setError("");
      try {
        const result = await request<PageResult<MessageReport>>(
          `/messaging/reports?status=${status}${more ? `&cursor=${encodeURIComponent(cursor.current ?? "")}` : ""}`,
        );
        if (
          !active() ||
          ticket !== version.current ||
          statusRef.current !== status
        )
          return;
        setItems((previous) =>
          more
            ? [
                ...previous,
                ...result.items.filter(
                  (item) => !previous.some((old) => old.id === item.id),
                ),
              ]
            : result.items,
        );
        cursor.current = result.nextCursor;
        setNextCursor(result.nextCursor);
      } catch (cause) {
        if (active() && ticket === version.current)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load reported messages.",
          );
      } finally {
        if (active() && ticket === version.current) setLoading(false);
      }
    },
    [active, status],
  );
  useEffect(() => {
    setItems([]);
    cursor.current = null;
    setNextCursor(null);
    void refresh();
  }, [refresh]);
  async function moderate(id: string, action: "resolve" | "remove-message") {
    if (busy.current || !active()) return;
    busy.current = true;
    setPending(true);
    setError("");
    setReceipt("");
    try {
      await request<{ ok: true }>(
        `/messaging/reports/${encodeURIComponent(id)}`,
        { method: "PATCH", body: { action } },
      );
      if (!active()) return;
      setRemove(null);
      setReceipt(
        action === "remove-message"
          ? "Reported message and all dependent reports permanently removed for both participants."
          : "Report resolved. The message remains available to its participants.",
      );
      await refresh();
    } catch (cause) {
      if (active())
        setError(
          cause instanceof Error
            ? cause.message
            : "Moderation action failed. Please retry.",
        );
    } finally {
      busy.current = false;
      if (active()) setPending(false);
    }
  }
  return (
    <Card style={styles.panel}>
      <T variant="h2" accessibilityRole="header">
        Reported member messages
      </T>
      <Notice>
        Participants explicitly consented to share these selected messages and
        reasons. Staff cannot browse the underlying conversations or unreported
        private messages. Deleting a message also deletes its reports; deleted
        content is not retained here.
      </Notice>
      <View style={styles.actions}>
        <Button
          label="Open reports"
          variant={status === "open" ? "primary" : "secondary"}
          disabled={pending || loading || status === "open"}
          onPress={() => {
            setItems([]);
            setStatus("open");
            setReceipt("");
          }}
        />
        <Button
          label="Resolved reports"
          variant={status === "resolved" ? "primary" : "secondary"}
          disabled={pending || loading || status === "resolved"}
          onPress={() => {
            setItems([]);
            setStatus("resolved");
            setReceipt("");
          }}
        />
        <Button
          label="Refresh reports"
          variant="ghost"
          disabled={pending || loading}
          onPress={() => void refresh()}
        />
      </View>
      {loading && (
        <ActivityIndicator accessibilityLabel="Loading message reports" />
      )}
      {error && <Notice>{error} Use Refresh reports to retry loading.</Notice>}
      {receipt && <T accessibilityLiveRegion="polite">{receipt}</T>}
      {!loading && !error && items.length === 0 && (
        <T>No {status} message reports.</T>
      )}
      {items.map((item) => (
        <Card key={item.id} style={styles.report}>
          <T variant="h3">Report from {item.reporterAlias}</T>
          <T variant="small">
            {item.status} · Reported {new Date(item.createdAt).toLocaleString()}{" "}
            · {item.id}
          </T>
          <T variant="label">Selected message from {item.senderAlias}</T>
          <T variant="small">
            Sent {new Date(item.reportedMessage.createdAt).toLocaleString()}
          </T>
          <T selectable>{item.reportedMessage.body}</T>
          <T variant="label">Reason shared with staff</T>
          <T selectable>{item.reason}</T>
          <View style={styles.actions}>
            {item.status === "open" && (
              <Button
                label="Resolve without removal"
                variant="secondary"
                disabled={pending || loading}
                onPress={() => void moderate(item.id, "resolve")}
              />
            )}
            <Button
              label="Remove reported message"
              variant="ghost"
              disabled={pending || loading}
              onPress={() => {
                setError("");
                setRemove(item);
              }}
            />
          </View>
        </Card>
      ))}
      {nextCursor && (
        <Button
          label="Load more reports"
          variant="secondary"
          disabled={pending || loading}
          onPress={() => void refresh(true)}
        />
      )}
      <Sheet
        visible={remove !== null}
        onClose={() => {
          if (!pending) setRemove(null);
        }}
        title="Permanently remove this message?"
      >
        <T>
          This deletes only the reported message from both participants'
          conversation and permanently deletes all reports about that message.
          The rest of their private conversation is unchanged and inaccessible
          here. This cannot be undone.
        </T>
        {error && <Notice>{error}</Notice>}
        <View style={styles.actions}>
          <Button
            label="Cancel"
            variant="secondary"
            disabled={pending}
            onPress={() => setRemove(null)}
          />
          <Button
            label="Remove message and reports"
            disabled={pending}
            onPress={() => {
              if (remove) void moderate(remove.id, "remove-message");
            }}
          />
        </View>
      </Sheet>
    </Card>
  );
}
const styles = StyleSheet.create({
  panel: { padding: 20, gap: 18, marginTop: 20 },
  report: { padding: 18, gap: 12 },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
});
