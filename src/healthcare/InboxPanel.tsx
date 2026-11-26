import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Button, Card, colors, Notice, T } from "../ui";
import { AccountAccess } from "./AccountPanel";
import { request, useHealthcare } from "./client";
import type { Inquiry } from "./types";
import { InquiryThread } from "./StaffConsole";

function PrivateInbox() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    request<Inquiry[]>("/inquiries")
      .then((result) => {
        if (active) setInquiries(result);
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error ? err.message : "Could not load your inbox.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reload]);
  if (selected)
    return (
      <InquiryThread
        key={selected}
        id={selected}
        onBack={() => {
          setSelected(null);
          setReload((value) => value + 1);
        }}
        onChange={(updated) =>
          setInquiries((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          )
        }
      />
    );
  return (
    <View style={styles.stack}>
      <Button
        label="Refresh inbox"
        variant="secondary"
        onPress={() => setReload((value) => value + 1)}
        disabled={loading}
      />
      {loading ? (
        <ActivityIndicator
          color={colors.teal}
          accessibilityLabel="Loading private inbox"
        />
      ) : error ? (
        <T accessibilityRole="alert" style={styles.error}>
          {error}
        </T>
      ) : inquiries.length === 0 ? (
        <Notice>
          No directory inquiries yet. Open a provider listing and choose to ask
          the directory team a question. Your private conversations will appear
          here.
        </Notice>
      ) : (
        inquiries.map((inquiry) => (
          <Card key={inquiry.id} style={styles.item}>
            <T variant="h3">{inquiry.providerName}</T>
            <T variant="small">
              {inquiry.status} · Updated{" "}
              {new Date(inquiry.updatedAt).toLocaleString()}
            </T>
            <T variant="small">Reference {inquiry.id}</T>
            <Button
              label="Open private conversation"
              variant="secondary"
              onPress={() => setSelected(inquiry.id)}
            />
          </Card>
        ))
      )}
    </View>
  );
}

export function InboxPanel() {
  const { user, sessionLoading } = useHealthcare();
  return (
    <Card style={styles.panel}>
      <T variant="eyebrow">Private operator inbox</T>
      <T variant="h2">Your directory conversations</T>
      <T>
        Messages here reach the AbroadMedClub directory team only. They do not
        request a medical consultation, send information to a clinic or book
        care.
      </T>
      {sessionLoading ? (
        <ActivityIndicator
          color={colors.teal}
          accessibilityLabel="Checking session"
        />
      ) : user ? (
        <PrivateInbox key={user.id} />
      ) : (
        <AccountAccess />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 24, gap: 16, marginBottom: 24 },
  stack: { gap: 14 },
  item: { padding: 18, gap: 10 },
  error: { color: colors.red },
});
