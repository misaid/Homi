import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  SectionHeader,
  Sheet,
  SheetAction,
  SheetHeader,
} from "@/components/ui";
import { palette, radius } from "@/constants/theme";
import { font, type } from "@/constants/type";
import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { Paginated, Tenant, Unit } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  monthly_rent: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .refine((n) => Number.isFinite(n) && n > 0, {
      message: "Monthly rent must be greater than 0",
    }),
  beds: z
    .union([z.string(), z.number()])
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" || v === undefined ? undefined : Number(v)))
    .refine((v) => v === undefined || Number.isInteger(v), {
      message: "Beds must be an integer",
    }),
  baths: z
    .union([z.string(), z.number()])
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" || v === undefined ? undefined : Number(v)))
    .refine((v) => v === undefined || Number.isFinite(v), {
      message: "Baths must be a number",
    }),
  notes: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});
type FormValues = z.infer<typeof schema>;

export default function UnitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const unitId = String(id);
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const unitQuery = useQuery<Unit, Error>({
    queryKey: qk.unit(unitId),
    queryFn: () => api.get<Unit>(`/api/v1/units/${unitId}`),
    enabled: !!unitId,
  });

  const tenantsQuery = useQuery<Paginated<Tenant>, Error>({
    queryKey: qk.tenants(1, 1000),
    queryFn: () =>
      api.get<Paginated<Tenant>>(
        `/api/v1/tenants?page=1&limit=1000&unit_id=${encodeURIComponent(
          unitId
        )}`
      ),
  });

  const tenants = useMemo(
    () =>
      tenantsQuery.data?.items.filter((t) => String(t.unit_id) === unitId) ??
      [],
    [tenantsQuery.data, unitId]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (unitQuery.data) {
      reset({
        name: unitQuery.data.name ?? "",
        address: unitQuery.data.address ?? "",
        monthly_rent: (unitQuery.data.monthly_rent as unknown as string) ?? "",
        beds: (unitQuery.data.beds as unknown as string) ?? ("" as any),
        baths: (unitQuery.data.baths as unknown as string) ?? ("" as any),
        notes: (unitQuery.data.notes as string | undefined) ?? "",
      });
    }
  }, [unitQuery.data, reset]);

  const updateMutation = useMutation<Unit, Error, FormValues>({
    mutationFn: async (values) => {
      if (pendingImageUri) {
        const form = new FormData();
        const guessMimeFromUri = (uri: string): string => {
          const lower = uri.toLowerCase();
          if (lower.endsWith(".png")) return "image/png";
          if (lower.endsWith(".webp")) return "image/webp";
          return "image/jpeg";
        };
        const type = guessMimeFromUri(pendingImageUri);
        const filename = `unit_${Date.now()}.jpg`;
        if (Platform.OS === "web") {
          const resp = await fetch(pendingImageUri);
          const blob = await resp.blob();
          const file = new File([blob], filename, { type });
          form.append("file", file as any);
        } else {
          form.append("file", {
            uri: pendingImageUri,
            name: filename,
            type,
          } as any);
        }
        await api.post<{ image_url: string }>(
          `/api/v1/units/${unitId}/image`,
          form
        );
      }
      return api.put<Unit>(`/api/v1/units/${unitId}`, {
        name: values.name,
        address: values.address,
        monthly_rent: values.monthly_rent as number,
        beds: values.beds as number | undefined,
        baths: values.baths as number | undefined,
        notes: values.notes,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.unit(unitId) });
      await queryClient.invalidateQueries({ queryKey: qk.units() });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation<unknown, Error, void>({
    mutationFn: async () => api.del(`/api/v1/units/${unitId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.units() });
      router.replace("/(tabs)/units");
    },
  });

  const onDelete = () => {
    if (Platform.OS === "web") {
      // Web Alert only supports a single OK button; use confirm for two-step UX
      // eslint-disable-next-line no-alert
      const confirmed =
        typeof window !== "undefined" && window.confirm("Delete this unit?");
      if (confirmed) deleteMutation.mutate();
      return;
    }
    Alert.alert("Delete Unit", "Are you sure you want to delete this unit?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset?.uri) return;
    setPendingImageUri(asset.uri);
    setIsEditing(true);
  }, []);

  // Payments modal hooks must be declared before any early returns to preserve hook order
  type Payment = {
    id: string;
    amount: number;
    due_date: string;
    status?: string;
  };
  type PaymentsResponse = {
    items: Payment[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };

  const [paymentsTenant, setPaymentsTenant] = useState<Tenant | null>(null);
  const paymentsQueryKey = [
    "payments",
    "tenant",
    paymentsTenant?.id ?? "",
    "due",
  ] as const;
  const paymentsQuery = useQuery<PaymentsResponse, Error>({
    queryKey: paymentsQueryKey,
    queryFn: () =>
      api.get<PaymentsResponse>(
        `/api/v1/payments?tenant_id=${paymentsTenant?.id}&status=due`
      ),
    enabled: !!paymentsTenant?.id,
  });

  const markPaid = useMutation<unknown, Error, string>({
    mutationFn: (paymentId) => api.post(`/api/v1/payments/${paymentId}/pay`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: paymentsQueryKey });
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      await queryClient.invalidateQueries({ queryKey: ["payments", "due"] });
    },
  });

  // Edit and the overflow menu live in the stack header, not beside the title.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        unitQuery.data ? (
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setIsEditing((v) => !v)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isEditing ? "Cancel editing" : "Edit unit"}
            >
              <Text style={styles.headerLink}>{isEditing ? "Cancel" : "Edit"}</Text>
            </Pressable>
            {!isEditing ? (
              <IconButton
                icon="ellipsis-horizontal"
                accessibilityLabel="More actions"
                size={36}
                onPress={() => setMenuOpen(true)}
              />
            ) : null}
          </View>
        ) : null,
    });
  }, [navigation, isEditing, unitQuery.data]);

  if (unitQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }

  if (unitQuery.isError) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="Couldn't load this unit"
          body={unitQuery.error.message}
          action={<Button label="Try again" variant="secondary" onPress={() => unitQuery.refetch()} />}
        />
      </View>
    );
  }

  const unit = unitQuery.data as Unit;
  const cover = (unit.display_url || unit.cover_image_uri) as string | undefined;
  const editCover = pendingImageUri || unit.display_url || unit.cover_image_uri || null;
  const vacant = !tenantsQuery.isPending && tenants.length === 0;

  return (
    <ScrollView
      style={{ backgroundColor: palette.page }}
      contentContainerStyle={[styles.container, styles.responsivePad]}
      keyboardShouldPersistTaps="handled"
    >
      {isEditing ? (
        <Card>
          <Text style={styles.fieldLabel}>Cover image</Text>
          {editCover ? (
            <Image source={{ uri: editCover }} style={styles.editCover} contentFit="cover" />
          ) : (
            <View style={[styles.editCover, { backgroundColor: palette.field }]} />
          )}
          <View style={styles.coverActions}>
            <Button label="Change image" icon="image-outline" variant="secondary" size="sm" onPress={pickImage} />
            {!!unit.image_url && !pendingImageUri && (
              <Button
                label="Remove"
                variant="ghost"
                size="sm"
                onPress={async () => {
                  await api.del(`/api/v1/units/${unitId}/image`);
                  await queryClient.invalidateQueries({
                    queryKey: qk.unit(unitId),
                  });
                }}
              />
            )}
            {pendingImageUri && (
              <Button label="Undo selection" variant="ghost" size="sm" onPress={() => setPendingImageUri(null)} />
            )}
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Name"
                placeholder="Enter name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value as string}
                error={errors.name?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Address"
                placeholder="Enter address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value as string}
                error={errors.address?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="monthly_rent"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Monthly rent"
                prefix="$"
                placeholder="1500"
                onBlur={onBlur}
                onChangeText={onChange as any}
                value={String(value ?? "")}
                keyboardType="numeric"
                error={errors.monthly_rent?.message as string | undefined}
              />
            )}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="beds"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Field
                    label="Beds"
                    placeholder="3"
                    onBlur={onBlur}
                    onChangeText={onChange as any}
                    value={String(value ?? "")}
                    keyboardType="number-pad"
                    error={errors.beds?.message as string | undefined}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="baths"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Field
                    label="Baths"
                    placeholder="2.5"
                    onBlur={onBlur}
                    onChangeText={onChange as any}
                    value={String(value ?? "")}
                    keyboardType="decimal-pad"
                    error={errors.baths?.message as string | undefined}
                  />
                )}
              />
            </View>
          </View>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Notes"
                placeholder="Any notes..."
                onBlur={onBlur}
                onChangeText={onChange}
                value={(value as string) ?? ""}
                multiline
                numberOfLines={4}
              />
            )}
          />

          {!!updateMutation.error && (
            <Text style={[styles.errorText, { marginBottom: 8 }]}>{updateMutation.error.message}</Text>
          )}

          <Button
            label={updateMutation.isPending ? "Saving..." : "Save changes"}
            full
            disabled={updateMutation.isPending}
            onPress={handleSubmit((v) => updateMutation.mutate(v as any))}
          />
        </Card>
      ) : (
        <>
          {cover ? (
            <Image
              source={{ uri: cover }}
              accessibilityLabel={`Photo of ${unit.name}`}
              style={styles.hero}
              contentFit="cover"
            />
          ) : null}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {unit.name}
            </Text>
            {!tenantsQuery.isPending ? (
              <Badge label={vacant ? "Vacant" : "Occupied"} tone={vacant ? "warn" : "ok"} style={{ alignSelf: "center" }} />
            ) : null}
          </View>
          {!!unit.address && <Text style={styles.address}>{unit.address}</Text>}

          <View style={styles.statsRow}>
            <Card style={styles.stat}>
              <Text style={styles.statLabel}>Rent</Text>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                ${Number(unit.monthly_rent ?? 0).toLocaleString("en-US")}
              </Text>
            </Card>
            <Card style={styles.stat}>
              <Text style={styles.statLabel}>Beds</Text>
              <Text style={styles.statValue}>{unit.beds ?? "–"}</Text>
            </Card>
            <Card style={styles.stat}>
              <Text style={styles.statLabel}>Baths</Text>
              <Text style={styles.statValue}>{unit.baths ?? "–"}</Text>
            </Card>
          </View>
          {!!unit.notes && <Text style={styles.notes}>{unit.notes}</Text>}
        </>
      )}

      <SectionHeader
        title="Tenants"
        right={
          <Button
            label="Assign"
            icon="add"
            variant="secondary"
            size="sm"
            accessibilityLabel="Assign tenant"
            onPress={() => router.push(`/tenants/new?unit_id=${unitId}`)}
          />
        }
      />

      {tenantsQuery.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.tint} />
        </View>
      ) : tenantsQuery.isError ? (
        <Text style={styles.errorText}>{tenantsQuery.error.message}</Text>
      ) : tenants.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon="person-add-outline"
            title="No tenants yet"
            body="Assign a tenant to start a rent schedule for this unit."
          />
        </Card>
      ) : (
        <Card padded={false}>
          {tenants.map((t, i) => (
            <View key={t.id} style={[styles.tenantRow, i > 0 && styles.divider]}>
              <Avatar name={t.full_name} size={40} />
              <Pressable
                style={{ flex: 1, minWidth: 0 }}
                onPress={() => router.push({ pathname: "/tenants/[id]", params: { id: String(t.id) } })}
                accessibilityLabel={`Open ${t.full_name}`}
              >
                <Text style={styles.tenantName} numberOfLines={1}>
                  {t.full_name}
                </Text>
                <Text style={styles.tenantSub} numberOfLines={1}>
                  {t.phone || t.email || "No contact details"}
                </Text>
              </Pressable>
              <Button
                label="Payments"
                variant="secondary"
                size="sm"
                accessibilityLabel={`View ${t.full_name}'s payments`}
                onPress={() => setPaymentsTenant(t)}
              />
            </View>
          ))}
        </Card>
      )}

      <Sheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        header={<SheetHeader label={unit.name} onClose={() => setMenuOpen(false)} />}
      >
        <SheetAction
          icon="create-outline"
          label="Edit unit"
          onPress={() => {
            setMenuOpen(false);
            setIsEditing(true);
          }}
        />
        <SheetAction
          icon="trash-outline"
          label={deleteMutation.isPending ? "Deleting..." : "Delete unit"}
          danger
          onPress={() => {
            setMenuOpen(false);
            onDelete();
          }}
        />
      </Sheet>

      <Sheet
        visible={!!paymentsTenant}
        onClose={() => setPaymentsTenant(null)}
        header={
          <SheetHeader
            label={`${paymentsTenant?.full_name ?? ""} · payments due`}
            onClose={() => setPaymentsTenant(null)}
          />
        }
      >
        {paymentsQuery.isPending ? (
          <View style={[styles.center, { paddingVertical: 24 }]}>
            <ActivityIndicator color={palette.tint} />
          </View>
        ) : paymentsQuery.isError ? (
          <Text style={styles.errorText}>{paymentsQuery.error.message}</Text>
        ) : (paymentsQuery.data?.items ?? []).length === 0 ? (
          <EmptyState icon="checkmark-done-outline" title="Nothing due" body="This tenant is all paid up." />
        ) : (
          (paymentsQuery.data?.items ?? []).map((p, i) => {
            const busy = markPaid.isPending && markPaid.variables === p.id;
            return (
              <View key={p.id} style={[styles.paymentItem, i > 0 && styles.divider]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentAmount}>
                    ${Number(p.amount ?? 0).toLocaleString("en-US")}
                  </Text>
                  <Text style={styles.paymentDate}>Due {formatDue(p.due_date)}</Text>
                </View>
                {(!p.status || p.status === "due") && (
                  <Button
                    label={busy ? "Saving" : "Mark paid"}
                    icon={busy ? undefined : "checkmark"}
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onPress={() => markPaid.mutate(p.id)}
                  />
                )}
              </View>
            );
          })
        )}
      </Sheet>
    </ScrollView>
  );
}

