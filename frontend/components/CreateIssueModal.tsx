import { Button, Field, Segmented, SelectRow, Sheet, SheetHeader } from "@/components/ui";
import { palette } from "@/constants/theme";
import { type } from "@/constants/type";
import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { Issue } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import * as RN from "react-native";
import { StyleSheet, Text, View } from "react-native";

type CreateIssueModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: (issue: Issue) => void;
};

const SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

export default function CreateIssueModal({
  visible,
  onClose,
  onCreated,
}: CreateIssueModalProps) {
  const api = useApi();
  const [title, setTitle] = useState("");
  const [touched, setTouched] = useState(false);
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
      setTouched(false);
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

  const blocked = !canSubmit || !!mismatch || mutation.isPending;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      header={<SheetHeader label="New issue" onClose={onClose} />}
      footer={
        <Button
          label={mutation.isPending ? "Creating..." : "Create issue"}
          accessibilityLabel="Submit new issue"
          full
          disabled={blocked}
          onPress={() => {
            setTouched(true);
            if (!blocked) mutation.mutate();
          }}
        />
      }
    >
      <View style={{ marginTop: 4 }}>
        <Field
          label="Title"
          placeholder="What needs attention?"
          value={title}
          onChangeText={setTitle}
          onBlur={() => setTouched(true)}
          editable={!mutation.isPending}
          error={touched ? titleError : null}
          autoFocus
        />
        <Field
          label="Description"
          placeholder="Optional details"
          value={description}
          onChangeText={setDescription}
          editable={!mutation.isPending}
          multiline
          numberOfLines={3}
        />
      </View>

      <Text style={styles.label}>Severity</Text>
      <Segmented
        options={SEVERITIES}
        value={severity}
        onChange={setSeverity}
        disabled={mutation.isPending}
      />

      <View style={styles.group}>
        <SelectRow
          label="Unit"
          options={unitOptions}
          value={unitId}
          onChange={(v) => {
            setUnitId(v);
            const t = tenantsQuery.data?.find((x) => x.id === tenantId);
            if (v && t?.unit_id && t.unit_id !== v) setTenantId(null);
          }}
        />
        <SelectRow
          label="Tenant"
          options={tenantOptions}
          value={tenantId}
          onChange={setTenantId}
          last
        />
      </View>
      {!!mismatch && <Text style={styles.error}>{mismatch}</Text>}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  label: { ...type.section, color: palette.muted, marginBottom: 8 },
  group: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  error: { ...type.caption, color: "#b42318", marginTop: 6 },
});
