import React, { useState } from "react";
import { View } from "react-native";
import { request } from "../../healthcare/client";
import { Button, Notice, T, TextField } from "../../ui";
import { useCommunity } from "../CommunityProvider";
import type { Circle } from "../types";
import { ActionStatus, Consent, CountryChoice, useAction } from "./shared";

export function MembershipForm({
  circle,
  onSaved,
}: {
  circle: Circle;
  onSaved: (circle: Circle) => void;
}) {
  const { refreshMemberships } = useCommunity();
  const [alias, setAlias] = useState(circle.myMembership?.alias ?? "");
  const [allowMessages, setAllowMessages] = useState(
    circle.myMembership?.allowMessages ?? false,
  );
  const [consent, setConsent] = useState(false);
  const action = useAction();
  return (
    <View style={{ gap: 12 }}>
      <T variant="h3">
        {circle.myMembership ? "Your circle identity" : "Join on your terms"}
      </T>
      <Notice>
        Your alias is visible to circle members and moderators, not your account
        name or email. Posts are visible to active members and staff. Do not
        share sensitive medical information or another person's details.
      </Notice>
      <TextField
        label="Circle alias (not your account name)"
        value={alias}
        onChangeText={setAlias}
        editable={!action.busy}
        maxLength={60}
      />
      <Consent
        checked={allowMessages}
        onChange={setAllowMessages}
        disabled={action.busy}
        label="Allow active members of this open circle to start a private conversation with me. Existing conversations remain available if I opt out or leave."
      />
      <Consent
        checked={consent}
        onChange={setConsent}
        disabled={action.busy}
        label="I consent to account-backed membership and sharing this alias with members and moderators."
      />
      {!circle.myMembership && circle.kind === "travel" && (
        <T variant="small">
          The owner must approve your request before you can see posts or
          members.
        </T>
      )}
      <ActionStatus {...action} />
      <Button
        label={
          action.busy
            ? "Saving…"
            : circle.myMembership
              ? "Save identity and message preference"
              : circle.kind === "travel"
                ? "Request to join"
                : "Join circle"
        }
        disabled={action.busy || !consent || !alias.trim()}
        onPress={() => {
          void action.run(async () => {
            const saved = await request<Circle>(
              `/community/circles/${circle.id}/${circle.myMembership ? "membership" : "join"}`,
              {
                method: circle.myMembership ? "PATCH" : "POST",
                body: { alias: alias.trim(), allowMessages, consent: true },
              },
            );
            onSaved(saved);
            await refreshMemberships();
          });
        }}
      />
    </View>
  );
}

export interface CircleEditorPrefill {
  countryCode: string;
  city: string;
  startsOn: string;
  endsOn: string;
}

