import React, { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import {
  Button,
  colors,
  Icon,
  Notice,
  Sheet,
  T,
  TextField,
  Choice,
} from "../ui";
import { AccountAccess } from "./AccountPanel";
import { request, useHealthcare } from "./client";
import type { Inquiry } from "./types";

function InquiryForm({
  providerId,
  offeringId,
}: {
  providerId: string;
  offeringId?: string;
}) {
  const { catalog, user, closeInquiry } = useHealthcare();
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Inquiry | null>(null);
  const provider = catalog?.providers.find((item) => item.id === providerId);
  const offering = catalog?.offerings.find(
    (item) => item.id === offeringId && item.providerId === providerId,
  );
  const treatment = catalog?.treatments.find(
    (item) => item.id === offering?.treatmentId,
  );
  async function submit() {
    if (!user || !consent || message.trim().length < 10 || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await request<Inquiry>("/inquiries", {
        method: "POST",
        body: {
          providerId,
          ...(offeringId ? { offeringId } : {}),
          message: message.trim(),
          consent: true,
        },
      });
      setReceipt(response);
      setMessage("");
      setConsent(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The inquiry could not be stored. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <View style={{ gap: 16 }}>
        <T variant="h3">Received by the directory team</T>
        <T selectable>Server reference: {receipt.id}</T>
        <Notice>
          Your question about {receipt.providerName} was stored in the
          AbroadMedClub operator inbox. It was not sent to the clinic. No
          appointment, quotation or medical review has been arranged.
        </Notice>
        <T>
          Open Messages to view the private conversation and any directory-team
          replies. No email notification or response time is promised.
        </T>
        <Button label="Done" onPress={closeInquiry} />
      </View>
    );
  if (!provider || (offeringId && !offering))
    return (
      <View style={{ gap: 16 }}>
        <Notice>
          This provider or service is no longer available for directory
          inquiries. Close this dialog and refresh the directory.
        </Notice>
        <Button label="Close" onPress={closeInquiry} />
      </View>
    );
  return (
    <View style={{ gap: 16 }}>
      <T variant="h3">About {provider.name}</T>
      <T variant="small">
        {provider.city},{" "}
        {catalog?.countries.find(
          (country) => country.code === provider.countryCode,
        )?.name ?? provider.countryCode}
        {treatment ? ` · ${treatment.name}` : ""}
      </T>
      <Notice>
        Recipient: AbroadMedClub directory team — NOT {provider.name}. This is
        an independent directory inquiry, not a message to the clinic or a
        booking request.
      </Notice>
      <TextField
        label="Your directory question (10–2000 characters)"
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={2000}
        editable={!busy}
        placeholder="Ask about the listing, official contact route or published service information."
      />
      <T variant="small">
        {message.length}/2000 characters. Do not include symptoms, medical
        history, records, identification documents or payment details. For
        emergencies, contact local emergency services.
      </T>
      <Choice
        role="checkbox"
        checked={consent}
        accessibilityLabel="I consent to storing this question in my private directory-team inbox"
        disabled={busy}
        onPress={() => setConsent((value) => !value)}
        style={{
          flexDirection: "row",
          gap: 10,
          alignItems: "flex-start",
          paddingVertical: 8,
        }}
      >
        <Icon name={consent ? "CheckCircle2" : "Circle"} color={colors.teal} />
        <T variant="small" style={{ flex: 1 }}>
          I consent to storing this question with my account in the private
          AbroadMedClub directory-team inbox. I understand it is not sent to the
          provider and contains no medical records.
        </T>
      </Choice>
      {error ? (
        <T accessibilityRole="alert" style={{ color: colors.red }}>
          {error}
        </T>
      ) : null}
      <Button
        label={
          busy ? "Submitting to operator inbox…" : "Send to directory team"
        }
        onPress={submit}
        disabled={busy || !consent || message.trim().length < 10}
      />
      <Button
        label="Cancel"
        variant="ghost"
        onPress={closeInquiry}
        disabled={busy}
      />
      {busy && (
        <T variant="small">
          Wait for the server reference before submitting again. Closing this
          window does not cancel a request already sent.
        </T>
      )}
    </View>
  );
}

export function InquirySheet() {
  const {
    inquiryTarget,
    closeInquiry,
    user,
    sessionLoading,
    catalog,
    loading,
    error,
    refreshCatalog,
  } = useHealthcare();
  const providerName = catalog?.providers.find(
    (provider) => provider.id === inquiryTarget?.providerId,
  )?.name;
  return (
    <Sheet
      visible={!!inquiryTarget}
      onClose={closeInquiry}
      title="Ask the directory team"
      subtitle="Private operator inquiry · no clinic delivery"
    >
      {inquiryTarget && (
        <Notice>
          Recipient: AbroadMedClub directory team, not the clinic.{" "}
          {providerName
            ? `Your question concerns ${providerName}.`
            : "Provider context will load before you can submit."}
        </Notice>
      )}
      {inquiryTarget &&
        (sessionLoading ? (
          <ActivityIndicator
            color={colors.teal}
            accessibilityLabel="Checking account session"
          />
        ) : !user ? (
          <>
            <Notice>
              Sign in to keep this conversation private. After signing in, you
              can write your question.
            </Notice>
            <AccountAccess />
            <Button label="Cancel" variant="ghost" onPress={closeInquiry} />
          </>
        ) : !catalog ? (
          <>
            <T>
              {loading
                ? "Loading provider context…"
                : (error ?? "Provider context is unavailable.")}
            </T>
            <Button
              label="Retry loading directory"
              onPress={() => {
                void refreshCatalog();
              }}
              disabled={loading}
            />
            <Button label="Cancel" variant="ghost" onPress={closeInquiry} />
          </>
        ) : (
          <InquiryForm
            key={`${user.id}:${inquiryTarget.providerId}:${inquiryTarget.offeringId ?? ""}`}
            providerId={inquiryTarget.providerId}
            offeringId={inquiryTarget.offeringId}
          />
        ))}
    </Sheet>
  );
}
