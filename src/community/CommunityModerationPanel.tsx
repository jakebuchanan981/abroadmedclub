import React, { useState } from "react";
import { View } from "react-native";
import { request, useHealthcare } from "../healthcare/client";
import { Button, Card, Chip, Notice, Sheet, T } from "../ui";
import { CircleDetail } from "./components/CircleDetail";
import {
  ActionStatus,
  Confirm,
  PageControls,
  useAction,
  useCommunityPage,
} from "./components/shared";
import type { CommunityReport } from "./types";

function ReportList({
  status,
  onOpen,
}: {
  status: "open" | "resolved";
  onOpen: (id: string) => void;
}) {
  const page = useCommunityPage<CommunityReport>(
    `/community/reports?status=${status}`,
  );
  const action = useAction();
  const [confirmation, setConfirmation] = useState<{
    id: string;
    action: "dismiss" | "remove-post";
  } | null>(null);
  return (
    <View style={{ gap: 14 }}>
      <ActionStatus {...action} />
      {page.items.map((report) => (
        <Card key={report.id}>
          <View style={{ gap: 10 }}>
            <T variant="h3">{report.circleName}</T>
            <T variant="small">
              Report {report.id} · {report.status} ·{" "}
              {new Date(report.createdAt).toLocaleString()}
            </T>
            <T variant="label">Reported by {report.reporterAlias}</T>
            <T>{report.reason}</T>
            <T variant="label">Post by {report.post.authorAlias}</T>
            <T>
              {report.post.status === "removed"
                ? "Post removed from member view."
                : report.post.body}
            </T>
            <Button
              label="Open circle and management"
              variant="secondary"
              disabled={action.busy}
              onPress={() => onOpen(report.circleId)}
            />
            {report.status === "open" && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Button
                  label="Dismiss report"
                  variant="secondary"
                  disabled={action.busy}
                  onPress={() =>
                    setConfirmation({ id: report.id, action: "dismiss" })
                  }
                />
                <Button
                  label="Remove reported post"
                  disabled={action.busy}
                  onPress={() =>
                    setConfirmation({ id: report.id, action: "remove-post" })
                  }
                />
              </View>
            )}
            {confirmation?.id === report.id && (
              <Confirm
                title={
                  confirmation.action === "dismiss"
                    ? "Confirm dismiss report"
                    : "Confirm remove post"
                }
                description={
                  confirmation.action === "dismiss"
                    ? "Resolve this report without removing the post."
                    : "Remove this post's body from member view and resolve this report. This does not contact the author or reporter."
                }
                busy={action.busy}
                onCancel={() => setConfirmation(null)}
                onConfirm={() => {
                  const decision = confirmation.action;
                  void action.run(async () => {
                    await request<{ ok: true }>(
                      `/community/reports/${report.id}`,
                      { method: "PATCH", body: { action: decision } },
                    );
                    setConfirmation(null);
                    action.setNotice(
                      decision === "dismiss"
                        ? "Report dismissed."
                        : "Reported post removed from member view.",
                    );
                    await page.refresh();
                  });
                }}
              />
            )}
          </View>
        </Card>
      ))}
      <PageControls page={page} empty={`No ${status} community reports.`} />
    </View>
  );
}

function StaffCommunity() {
  const [status, setStatus] = useState<"open" | "resolved">("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  return (
    <View style={{ gap: 16 }}>
      <T variant="h2">Community moderation</T>
      <Notice>
        Review real member reports. Staff can access circle posts and membership
        aliases for moderation. Review is manual, not continuous; these controls
        do not send email or provide clinical monitoring.
      </Notice>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Chip
          label="Open reports"
          active={status === "open"}
          onPress={() => setStatus("open")}
        />
        <Chip
          label="Resolved reports"
          active={status === "resolved"}
          onPress={() => setStatus("resolved")}
        />
      </View>
      <ReportList
        key={`${status}:${version}`}
        status={status}
        onOpen={setSelectedId}
      />
      <Sheet
        visible={selectedId !== null}
        title="Community moderation · circle"
        onClose={() => {
          setSelectedId(null);
          setVersion((old) => old + 1);
        }}
      >
        {selectedId && (
          <CircleDetail
            key={selectedId}
            id={selectedId}
            onChanged={() => setVersion((old) => old + 1)}
          />
        )}
      </Sheet>
    </View>
  );
}

export function CommunityModerationPanel() {
  const { user, sessionLoading } = useHealthcare();
  if (sessionLoading || user?.role !== "staff") return null;
  return <StaffCommunity key={user.id} />;
}
