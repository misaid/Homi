import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { Issue } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = {
  issue: Issue | null;
  visible: boolean;
  onClose: () => void;
};

export default function IssueDetailModal({ issue, visible, onClose }: Props) {
  const api = useApi();
  const qc = useQueryClient();
  const colorScheme = useColorScheme();
  const cardBg = Colors[colorScheme ?? "light"].card;
  const border = Colors[colorScheme ?? "light"].border;
  const textColor = Colors[colorScheme ?? "light"].text;
  const mutedText = Colors[colorScheme ?? "light"].mutedText;
  const [title, setTitle] = useState<string>(issue?.title ?? "");
  const [status, setStatus] = useState<Issue["status"]>(
    issue?.status ?? "open"
  );
  const [unitId, setUnitId] = useState<string | null | undefined>(
    issue?.unit_id
  );
  const [tenantId, setTenantId] = useState<string | null | undefined>(
    issue?.tenant_id
  );

  // Sync local state when the modal opens for a different issue
  useEffect(() => {
    if (!visible) return;
    setTitle(issue?.title ?? "");
    setStatus(issue?.status ?? "open");
    setUnitId(issue?.unit_id);
    setTenantId(issue?.tenant_id);
  }, [issue?.id, visible]);

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
    queryKey: qk.tenantsForUnit(unitId ?? null),
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
    const t = (title ?? "").trim();
    if (!t) return "Title is required";
    if (t.length > 120) return "Max 120 characters";
    return null;
  }, [title]);

  const mismatch = useMemo(() => {
    if (!unitId || !tenantId) return null;
    const t = tenantsQuery.data?.find((x) => x.id === tenantId);
    if (!t) return null;
    if (t.unit_id && t.unit_id !== unitId)
      return "Selected tenant belongs to another unit";
    return null;
  }, [unitId, tenantId, tenantsQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch<Issue>(`/api/v1/issues/${issue?.id}`, {
        title: title.trim(),
        status,
        unit_id: unitId ?? null,
        tenant_id: tenantId ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.issues({}) as any });
      onClose();
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
        <View
          style={[
            styles.card,
            styles.responsiveCard,
            { backgroundColor: cardBg },
          ]}
        >
          <Text style={[styles.label, { color: mutedText }]}>Title</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: border,
                backgroundColor: cardBg,
                color: textColor,
              },
            ]}
            placeholder="Title"
            placeholderTextColor={mutedText}
            value={title}
            onChangeText={setTitle}
            editable={!updateMutation.isPending}
          />
          {!!titleError && <Text style={styles.error}>{titleError}</Text>}
          {!!issue?.description && (
            <Text
              style={[
                styles.desc,
                { color: Colors[colorScheme ?? "light"].mutedText },
              ]}
            >
              {issue?.description}
            </Text>
          )}

          <Text
            style={[
              styles.label,
              { color: Colors[colorScheme ?? "light"].mutedText },
            ]}
          >
            Status
          </Text>
          <View style={styles.row}>
            {(["open", "in_progress", "resolved", "closed"] as const).map(
              (st) => (
                <Pressable
                  key={st}
                  onPress={() => setStatus(st)}
                  style={[
                    styles.chip,
                    status === st ? styles.chipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      status === st ? styles.chipTextActive : null,
                    ]}
                  >
                    {st === "in_progress"
                      ? "In progress"
                      : st.charAt(0).toUpperCase() + st.slice(1)}
                  </Text>
                </Pressable>
              )
            )}
          </View>

          <Text
            style={[
              styles.label,
              { color: Colors[colorScheme ?? "light"].mutedText },
            ]}
          >
            Unit
          </Text>
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

          <Text
            style={[
              styles.label,
              { color: Colors[colorScheme ?? "light"].mutedText },
            ]}
          >
            Tenant
          </Text>
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
          {!!mismatch && <Text style={styles.error}>{mismatch}</Text>}

          <View
            style={[styles.row, { justifyContent: "flex-end", marginTop: 12 }]}
          >
            <Pressable
              onPress={onClose}
              style={[styles.btn, styles.btnGhost]}
              disabled={updateMutation.isPending}
            >
              <Text style={[styles.btnText, styles.btnGhostText]}>Close</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                !mismatch && !titleError && updateMutation.mutate()
              }
              disabled={!!mismatch || !!titleError || updateMutation.isPending}
              style={[
                styles.btn,
                styles.btnPrimary,
                !!mismatch || !!titleError || updateMutation.isPending
                  ? styles.btnDisabled
                  : null,
              ]}
            >
              <Text style={styles.btnText}>
                {updateMutation.isPending ? "Saving..." : "Save"}
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
  responsiveCard: {
    maxWidth: 560,
    alignSelf: "center",
  },
  desc: { fontSize: 14, color: "#374151", marginBottom: 12 },
  label: { fontSize: 12, color: "#374151", marginTop: 8, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
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
  error: { color: "#ef4444", marginTop: 4 },
});
