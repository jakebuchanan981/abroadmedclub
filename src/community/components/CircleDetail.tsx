import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AccountAccess } from "../../healthcare/AccountPanel";
import { request, useHealthcare } from "../../healthcare/client";
import { useMessaging } from "../../messaging/MessagingProvider";
import { Button, Card, Chip, Notice, T, TextField } from "../../ui";
import { useCommunity } from "../CommunityProvider";
import type {
  Circle,
  CircleMember,
  CirclePost,
  MembershipRequest,
} from "../types";
import { CircleEditor, MembershipForm } from "./forms";
import {
  ActionStatus,
  Confirm,
  PageControls,
  useAction,
  useCommunityPage,
} from "./shared";

function Posts({ circle }: { circle: Circle }) {
  const { user } = useHealthcare();
  const page = useCommunityPage<CirclePost>(
    `/community/circles/${circle.id}/posts`,
  );
  const action = useAction();
  const [body, setBody] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  return (
    <View style={{ gap: 14 }}>
      <Notice>
        Peer experiences are not medical advice. Posts and reports can be
        accessed by staff. Moderation is not continuous or an emergency service.
      </Notice>
      {circle.state === "open" && circle.myMembership?.status === "active" && (
        <View style={{ gap: 10 }}>
          <TextField
            label="Share with circle members"
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={2000}
            editable={!action.busy}
          />
          <T variant="small">
            {body.length}/2000 · Stored in your account only when posted.
          </T>
          <Button
            label={action.busy ? "Working…" : "Post to circle"}
            disabled={action.busy || !body.trim()}
            onPress={() => {
              void action.run(async () => {
                await request<CirclePost>(
                  `/community/circles/${circle.id}/posts`,
                  { method: "POST", body: { body: body.trim() } },
                );
                setBody("");
                action.setNotice("Post saved to this circle.");
                await page.refresh();
              });
            }}
          />
        </View>
      )}
      <ActionStatus {...action} />
      {page.items.map((post) => (
        <Card key={post.id}>
          <View style={{ gap: 10 }}>
            <T variant="label">
              {post.authorAlias} · {new Date(post.createdAt).toLocaleString()}
            </T>
            <T>
              {post.status === "removed"
                ? "This post was removed by moderation."
                : post.body}
            </T>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {post.canDelete && (
                <Button
                  label="Delete post"
                  variant="ghost"
                  small
                  disabled={action.busy}
                  onPress={() => {
                    setDeleting(post.id);
                    setReporting(null);
                  }}
                />
              )}
              {post.status === "visible" &&
                circle.myMembership?.status === "active" &&
                post.authorId !== user?.id && (
                  <Button
                    label="Report post"
                    variant="ghost"
                    small
                    disabled={action.busy}
                    onPress={() => {
                      setReporting(post.id);
                      setDeleting(null);
                      setReason("");
                    }}
                  />
                )}
            </View>
            {deleting === post.id && (
              <Confirm
                title="Confirm delete post"
                description="Permanently delete this post and its reports. This cannot be undone."
                busy={action.busy}
                onCancel={() => setDeleting(null)}
                onConfirm={() => {
                  void action.run(async () => {
                    await request<{ ok: true }>(`/community/posts/${post.id}`, {
                      method: "DELETE",
                      body: {},
                    });
                    setDeleting(null);
                    action.setNotice("Post deleted.");
                    await page.refresh();
                  });
                }}
              />
            )}
            {reporting === post.id && (
              <View style={{ gap: 10 }}>
                <TextField
                  label="Reason for reporting (shared with staff)"
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  maxLength={1000}
                  editable={!action.busy}
                />
                <Button
                  label="Submit report to staff"
                  disabled={action.busy || !reason.trim()}
                  onPress={() => {
                    void action.run(async () => {
                      const receipt = await request<{
                        id: string;
                        status: "received";
                      }>(`/community/posts/${post.id}/report`, {
                        method: "POST",
                        body: { reason: reason.trim() },
                      });
                      setReporting(null);
                      setReason("");
                      action.setNotice(
                        `Report received (${receipt.id}). Staff review is not immediate.`,
                      );
                    });
                  }}
                />
                <Button
                  label="Cancel report"
                  variant="ghost"
                  disabled={action.busy}
                  onPress={() => {
                    setReporting(null);
                    setReason("");
                  }}
                />
              </View>
            )}
          </View>
        </Card>
      ))}
      <PageControls
        page={page}
        empty="No posts yet. Only real member posts appear here."
      />
    </View>
  );
}