export function CircleEditor({
  circle,
  prefill,
  onSaved,
}: {
  circle?: Circle;
  prefill?: CircleEditorPrefill;
  onSaved: (circle: Circle) => void;
}) {
  const { refreshMemberships } = useCommunity();
  const [name, setName] = useState(circle?.name ?? "");
  const [description, setDescription] = useState(circle?.description ?? "");
  const [countryCode, setCountryCode] = useState(
    circle ? (circle.countryCode ?? "") : (prefill?.countryCode ?? ""),
  );
  const [city, setCity] = useState(
    circle ? (circle.city ?? "") : (prefill?.city ?? ""),
  );
  const [startsOn, setStartsOn] = useState(
    circle ? (circle.startsOn ?? "") : (prefill?.startsOn ?? ""),
  );
  const [endsOn, setEndsOn] = useState(
    circle ? (circle.endsOn ?? "") : (prefill?.endsOn ?? ""),
  );
  const [alias, setAlias] = useState("");
  const [allowMessages, setAllowMessages] = useState(false);
  const [consent, setConsent] = useState(false);
  const [revision, setRevision] = useState(circle?.updatedAt ?? "");
  const [latest, setLatest] = useState<Circle | null>(null);
  const action = useAction();
  const travel = !circle || circle.kind === "travel";
  return (
    <View style={{ gap: 12 }}>
      <Notice>
        Member-organized coordination only. This does not book travel, arrange
        care, collect payments or create a club or partner package. Circle name,
        description, location and dates are public. Keep health details out of
        public metadata.
      </Notice>
      {!circle && prefill && (
        <Notice>
          Only the country, city and dates were copied from your private account
          trip into these editable fields. The trip remains private. This
          independently created group's metadata is public and will not
          synchronize with later trip edits or deletion. Add the public name,
          description and owner choices yourself, then explicitly consent
          before creating it.
        </Notice>
      )}
      <TextField
        label="Circle name"
        value={name}
        onChangeText={setName}
        editable={!action.busy}
        maxLength={120}
      />
      <TextField
        label="Public description"
        value={description}
        onChangeText={setDescription}
        editable={!action.busy}
        multiline
        maxLength={2000}
      />
      {!circle && (
        <>
          <CountryChoice
            value={countryCode}
            onChange={setCountryCode}
            disabled={action.busy}
          />
          <TextField
            label="City"
            value={city}
            onChangeText={setCity}
            editable={!action.busy}
            maxLength={120}
          />
        </>
      )}
      {travel && (
        <>
          <TextField
            label="Starts on (YYYY-MM-DD)"
            value={startsOn}
            onChangeText={setStartsOn}
            editable={!action.busy}
            autoCapitalize="none"
            maxLength={10}
          />
          <TextField
            label="Ends on (YYYY-MM-DD)"
            value={endsOn}
            onChangeText={setEndsOn}
            editable={!action.busy}
            autoCapitalize="none"
            maxLength={10}
          />
        </>
      )}
      {!circle && (
        <>
          <TextField
            label="Your owner alias"
            value={alias}
            onChangeText={setAlias}
            editable={!action.busy}
            maxLength={60}
          />
          <Consent
            checked={allowMessages}
            onChange={setAllowMessages}
            disabled={action.busy}
            label="Allow active members to start private conversations with me."
          />
          <Consent
            checked={consent}
            onChange={setConsent}
            disabled={action.busy}
            label="I consent to publishing this group's metadata and creating my account-backed owner membership with this alias."
          />
        </>
      )}
      <ActionStatus {...action} />
      <Button
        label={
          action.busy
            ? "Saving…"
            : circle
              ? "Save metadata"
              : "Create travel coordination group"
        }
        disabled={
          action.busy ||
          !name.trim() ||
          !description.trim() ||
          (travel && (!startsOn || !endsOn)) ||
          (!circle &&
            (!countryCode || !city.trim() || !alias.trim() || !consent))
        }
        onPress={() => {
          void action.run(async () => {
            const saved = circle
              ? await request<Circle>(`/community/circles/${circle.id}`, {
                  method: "PATCH",
                  body: {
                    expectedUpdatedAt: revision,
                    patch: {
                      name: name.trim(),
                      description: description.trim(),
                      ...(travel ? { startsOn, endsOn } : {}),
                    },
                  },
                })
              : await request<Circle>("/community/circles", {
                  method: "POST",
                  body: {
                    name: name.trim(),
                    description: description.trim(),
                    countryCode,
                    city: city.trim(),
                    startsOn,
                    endsOn,
                    alias: alias.trim(),
                    allowMessages,
                    consent: true,
                  },
                });
            onSaved(saved);
            await refreshMemberships();
          });
        }}
      />
      {circle && (
        <>
          <T variant="small">
            Updates use the version you opened. If another device changed it,
            your unsaved text stays here. Review the current server version
            before choosing to overwrite it.
          </T>
          <Button
            label="Fetch latest version for comparison"
            variant="secondary"
            disabled={action.busy}
            onPress={() => {
              void action.run(async () => {
                setLatest(
                  await request<Circle>(`/community/circles/${circle.id}`),
                );
              });
            }}
          />
          {latest && (
            <View style={{ gap: 8 }}>
              <T variant="h3">Current server version</T>
              <T>{latest.name}</T>
              <T>{latest.description}</T>
              <T>
                {latest.startsOn ?? ""} – {latest.endsOn ?? ""} · {latest.state}
              </T>
              <Button
                label="Use this revision; keep my unsaved edits"
                variant="secondary"
                disabled={action.busy}
                onPress={() => {
                  setRevision(latest.updatedAt);
                  setLatest(null);
                  action.setNotice(
                    "Revision updated. Review your edits, then choose Save metadata.",
                  );
                }}
              />
            </View>
          )}
        </>
      )}
    </View>
  );
}
