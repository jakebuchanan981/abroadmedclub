import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { request, useHealthcare } from "../../healthcare/client";
import {
  Button,
  Chip,
  colors,
  Icon,
  Notice,
  Sheet,
  T,
  TextField,
  Choice,
} from "../../ui";
import type { PageResult } from "../types";

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The request could not be completed. Please retry.";
}

export function useAction() {
  const lock = useRef(false);
  const live = useRef(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const run = async (work: () => Promise<void>) => {
    if (lock.current || !live.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
    } catch (failure) {
      if (live.current) setError(errorMessage(failure));
    } finally {
      lock.current = false;
      if (live.current) setBusy(false);
    }
  };
  return { busy, error, notice, setNotice, run };
}

export function ActionStatus({
  busy,
  error,
  notice,
}: {
  busy: boolean;
  error: string;
  notice?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      {busy && <ActivityIndicator accessibilityLabel="Request in progress" />}
      {!!error && <Notice>{error}</Notice>}
      {!!notice && <T accessibilityLiveRegion="polite">{notice}</T>}
    </View>
  );
}

export function Consent({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Choice
      role="checkbox"
      checked={checked}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={{ paddingVertical: 10, flexDirection: "row", gap: 10 }}
    >
      <Icon name={checked ? "CheckCircle2" : "Circle"} color={colors.teal} />
      <T style={{ flex: 1 }}>{label}</T>
    </Choice>
  );
}

export function Confirm({
  title,
  description,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Notice>{description}</Notice>
      <Button
        label={busy ? "Working…" : title}
        disabled={busy}
        onPress={onConfirm}
      />
      <Button
        label="Cancel"
        variant="ghost"
        disabled={busy}
        onPress={onCancel}
      />
    </View>
  );
}

export function CountryChoice({
  value,
  onChange,
  allowAll = false,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  allowAll?: boolean;
  disabled?: boolean;
}) {
  const { catalog, loading, error, refreshCatalog } = useHealthcare();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const countries = catalog?.countries ?? [];
  return (
    <View style={{ gap: 8 }}>
      <Button
        label={`Country: ${countries.find((country) => country.code === value)?.name ?? (allowAll ? "All countries" : "Choose country")}`}
        variant="secondary"
        disabled={disabled}
        onPress={() => setOpen(true)}
      />
      <Sheet
        visible={open}
        title="Choose a country"
        onClose={() => setOpen(false)}
      >
        <TextField label="Find country" value={query} onChangeText={setQuery} />
        {loading && <ActivityIndicator />}
        {error && <Notice>{error}</Notice>}
        {!catalog && (
          <Button
            label="Retry country catalog"
            onPress={() => {
              void refreshCatalog();
            }}
          />
        )}
        {allowAll && (
          <Chip
            label="All countries"
            active={!value}
            onPress={() => {
              onChange("");
              setOpen(false);
            }}
          />
        )}
        {countries
          .filter(
            (country) =>
              country.name
                .toLocaleLowerCase()
                .includes(query.toLocaleLowerCase()) ||
              country.code
                .toLocaleLowerCase()
                .includes(query.toLocaleLowerCase()),
          )
          .map((country) => (
            <Chip
              key={country.code}
              label={country.name}
              active={value === country.code}
              onPress={() => {
                onChange(country.code);
                setOpen(false);
              }}
            />
          ))}
      </Sheet>
    </View>
  );
}

export function useCommunityPage<T>(path: string) {
  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const live = useRef(true);
  const sequence = useRef(0);
  const pending = useRef(false);
  const load = useCallback(
    async (cursor: string | null = null) => {
      if (!live.current || (cursor && pending.current)) return;
      const revision = ++sequence.current;
      pending.current = true;
      setLoading(true);
      setError("");
      if (!cursor) {
        setItems([]);
        setNextCursor(null);
      }
      try {
        const page = await request<PageResult<T>>(
          `${path}${cursor ? `${path.includes("?") ? "&" : "?"}cursor=${encodeURIComponent(cursor)}` : ""}`,
        );
        if (!live.current || revision !== sequence.current) return;
        setItems((old) => (cursor ? [...old, ...page.items] : page.items));
        setNextCursor(page.nextCursor);
      } catch (failure) {
        if (live.current && revision === sequence.current)
          setError(errorMessage(failure));
      } finally {
        if (live.current && revision === sequence.current) {
          setLoading(false);
          pending.current = false;
        }
      }
    },
    [path],
  );
  useEffect(() => {
    live.current = true;
    void load();
    return () => {
      live.current = false;
      sequence.current += 1;
    };
  }, [load]);
  return {
    items,
    nextCursor,
    loading,
    error,
    refresh: () => load(),
    more: () => load(nextCursor),
  };
}

export function PageControls({
  page,
  empty,
}: {
  page: {
    items: unknown[];
    nextCursor: string | null;
    loading: boolean;
    error: string;
    refresh: () => Promise<void>;
    more: () => Promise<void>;
  };
  empty: string;
}) {
  return (
    <View style={{ gap: 10 }}>
      {page.loading && (
        <ActivityIndicator accessibilityLabel="Loading community records" />
      )}
      {!!page.error && <Notice>{page.error}</Notice>}
      {!page.loading && !page.error && page.items.length === 0 && (
        <T>{empty}</T>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Button
          label={page.error ? "Retry / refresh" : "Refresh"}
          variant="secondary"
          disabled={page.loading}
          onPress={() => {
            void page.refresh();
          }}
        />
        {page.nextCursor && (
          <Button
            label={page.error ? "Retry load more" : "Load more"}
            disabled={page.loading}
            onPress={() => {
              void page.more();
            }}
          />
        )}
      </View>
    </View>
  );
}