function Members({ circle }: { circle: Circle }) {
  const { user } = useHealthcare();
  const { openConversation } = useMessaging();
  const page = useCommunityPage<CircleMember>(
    `/community/circles/${circle.id}/members`,
  );
  const action = useAction();
  return (
    <View style={{ gap: 12 }}>
      <T variant="small">
        Only opted aliases are shown. Private messages are separate from circle
        posts; opting out stops new conversations, not existing ones.
      </T>
      <ActionStatus {...action} />
      {page.items.map((member) => (
        <Card key={member.userId}>
          <View style={{ gap: 8 }}>
            <T variant="h3">
              {member.alias}
              {member.userId === user?.id ? " (you)" : ""}
            </T>
            <T variant="small">
              {member.role === "owner" ? "Group owner" : "Member"} ·{" "}
              {member.allowMessages
                ? "Open to new messages"
                : "Not accepting new messages"}
            </T>
            {member.allowMessages &&
              member.userId !== user?.id &&
              circle.state === "open" &&
              circle.myMembership?.status === "active" && (
                <Button
                  label={`Message ${member.alias}`}
                  variant="secondary"
                  disabled={action.busy}
                  onPress={() => {
                    void action.run(() =>
                      openConversation(circle.id, member.userId),
                    );
                  }}
                />
              )}
          </View>
        </Card>
      ))}
      <PageControls page={page} empty="No active members to display." />
    </View>
  );
}

function Requests({ circle }: { circle: Circle }) {
  const page = useCommunityPage<MembershipRequest>(
    `/community/circles/${circle.id}/requests`,
  );
  const action = useAction();
  const { refreshMemberships } = useCommunity();
  return (
    <View style={{ gap: 12 }}>
      <T variant="h3">Pending join requests</T>
      <ActionStatus {...action} />
      {circle.state === "closed" && (
        <Notice>Reopen the group before reviewing join requests.</Notice>
      )}
      {page.items.map((member) => (
        <Card key={member.userId}>
          <View style={{ gap: 8 }}>
            <T>
              {member.alias} · {new Date(member.requestedAt).toLocaleString()}
            </T>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(["approve", "decline"] as const).map((decision) => (
                <Button
                  key={decision}
                  label={
                    decision === "approve"
                      ? `Approve ${member.alias}`
                      : `Decline ${member.alias}`
                  }
                  variant={decision === "approve" ? "primary" : "secondary"}
                  disabled={action.busy || circle.state === "closed"}
                  onPress={() => {
                    void action.run(async () => {
                      await request<{ ok: true }>(
                        `/community/circles/${circle.id}/requests/${encodeURIComponent(member.userId)}/decision`,
                        { method: "POST", body: { decision } },
                      );
                      action.setNotice(
                        `Request ${decision === "approve" ? "approved" : "declined"}. Refresh circle details to update its member count.`,
                      );
                      await Promise.all([page.refresh(), refreshMemberships()]);
                    });
                  }}
                />
              ))}
            </View>
          </View>
        </Card>
      ))}
      <PageControls page={page} empty="No pending requests." />
    </View>
  );
}

