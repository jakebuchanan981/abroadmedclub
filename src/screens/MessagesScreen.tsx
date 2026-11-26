import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  View,
  useWindowDimensions,
} from "react-native";
import { useApp } from "../store";
import { InboxPanel } from "../healthcare/InboxPanel";
import { AccountAccess } from "../healthcare/AccountPanel";
import { useHealthcare } from "../healthcare/client";
import { useMessaging } from "../messaging/MessagingProvider";
import { BlockedMembers } from "../messaging/components/BlockedMembers";
import type { MemberMessage } from "../messaging/types";
import {
  Button,
  Card,
  colors,
  EmptyState,
  Notice,
  Page,
  PageTitle,
  Sheet,
  T,
  TextField,
} from "../ui";

export function MessagesScreen() {
  const { user, sessionLoading } = useHealthcare();
  const { selectedId } = useMessaging();
  return (
    <Page>
      <PageTitle
        eyebrow="Account conversations"
        title={selectedId ? "Your conversation." : "A space to connect."}
        description={
          selectedId
            ? "Between account participants. Not an emergency or clinical channel."
            : "Your directory-team inquiries and member conversations are separate account services."
        }
      />
      {!selectedId && (
        <>
          <T variant="h2" accessibilityRole="header" style={styles.heading}>
            Member conversations
          </T>
          <Notice icon="LockKeyhole">
            Start a conversation from an opted-in member's circle profile. There
            is no global member search. Messages are account-stored; new unsent
            text stays in memory only. Avoid medical records and other sensitive
            details. Staff can see only messages explicitly reported to them,
            not the rest of your conversation.
          </Notice>
        </>
      )}
      {sessionLoading ? (
        <ActivityIndicator accessibilityLabel="Loading account" />
      ) : user ? (
        <MemberInbox key={`inbox:${user.id}`} userId={user.id} />
      ) : (
        <Card style={styles.card}>
          <T>Sign in to message members who have opted in.</T>
          <AccountAccess />
        </Card>
      )}
      {!selectedId && (
        <>
          {!sessionLoading && user && (
            <BlockedMembers key={`blocks:${user.id}`} />
          )}
          <T variant="h2" accessibilityRole="header" style={styles.heading}>
            Directory-team inbox
          </T>
          <Notice>
            For directory inquiries, not member chat or messages delivered
            directly to a clinic. Check each inquiry's recorded status below.
          </Notice>
          <InboxPanel />
          <LegacyDrafts />
        </>
      )}
    </Page>
  );
}

function MemberInbox({ userId }: { userId: string }) {
  const messaging = useMessaging();
  const { navigate } = useApp();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  return (
    <View style={[styles.workspace, wide && { flexDirection: "row" }]}>
      {(wide || !messaging.selectedId) && (
        <Card style={[styles.card, wide && { width: 320 }]}>
          <View style={styles.row}>
            <T variant="h3">Your conversations</T>
            <Button
              small
              label="Refresh inbox"
              variant="ghost"
              disabled={messaging.loading || messaging.pending}
              onPress={() => void messaging.refreshConversations()}
            />
          </View>
          <T variant="small">
            Newest conversations first. Refresh for the latest messages; this is
            not a live or emergency service.
          </T>
          {messaging.loading && (
            <ActivityIndicator accessibilityLabel="Loading member inbox" />
          )}
          {messaging.error && (
            <Notice>{messaging.error} Use Refresh inbox to retry.</Notice>
          )}
          {!messaging.loading &&
            !messaging.error &&
            messaging.conversations.length === 0 && (
              <EmptyState
                icon="MessageCircle"
                title="No member conversations yet"
                body="Join a circle with an alias, then choose Message beside a member who allows new conversations."
                actionLabel="Browse circles"
                onAction={() => navigate("club")}
              />
            )}
          {messaging.conversations.map((item) => (
            <View
              key={item.id}
              style={[
                styles.listItem,
                messaging.selectedId === item.id && {
                  backgroundColor: colors.sage,
                },
              ]}
            >
              <T variant="h3">{item.peer.alias}</T>
              <T variant="small">Started in {item.circleName}</T>
              <T variant="small">
                {item.unreadCount} unread · Last activity{" "}
                {new Date(item.updatedAt).toLocaleString()}
              </T>
              {!item.canSend && <T variant="small">Sending blocked</T>}
              <Button
                label={`Open ${item.peer.alias}`}
                small
                variant="secondary"
                disabled={messaging.pending}
                onPress={() => void messaging.selectConversation(item.id)}
              />
            </View>
          ))}
          {messaging.nextCursor && (
            <Button
              label="Load more conversations"
              variant="secondary"
              disabled={messaging.loading || messaging.pending}
              onPress={() => void messaging.refreshConversations(true)}
            />
          )}
        </Card>
      )}
      {messaging.selectedId && (
        <Card style={[styles.card, { flex: 1, minWidth: 0 }]}>
          <View style={styles.row}>
            <Button
              label="Back to inbox"
              variant="ghost"
              disabled={messaging.pending}
              onPress={messaging.closeConversation}
            />
            <Button
              label="Refresh conversation"
              variant="secondary"
              disabled={messaging.threadLoading || messaging.pending}
              onPress={() => void messaging.refreshThread()}
            />
          </View>
          {messaging.threadLoading && (
            <ActivityIndicator accessibilityLabel="Loading conversation" />
          )}
          {messaging.threadError && (
            <Notice>
              {messaging.threadError} Refresh this conversation to retry. A
              deleted thread is no longer available.
            </Notice>
          )}
          {messaging.detail && (
            <Thread key={messaging.detail.conversation.id} userId={userId} />
          )}
        </Card>
      )}
    </View>
  );
}

