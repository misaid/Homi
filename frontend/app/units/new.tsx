import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { Unit } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
    .or(z.literal("")) // allow empty string, convert later
    .transform((v) => (v === "" ? undefined : v)),
});

type FormValues = z.infer<typeof schema>;

export default function NewUnitScreen() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      address: "",
      monthly_rent: "" as unknown as number,
      beds: "" as unknown as number,
      baths: "" as unknown as number,
      notes: "" as any,
    },
  });

  const mutation = useMutation<Unit, Error, FormValues>({
    mutationFn: async (values) => {
      const hasImage = !!localUri;
      if (hasImage) {
        const form = new FormData();
        form.append("name", values.name);
        form.append("address", values.address);
        form.append("monthly_rent", String(values.monthly_rent ?? ""));
        if (values.notes) form.append("notes", String(values.notes));
        const guessMimeFromUri = (uri: string): string => {
          const lower = uri.toLowerCase();
          if (lower.endsWith(".png")) return "image/png";
          if (lower.endsWith(".webp")) return "image/webp";
          return "image/jpeg";
        };
        const name = `unit_${Date.now()}`;
        const type = guessMimeFromUri(localUri!);
        form.append("file", { uri: localUri!, name: name, type } as any);
        return api.post<Unit>("/api/v1/units", form);
      }
      const payload = {
        name: values.name,
        address: values.address,
        monthly_rent: values.monthly_rent as number,
        notes: values.notes,
      } as const;
      return api.post<Unit>("/api/v1/units", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.units() });
      // Prefer tabs route if present
      try {
        router.replace("/(tabs)/units");
      } catch {
        router.back();
      }
    },
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  const requestPermission = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return perm.granted;
  }, []);

  const onPick = useCallback(async () => {
    setPicking(true);
    try {
      const ok = await requestPermission();
      if (!ok) return;
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) return;
      setLocalUri(asset.uri);
    } finally {
      setPicking(false);
    }
  }, [requestPermission]);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, styles.responsivePad]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.header}>New Unit</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter name"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoCapitalize="words"
            />
          )}
        />
        {errors.name && (
          <Text style={styles.errorText}>{errors.name.message}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Cover image (optional)</Text>
        {localUri ? (
          <Image
            source={{ uri: localUri }}
            style={styles.cover}
            contentFit="cover"
          />
        ) : (
          <View style={styles.coverPlaceholder} />
        )}
        <View style={{ height: 8 }} />
        <Pressable
          onPress={onPick}
          style={[styles.button, styles.btnSecondary]}
          disabled={picking || mutation.isPending}
        >
          <Text style={[styles.btnText, styles.btnSecondaryText]}>
            {picking ? "Picking..." : localUri ? "Change image" : "Pick image"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Address</Text>
        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.address && styles.inputError]}
              placeholder="Enter address"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoCapitalize="sentences"
            />
          )}
        />
        {errors.address && (
          <Text style={styles.errorText}>{errors.address.message}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Monthly Rent</Text>
        <Controller
          control={control}
          name="monthly_rent"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.monthly_rent && styles.inputError]}
              placeholder="e.g. 1500"
              onBlur={onBlur}
              onChangeText={onChange as any}
              value={String(value ?? "")}
              keyboardType="numeric"
            />
          )}
        />
        {errors.monthly_rent && (
          <Text style={styles.errorText}>
            {errors.monthly_rent.message as string}
          </Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Beds (optional)</Text>
        <Controller
          control={control}
          name="beds"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.beds && styles.inputError]}
              placeholder="e.g. 3"
              onBlur={onBlur}
              onChangeText={onChange as any}
              value={String(value ?? "")}
              keyboardType="number-pad"
            />
          )}
        />
        {errors.beds && (
          <Text style={styles.errorText}>{errors.beds.message as string}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Baths (optional)</Text>
        <Controller
          control={control}
          name="baths"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.baths && styles.inputError]}
              placeholder="e.g. 2.5"
              onBlur={onBlur}
              onChangeText={onChange as any}
              value={String(value ?? "")}
              keyboardType="decimal-pad"
            />
          )}
        />
        {errors.baths && (
          <Text style={styles.errorText}>{errors.baths.message as string}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Notes (optional)</Text>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Any notes..."
              onBlur={onBlur}
              onChangeText={onChange}
              value={(value as string) ?? ""}
              multiline
              numberOfLines={4}
            />
          )}
        />
      </View>

      {!!mutation.error && (
        <Text
          style={[styles.errorText, { textAlign: "center", marginBottom: 8 }]}
        >
          {mutation.error.message}
        </Text>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.button, styles.btnSecondary]}
          disabled={isSubmitting || mutation.isPending}
        >
          <Text style={[styles.btnText, styles.btnSecondaryText]}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          style={[styles.button, styles.btnPrimary]}
          disabled={isSubmitting || mutation.isPending}
        >
          <Text style={[styles.btnText, styles.btnPrimaryText]}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  responsivePad: { alignSelf: "center", width: "100%", maxWidth: 900 },
  header: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  field: { marginBottom: 12 },
  label: { marginBottom: 6, color: "#222", fontWeight: "600" },
  input: {
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textarea: { height: 100, textAlignVertical: "top" },
  inputError: { borderColor: "#b00020" },
  errorText: { color: "#b00020", marginTop: 6 },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: "#0a7ea4" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnSecondary: {
    backgroundColor: "#f0f0f0",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  btnSecondaryText: { color: "#222", fontWeight: "700" },
});
