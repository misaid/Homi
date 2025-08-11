import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { Issue } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import * as RN from "react-native";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type CreateIssueModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: (issue: Issue) => void;
};

export default function CreateIssueModal({
  visible,
  onClose,
  onCreated,
}: CreateIssueModalProps) {
  const api = useApi();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("low");
  const [unitId, setUnitId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const unitsQuery = useQuery({
    queryKey: qk.unitsAll,
    queryFn: () =>
      api.get<{ items: Array<{ id: string; name: string }> }>(
        `/api/v1/units?page=1&limit=1000`
      ),
    select: (d) => d.items,
    enabled: visible,
    staleTime: 60_000,
  });

  const tenantsQuery = useQuery({
    queryKey: qk.tenantsForUnit(unitId),
    queryFn: () =>
      api.get<{
        items: Array<{
          id: string;
          full_name: string;
          unit_id?: string | null;
        }>;
      }>(
        `/api/v1/tenants?page=1&limit=1000${unitId ? `&unit_id=${unitId}` : ""}`
      ),
    select: (d) => d.items,
    enabled: visible,
    staleTime: 60_000,
  });

  const titleError = useMemo(() => {
    const t = title.trim();
    if (!t) return "Title is required";
    if (t.length > 120) return "Max 120 characters";
    return null;
  }, [title]);

  const canSubmit = useMemo(() => !titleError, [titleError]);
  const mismatch = useMemo(() => {
    if (!unitId || !tenantId) return null;
    const t = tenantsQuery.data?.find((x) => x.id === tenantId);
    if (!t) return null;
    if (t.unit_id && t.unit_id !== unitId)
      return "Selected tenant belongs to another unit";
    return null;
  }, [unitId, tenantId, tenantsQuery.data]);

  const mutation = useMutation({
    mutationFn: async () =>
      api.post<Issue>("/api/v1/issues", {
        title: title.trim(),
        description: description.trim() || undefined,
        severity,
        unit_id: unitId,
        tenant_id: tenantId,
      }),
    onSuccess: (created) => {
      setTitle("");
      setDescription("");
      setSeverity("low");
      setUnitId(null);
      setTenantId(null);
      onCreated(created);
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to create issue";
      if (RN.Platform.OS === "android") {
        RN.ToastAndroid?.show(msg, RN.ToastAndroid.SHORT);
      } else {
        RN.Alert.alert("Error", msg);
      }
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>New Issue</Text>

          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            editable={!mutation.isPending}
            autoFocus
          />
          {!!titleError && <Text style={styles.errorText}>{titleError}</Text>}

          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            editable={!mutation.isPending}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Severity</Text>
          <View style={styles.row}>
            {(["low", "medium", "high"] as const).map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setSeverity(opt)}
                style={[
                  styles.chip,
                  severity === opt ? styles.chipActive : null,
                ]}
                disabled={mutation.isPending}
              >
                <Text
                  style={[
                    styles.chipText,
                    severity === opt ? styles.chipTextActive : null,
                  ]}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Unit</Text>
          <View style={styles.rowWrap}>
            <Pressable
              onPress={() => setUnitId(null)}
              style={[styles.chip, unitId == null ? styles.chipActive : null]}
            >
              <Text
                style={[
                  styles.chipText,
                  unitId == null ? styles.chipTextActive : null,
                ]}
              >
                Unassigned
              </Text>
            </Pressable>
            {unitsQuery.data?.map((u) => (
              <Pressable
                key={u.id}
                onPress={() => setUnitId(u.id)}
                style={[
                  styles.chip,
                  unitId === u.id ? styles.chipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    unitId === u.id ? styles.chipTextActive : null,
                  ]}
                >
                  {u.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Tenant</Text>
          <View style={styles.rowWrap}>
            <Pressable
              onPress={() => setTenantId(null)}
              style={[styles.chip, tenantId == null ? styles.chipActive : null]}
            >
              <Text
                style={[
                  styles.chipText,
                  tenantId == null ? styles.chipTextActive : null,
                ]}
              >
                Unassigned
              </Text>
            </Pressable>
            {tenantsQuery.data?.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setTenantId(t.id)}
                style={[
                  styles.chip,
                  tenantId === t.id ? styles.chipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    tenantId === t.id ? styles.chipTextActive : null,
                  ]}
                >
                  {t.full_name}
                </Text>
              </Pressable>
            ))}
          </View>
          {!!mismatch && <Text style={styles.errorText}>{mismatch}</Text>}

          <View
            style={[styles.row, { justifyContent: "flex-end", marginTop: 12 }]}
          >
            <Pressable
              onPress={onClose}
              style={[styles.btn, styles.btnGhost]}
              disabled={mutation.isPending}
            >
              <Text style={[styles.btnText, styles.btnGhostText]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                !mutation.isPending &&
                canSubmit &&
                !mismatch &&
                mutation.mutate()
              }
              style={[
                styles.btn,
                styles.btnPrimary,
                !canSubmit || !!mismatch || mutation.isPending
                  ? styles.btnDisabled
                  : null,
              ]}
              disabled={!canSubmit || !!mismatch || mutation.isPending}
              accessibilityLabel="Submit new issue"
            >
              <Text style={styles.btnText}>
                {mutation.isPending ? "Creating..." : "Create"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    width: "100%",
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  label: { fontSize: 12, color: "#374151", marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  textarea: { minHeight: 72, textAlignVertical: "top" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipActive: { backgroundColor: "#0a7ea4", borderColor: "#0a7ea4" },
  chipText: { fontSize: 12, color: "#111827" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  btnPrimary: { backgroundColor: "#0a7ea4" },
  btnGhost: {
    backgroundColor: "#f3f4f6",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  btnGhostText: { color: "#111827" },
  btnDisabled: { opacity: 0.6 },
  errorText: { color: "#ef4444", marginTop: 4 },
});