function formatDue(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  responsivePad: { alignSelf: "center", width: "100%", maxWidth: 900 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: palette.page },
  errorText: { ...type.caption, color: "#b42318", textAlign: "center" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 6, paddingRight: 4 },
  headerLink: { ...font("body", 600), fontSize: 16, color: palette.tint, paddingHorizontal: 6 },
  hero: { width: "100%", aspectRatio: 16 / 10, borderRadius: radius.lg, backgroundColor: palette.wash },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  title: { ...type.display, color: palette.ink, flexShrink: 1 },
  address: { ...type.body, color: palette.muted, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  stat: { flex: 1, padding: 12 },
  statLabel: { ...type.section, color: palette.muted },
  statValue: { ...type.numeral, fontSize: 22, lineHeight: 28, letterSpacing: -0.4, color: palette.ink, marginTop: 4 },
  notes: { ...type.body, color: palette.inkSoft, marginTop: 16 },
  fieldLabel: { ...font("body", 600), fontSize: 13, color: palette.muted, marginBottom: 6 },
  editCover: { width: "100%", aspectRatio: 16 / 9, borderRadius: radius.md },
  coverActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, marginBottom: 16 },
  tenantRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  divider: { borderTopWidth: 1, borderTopColor: palette.border },
  tenantName: { ...type.bodyStrong, color: palette.ink },
  tenantSub: { ...type.caption, color: palette.muted, marginTop: 1 },
  paymentItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  paymentDate: { ...type.caption, color: palette.muted, marginTop: 1 },
  paymentAmount: { ...type.money, color: palette.ink },
});
