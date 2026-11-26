import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Button, Card, colors, Notice, T, TextField } from "../ui";
import { request, useHealthcare } from "./client";
import { StaffConsole } from "./StaffConsole";

export function AccountAccess() {
  const { signIn, signUp, sessionLoading } = useHealthcare();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setError("");
    if (
      !email.trim() ||
      !password ||
      (mode === "register" && (!name.trim() || password.length < 12))
    ) {
      setError(
        "Enter your email and password. New accounts also need a name and a password of at least 12 characters.",
      );
      return;
    }
    setBusy(true);
    try {
      if (mode === "register")
        await signUp(name.trim(), email.trim(), password);
      else await signIn(email.trim(), password);
      setPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The request could not be completed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (sessionLoading)
    return (
      <ActivityIndicator
        accessibilityLabel="Checking account session"
        color={colors.teal}
      />
    );
  return (
    <View style={styles.form}>
      <T variant="h3">
        {mode === "register"
          ? "Create an AbroadMedClub account"
          : "Sign in to AbroadMedClub"}
      </T>
      <T variant="small">
        Keep private trip plans, opt-in circle participation, member messages
        and directory-team inquiries in your account. Guest plans stay local.
      </T>
      {mode === "register" && (
        <TextField
          label="Account name"
          value={name}
          onChangeText={setName}
          maxLength={100}
          editable={!busy}
          autoComplete="name"
        />
      )}
      <TextField
        label="Email address"
        value={email}
        onChangeText={setEmail}
        maxLength={254}
        editable={!busy}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
      />
      <TextField
        label={
          mode === "register" ? "Password (12–128 characters)" : "Password"
        }
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        maxLength={128}
        editable={!busy}
        autoCapitalize="none"
        autoComplete={mode === "register" ? "new-password" : "current-password"}
      />
      {error ? (
        <T accessibilityRole="alert" style={styles.error}>
          {error}
        </T>
      ) : null}
      <Button
        label={
          busy
            ? "Please wait…"
            : mode === "register"
              ? "Create account"
              : "Sign in"
        }
        onPress={submit}
        disabled={busy}
      />
      <Button
        variant="ghost"
        label={
          mode === "register"
            ? "Use an existing account"
            : "Create an account instead"
        }
        disabled={busy}
        onPress={() => {
          setMode(mode === "login" ? "register" : "login");
          setPassword("");
          setError("");
        }}
      />
      <T variant="small">
        No password-reset email service is configured. Never share your password
        with the directory team.
      </T>
    </View>
  );
}

function AccountManagement() {
  const { user, signOut, deleteAccount } = useHealthcare();
  const [mode, setMode] = useState<"none" | "password" | "delete">("none");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const cancel = () => {
    setMode("none");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmation("");
    setError("");
  };
  async function act(action: "logout" | "password" | "delete") {
    setError("");
    setNotice("");
    if (
      action !== "logout" &&
      (!currentPassword ||
        (action === "password" && newPassword.length < 12) ||
        (action === "delete" && confirmation !== "DELETE"))
    ) {
      setError(
        action === "password"
          ? "Enter your current password and a new password of at least 12 characters."
          : "Enter your password and type DELETE to confirm.",
      );
      return;
    }
    setBusy(true);
    try {
      if (action === "logout") await signOut();
      if (action === "password") {
        await request("/auth/password", {
          method: "PATCH",
          body: { currentPassword, newPassword },
        });
        cancel();
        setNotice("Password changed. Other sessions have been signed out.");
      }
      if (action === "delete") {
        await deleteAccount(currentPassword);
        cancel();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The request could not be completed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={styles.form}>
      <T variant="eyebrow">AbroadMedClub account</T>
      <T variant="h3">{user?.name}</T>
      <T>{user?.email}</T>
      <Notice>
        Your account supports private planning, opt-in communities and directory
        inquiries. It does not create a clinic account or patient–clinician
        relationship. Device-local plans and preferences remain when you sign
        out or delete the account.
      </Notice>
      {notice ? <T accessibilityLiveRegion="polite">{notice}</T> : null}
      {error ? (
        <T accessibilityRole="alert" style={styles.error}>
          {error}
        </T>
      ) : null}
      {mode === "none" ? (
        <View style={styles.actions}>
          <Button
            label="Change password"
            variant="secondary"
            onPress={() => setMode("password")}
            disabled={busy}
          />
          <Button
            label={busy ? "Signing out…" : "Sign out"}
            variant="secondary"
            onPress={() => act("logout")}
            disabled={busy}
          />
          <Button
            label="Delete account"
            variant="ghost"
            onPress={() => setMode("delete")}
            disabled={busy}
          />
        </View>
      ) : (
        <View style={styles.form}>
          <T variant="h3">
            {mode === "delete"
              ? "Permanently delete account?"
              : "Change your password"}
          </T>
          {mode === "delete" && (
            <Notice>
              This permanently removes your account, sessions, account trip
              plans, memberships, posts and directory inquiries. Travel groups
              you created and their discussions are removed, along with both
              sides of your private member conversations and related reports or
              blocks. Device originals and separate support/application
              submissions are not deleted. This cannot be undone.
            </Notice>
          )}
          <TextField
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            maxLength={128}
            autoComplete="current-password"
            editable={!busy}
          />
          {mode === "password" ? (
            <TextField
              label="New password (12–128 characters)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              maxLength={128}
              autoComplete="new-password"
              editable={!busy}
            />
          ) : (
            <TextField
              label="Type DELETE to confirm"
              value={confirmation}
              onChangeText={setConfirmation}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!busy}
            />
          )}
          <Button
            label={
              busy
                ? "Saving…"
                : mode === "delete"
                  ? "Permanently delete my account"
                  : "Save new password"
            }
            disabled={busy}
            onPress={() => act(mode)}
          />
          <Button
            label="Cancel"
            variant="ghost"
            onPress={cancel}
            disabled={busy}
          />
        </View>
      )}
    </View>
  );
}

export function AccountPanel() {
  const { user, sessionLoading } = useHealthcare();
  return (
    <View style={styles.panel}>
      <Card style={styles.card}>
        {sessionLoading ? (
          <ActivityIndicator
            accessibilityLabel="Loading session"
            color={colors.teal}
          />
        ) : user ? (
          <AccountManagement key={user.id} />
        ) : (
          <AccountAccess />
        )}
      </Card>
      {!sessionLoading && user?.role === "staff" && (
        <StaffConsole key={user.id} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 20, marginBottom: 24 },
  card: { padding: 24, gap: 16 },
  form: { gap: 14 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  error: { color: colors.red },
});