function Thread({ userId }: { userId: string }) {
  const messaging = useMessaging();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState("");
  const [confirmation, setConfirmation] = useState<"delete" | "block" | null>(
    null,
  );
  const [reported, setReported] = useState<MemberMessage | null>(null);
  const [reason, setReason] = useState("");
  const [consent, setConsent] = useState(false);
  const detail = messaging.detail;
  if (!detail) return null;
  const conversation = detail.conversation;
  async function act(action: "send" | "read" | "block" | "delete" | "report") {
    if (messaging.pending) return;
    setError("");
    setReceipt("");
    try {
      if (action === "send") {
        await messaging.sendMessage(body);
        setBody("");
        setReceipt(
          "Message saved to this account conversation. This is not a delivery or read receipt.",
        );
      } else if (action === "read") {
        await messaging.markRead();
        setReceipt(
          "Current conversation messages marked read for your account.",
        );
      } else if (action === "block") {
        await messaging.setBlocked(!conversation.blockedByMe);
        setConfirmation(null);
        setReceipt(
          conversation.blockedByMe
            ? "Your block was removed. The other person's block, if present, remains in effect."
            : "Member blocked across all circles and conversations.",
        );
      } else if (action === "delete") {
        await messaging.deleteConversation();
        setConfirmation(null);
      } else if (reported && consent) {
        const id = await messaging.reportMessage(reported.id, reason);
        setReported(null);
        setReason("");
        setConsent(false);
        setReceipt(`Report received: ${id}. No response time is guaranteed.`);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "This action could not be completed. Please retry.",
      );
    }
  }
  const locked = messaging.pending || messaging.threadLoading;
  return (
    <View style={styles.stack}>
      <T variant="h2">{conversation.peer.alias}</T>
      <T variant="small">
        Started in {conversation.circleName}. Aliases shown are those shared
        when the conversation began. Existing conversations remain after a
        circle is left or closed.
      </T>
      <View style={styles.row}>
        <Button
          small
          label={`Mark current messages read (${conversation.unreadCount} unread)`}
          variant="secondary"
          disabled={locked}
          onPress={() => void act("read")}
        />
        <Button
          small
          label={conversation.blockedByMe ? "Unblock member" : "Block member"}
          variant="ghost"
          disabled={locked}
          onPress={() => {
            setError("");
            setConfirmation("block");
          }}
        />
        <Button
          small
          label="Delete shared conversation"
          variant="ghost"
          disabled={locked}
          onPress={() => {
            setError("");
            setConfirmation("delete");
          }}
        />
      </View>
      {!conversation.canSend && (
        <Notice>
          Sending is disabled because a block is active. You can remove only
          your own block. Existing messages remain readable.
        </Notice>
      )}
      <T variant="small">
        Mark read applies to all messages currently stored on the server,
        including earlier history. Refresh before marking read if you want to
        review the latest messages first.
      </T>
      {detail.messages.nextCursor && (
        <Button
          label="Load earlier messages"
          variant="secondary"
          disabled={locked}
          onPress={() => void messaging.refreshThread(true)}
        />
      )}
      {detail.messages.items.length === 0 && (
        <T>No messages in this conversation yet.</T>
      )}
      {[...detail.messages.items].reverse().map((item) => (
        <View
          key={item.id}
          style={[
            styles.message,
            item.senderId === userId && { backgroundColor: colors.sage },
          ]}
        >
          <T variant="label">
            {item.senderId === userId ? "You" : conversation.peer.alias}
          </T>
          <T variant="small">{new Date(item.createdAt).toLocaleString()}</T>
          <T selectable>{item.body}</T>
          <Button
            label="Report this message"
            small
            variant="ghost"
            disabled={locked}
            onPress={() => {
              setReported(item);
              setReason("");
              setConsent(false);
              setError("");
            }}
          />
        </View>
      ))}
      <TextField
        label="Message (not saved until sent)"
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={2000}
        editable={!locked && conversation.canSend}
        style={{ minHeight: 110 }}
      />
      <T variant="small">
        {body.length}/2,000 · Unsent text is lost when you close this
        conversation, leave this screen, or change accounts. Do not use chat for
        emergencies or clinical advice.
      </T>
      <Button
        label={messaging.pending ? "Working…" : "Send message"}
        icon="Send"
        disabled={locked || !conversation.canSend || !body.trim()}
        onPress={() => void act("send")}
      />
      {error && <Notice>{error}</Notice>}
      {receipt && <T accessibilityLiveRegion="polite">{receipt}</T>}
      <Sheet
        visible={confirmation !== null}
        onClose={() => {
          if (!messaging.pending) setConfirmation(null);
        }}
        title={
          confirmation === "delete"
            ? "Delete for both people?"
            : conversation.blockedByMe
              ? "Remove your global block?"
              : "Block this member globally?"
        }
      >
        <T>
          {confirmation === "delete"
            ? "This permanently deletes the entire conversation, all its messages and message reports for both participants. It cannot be undone. Any global member block remains in effect."
            : conversation.blockedByMe
              ? "This removes only the block you created. If the other member blocked you, neither person can send until they remove their block."
              : "Neither person will be able to send to the other in any circle or conversation. This does not delete existing messages. You can remove your block here later."}
        </T>
        {error && <Notice>{error}</Notice>}
        <View style={styles.row}>
          <Button
            label="Cancel"
            variant="secondary"
            disabled={messaging.pending}
            onPress={() => setConfirmation(null)}
          />
          <Button
            label={
              confirmation === "delete"
                ? "Permanently delete for both"
                : conversation.blockedByMe
                  ? "Remove my block"
                  : "Block member everywhere"
            }
            disabled={messaging.pending}
            onPress={() =>
              void act(confirmation === "delete" ? "delete" : "block")
            }
          />
        </View>
      </Sheet>
      <Sheet
        visible={reported !== null}
        onClose={() => {
          if (!messaging.pending) setReported(null);
        }}
        title="Share this message with staff?"
      >
        <T>
          Only the selected message, your reason, and the conversation aliases
          will be shared with staff. Other private messages are not included.
          Reports are not emergency support and no response time is promised.
        </T>
        <Card style={styles.card}>
          <T selectable>{reported?.body}</T>
        </Card>
        <TextField
          label="Reason for reporting"
          value={reason}
          onChangeText={setReason}
          maxLength={1000}
          multiline
          editable={!messaging.pending}
        />
        <View style={styles.row}>
          <Switch
            accessibilityLabel="I consent to sharing the selected message and reason with staff"
            value={consent}
            onValueChange={setConsent}
            disabled={messaging.pending}
          />
          <T style={{ flex: 1 }}>
            I consent to share this message, aliases and reason with staff.
          </T>
        </View>
        {error && <Notice>{error}</Notice>}
        <Button
          label="Submit report with consent"
          disabled={messaging.pending || !consent || !reason.trim()}
          onPress={() => void act("report")}
        />
      </Sheet>
    </View>
  );
}

