import { Badge, Button, Segmented, SelectRow, Sheet, SheetHeader } from "@/components/ui";
import { palette, type StatusTone } from "@/constants/theme";
import { type } from "@/constants/type";
import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { Issue } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  issue: Issue | null;
  visible: boolean;
  onClose: () => void;
};

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

function severityTone(v?: Issue["severity"]): StatusTone {
  return v === "high" || v === "critical" ? "danger" : v === "medium" ? "warn" : "neutral";
}

function formatOpened(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function IssueDetailModal({ issue, visible, onClose }: Props) {
  const api = useApi();
  const qc = useQueryClient();
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
      qc.invalidateQueries({ queryKey: ["issues"] });
      onClose();
    },
  });

  const unitOptions = useMemo(
    () => [
      { value: null as string | null, label: "Unassigned" },
      ...(unitsQuery.data ?? []).map((u) => ({ value: u.id as string | null, label: u.name })),
    ],
    [unitsQuery.data]
  );
  // Only tenants of the chosen unit (plus whoever is already selected).
  const tenantOptions = useMemo(
    () => [
      { value: null as string | null, label: "Unassigned" },
      ...(tenantsQuery.data ?? [])
        .filter((t) => !unitId || t.unit_id === unitId || t.id === tenantId)
        .map((t) => ({ value: t.id as string | null, label: t.full_name })),
    ],
    [tenantsQuery.data, unitId, tenantId]
  );

  const blocked = !!mismatch || !!titleError || updateMutation.isPending;
  const opened = formatOpened(issue?.created_at);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      header={
        <SheetHeader
          label="Issue"
          onClose={onClose}
          right={
            issue ? (
              <Badge
                label={issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                tone={severityTone(issue.severity)}
                style={{ alignSelf: "center" }}
              />
            ) : null
          }
        />
      }
      footer={
        <Button
          label={updateMutation.isPending ? "Saving..." : "Save changes"}
          full
          disabled={blocked}
          onPress={() => !mismatch && !titleError && updateMutation.mutate()}
        />
      }
    >
      <TextInput
        style={[styles.title, Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : null]}
        placeholder="Issue title"
        placeholderTextColor={palette.faint}
        accessibilityLabel="Issue title"
        value={title}
        onChangeText={setTitle}
        editable={!updateMutation.isPending}
      />
      {!!titleError && <Text style={styles.error}>{titleError}</Text>}
      {!!issue?.description && <Text style={styles.desc}>{issue.description}</Text>}
      {opened ? <Text style={styles.meta}>Opened {opened}</Text> : null}

      <Text style={styles.label}>Status</Text>
      <Segmented
        options={STATUSES}
        value={status}
        onChange={setStatus}
        disabled={updateMutation.isPending}
      />

      <View style={styles.group}>
        <SelectRow
          label="Unit"
          options={unitOptions}
          value={unitId ?? null}
          onChange={(v) => {
            setUnitId(v);
            // Drop a tenant who doesn't live in the newly chosen unit.
            const t = tenantsQuery.data?.find((x) => x.id === tenantId);
            if (v && t?.unit_id && t.unit_id !== v) setTenantId(null);
          }}
        />
        <SelectRow
          label="Tenant"
          options={tenantOptions}
          value={tenantId ?? null}
          onChange={setTenantId}
          last
        />
      </View>
      {!!mismatch && <Text style={styles.error}>{mismatch}</Text>}
      {!!updateMutation.error && (
        <Text style={styles.error}>{(updateMutation.error as Error).message}</Text>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { ...type.title, color: palette.ink, paddingVertical: 4, paddingHorizontal: 0, height: 36 },
  desc: { ...type.body, color: palette.inkSoft, marginTop: 4 },
  meta: { ...type.caption, color: palette.muted, marginTop: 6 },
  label: { ...type.section, color: palette.muted, marginTop: 20, marginBottom: 8 },
  group: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  error: { ...type.caption, color: "#b42318", marginTop: 6 },
});