export function CircleDetail({
  id,
  onChanged,
}: {
  id: string;
  onChanged: () => void;
}) {
  const { user } = useHealthcare();
  const { refreshMemberships } = useCommunity();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posts" | "members" | "requests">("posts");
  const [identityForm, setIdentityForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<"leave" | "state" | null>(null);
  const action = useAction();
  const live = useRef(true);
  const sequence = useRef(0);
  async function refresh() {
    if (!live.current) return;
    const revision = ++sequence.current;
    setLoading(true);
    setCircle(null);
    try {
      const result = await request<Circle>(`/community/circles/${id}`);
      if (live.current && sequence.current === revision) setCircle(result);
    } finally {
      if (live.current && sequence.current === revision) setLoading(false);
    }
  }
  useEffect(() => {
    live.current = true;
    void action.run(refresh);
    return () => {
      live.current = false;
      sequence.current += 1;
    };
  }, [id]);
  function saved(result: Circle) {
    if (!live.current) return;
    setCircle(result);
    setIdentityForm(false);
    setEditing(false);
    onChanged();
  }
  const canRead =
    !!circle &&
    (circle.myMembership?.status === "active" || user?.role === "staff");
  return (
    <View style={{ gap: 16 }}>
      <ActionStatus {...action} />
      {loading && <ActivityIndicator accessibilityLabel="Loading circle" />}
      <Button
        label="Refresh circle details"
        variant="secondary"
        disabled={action.busy}
        onPress={() => {
          void action.run(refresh);
        }}
      />
      {circle && (
        <>
          <T variant="h2">{circle.name}</T>
          <T>{circle.description}</T>
          <T variant="small">
            {circle.kind === "travel"
              ? "Member-organized travel coordination"
              : circle.kind === "support"
                ? "Support circle"
                : "Destination circle"}{" "}
            · {circle.state} · {circle.memberCount} active{" "}
            {circle.memberCount === 1 ? "member" : "members"}
          </T>
          {circle.countryCode && (
            <T>
              {circle.city ? `${circle.city}, ` : ""}
              {circle.countryCode}
            </T>
          )}
          {circle.startsOn && (
            <T>
              {circle.startsOn} – {circle.endsOn}
            </T>
          )}
          {circle.ownerAlias && (
            <T variant="small">Owner: {circle.ownerAlias}</T>
          )}
          <Notice>
            Participation is optional. No bookings, payments, arranged care or
            travel guarantees. Directory details reflect the latest successful
            refresh, not live presence.
          </Notice>
          {!user ? (
            <>
              <T variant="h3">Sign in to participate</T>
              <AccountAccess />
            </>
          ) : (
            <>
              {circle.myMembership ? (
                <>
                  <T variant="label">
                    Your membership: {circle.myMembership.status} ·{" "}
                    {circle.myMembership.alias}
                  </T>
                  {circle.myMembership.status === "pending" && (
                    <Notice>
                      Your request is awaiting owner review. Posts and members
                      remain private until approval.
                    </Notice>
                  )}
                  {circle.myMembership.status === "declined" && (
                    <Notice>
                      Your request was declined. Leave/reset this request before
                      explicitly applying again.
                    </Notice>
                  )}
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    <Button
                      label="Edit alias / message opt-in"
                      variant="secondary"
                      disabled={action.busy}
                      onPress={() => setIdentityForm(!identityForm)}
                    />
                    <Button
                      label={
                        circle.myMembership.status === "active"
                          ? "Leave circle"
                          : "Cancel / reset request"
                      }
                      variant="ghost"
                      disabled={action.busy}
                      onPress={() => setConfirm("leave")}
                    />
                  </View>
                </>
              ) : circle.state === "open" ? (
                <Button
                  label={
                    circle.kind === "travel" ? "Request to join" : "Join circle"
                  }
                  onPress={() => setIdentityForm(!identityForm)}
                />
              ) : (
                <Notice>This circle is closed to new members.</Notice>
              )}
              {identityForm &&
                (circle.myMembership || circle.state === "open") && (
                  <MembershipForm circle={circle} onSaved={saved} />
                )}
              {confirm === "leave" && (
                <Confirm
                  title="Confirm leave / reset"
                  description="Your account membership or request will be removed. Existing posts and conversations are not deleted. Travel group owners must close their group before leaving."
                  busy={action.busy}
                  onCancel={() => setConfirm(null)}
                  onConfirm={() => {
                    void action.run(async () => {
                      await request<{ ok: true }>(
                        `/community/circles/${id}/membership`,
                        { method: "DELETE", body: {} },
                      );
                      setConfirm(null);
                      setIdentityForm(false);
                      setCircle(null);
                      onChanged();
                      await refreshMemberships();
                      await refresh();
                    });
                  }}
                />
              )}
            </>
          )}
          {circle.canManage && (
            <View style={{ gap: 10 }}>
              <T variant="h3">Manage circle</T>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Button
                  label={
                    editing ? "Cancel metadata editing" : "Edit public metadata"
                  }
                  variant="secondary"
                  disabled={action.busy}
                  onPress={() => setEditing(!editing)}
                />
                <Button
                  label={
                    circle.state === "open" ? "Close circle" : "Reopen circle"
                  }
                  variant="secondary"
                  disabled={action.busy}
                  onPress={() => setConfirm("state")}
                />
              </View>
              {editing && (
                <CircleEditor key={circle.id} circle={circle} onSaved={saved} />
              )}
              {confirm === "state" && (
                <Confirm
                  title={
                    circle.state === "open"
                      ? "Confirm close circle"
                      : "Confirm reopen circle"
                  }
                  description={
                    circle.state === "open"
                      ? "Close this circle to new joins, posts and new conversations. Existing members retain read access. This does not cancel travel or bookings; none are arranged here."
                      : "Reopen this circle to participation. Its public metadata becomes discoverable again."
                  }
                  busy={action.busy}
                  onCancel={() => setConfirm(null)}
                  onConfirm={() => {
                    void action.run(async () => {
                      const result = await request<Circle>(
                        `/community/circles/${id}`,
                        {
                          method: "PATCH",
                          body: {
                            expectedUpdatedAt: circle.updatedAt,
                            patch: {
                              state:
                                circle.state === "open" ? "closed" : "open",
                            },
                          },
                        },
                      );
                      saved(result);
                      setConfirm(null);
                      await refreshMemberships();
                    });
                  }}
                />
              )}
            </View>
          )}
          {(canRead || circle.canManage) && (
            <>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {canRead && (
                  <>
                    <Chip
                      label="Posts"
                      active={tab === "posts"}
                      onPress={() => setTab("posts")}
                    />
                    <Chip
                      label="Members"
                      active={tab === "members"}
                      onPress={() => setTab("members")}
                    />
                  </>
                )}
                {circle.canManage && (
                  <Chip
                    label="Join requests"
                    active={tab === "requests"}
                    onPress={() => setTab("requests")}
                  />
                )}
              </View>
              {canRead && tab === "posts" && (
                <Posts
                  key={`${circle.id}:${circle.updatedAt}`}
                  circle={circle}
                />
              )}
              {canRead && tab === "members" && (
                <Members
                  key={`${circle.id}:${circle.updatedAt}`}
                  circle={circle}
                />
              )}
              {circle.canManage && tab === "requests" && (
                <Requests
                  key={`${circle.id}:${circle.updatedAt}`}
                  circle={circle}
                />
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}