function LegacyDrafts() {
  const { state, saveDraft, ready, storageError } = useApp();
  const [discardId, setDiscardId] = useState<string | null>(null);
  const drafts = Object.entries(state.drafts).filter(
    ([, text]) => text.length > 0,
  );
  return (
    <View style={styles.stack}>
      <T variant="h2" accessibilityRole="header" style={styles.heading}>
        Legacy device-only drafts
      </T>
      <Notice>
        These drafts came from old conversation previews, not real recipients.
        They are readable here and are never uploaded, linked to a member, or
        sent automatically. This device storage is not suitable for sensitive
        information.
      </Notice>
      {!ready && (
        <ActivityIndicator accessibilityLabel="Loading local drafts" />
      )}
      {storageError && (
        <Notice>
          {storageError} A discarded draft may remain in device storage if
          saving fails.
        </Notice>
      )}
      {ready && drafts.length === 0 && <T>No legacy drafts on this device.</T>}
      {drafts.map(([id, text], index) => (
        <Card key={id} style={styles.card}>
          <T variant="h3">Legacy preview draft {index + 1}</T>
          <T selectable>{text}</T>
          <Button
            label="Discard this local draft"
            variant="ghost"
            disabled={!ready}
            onPress={() => setDiscardId(id)}
          />
        </Card>
      ))}
      <Sheet
        visible={discardId !== null}
        onClose={() => setDiscardId(null)}
        title="Discard this device draft?"
      >
        <T>
          This removes this legacy draft from this device only. It cannot be
          undone. No member conversation is changed and no text is sent.
        </T>
        <View style={styles.row}>
          <Button
            label="Keep draft"
            variant="secondary"
            onPress={() => setDiscardId(null)}
          />
          <Button
            label="Discard local draft"
            disabled={!ready}
            onPress={() => {
              if (discardId) saveDraft(discardId, "");
              setDiscardId(null);
            }}
          />
        </View>
      </Sheet>
    </View>
  );
}
const styles = StyleSheet.create({
  heading: { marginTop: 30, marginBottom: 16 },
  workspace: { marginTop: 20, gap: 18, alignItems: "stretch" },
  card: { padding: 20, gap: 14 },
  stack: { gap: 16 },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
  listItem: {
    padding: 14,
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  message: {
    padding: 16,
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#F5F5EF",
  },
});
