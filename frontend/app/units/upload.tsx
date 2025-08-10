// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { useApi } from "@/lib/api";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

type UploadResponse = { url: string };

export default function UnitImageUploadScreen() {
  const api = useApi();
  const [picking, setPicking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canUpload = useMemo(
    () => !!localUri && !uploading,
    [localUri, uploading]
  );

  const requestPermission = useCallback(async () => {
    if (Platform.OS === "web") return true;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted)
      Alert.alert(
        "Permission required",
        "We need access to your photos to upload an image."
      );
    return perm.granted;
  }, []);

  const onPick = useCallback(async () => {
    setError(null);
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
      if (!asset?.uri) throw new Error("No image selected");
      setLocalUri(asset.uri);
      setUploadedUrl(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPicking(false);
    }
  }, [requestPermission]);

  const guessMimeFromUri = (uri: string): string => {
    const lower = uri.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".gif")) return "image/gif";
    if (lower.endsWith(".avif")) return "image/avif";
    if (lower.endsWith(".svg")) return "image/svg+xml";
    return "image/jpeg";
  };

  const onUpload = useCallback(async () => {
    if (!localUri) return;
    setError(null);
    setUploading(true);
    try {
      const name = `upload_${Date.now()}`;
      const type = guessMimeFromUri(localUri);
      const form = new FormData();
      form.append("scope", "unit");
      form.append("file", {
        uri: localUri,
        name: name + (type === "image/jpeg" ? ".jpg" : ""),
        type,
      } as any);

      const result = await api.post<UploadResponse>("/v1/upload", form);
      setUploadedUrl(result.url);
    } catch (e) {
      setError((e as Error).message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [api, localUri]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload unit image</Text>
      <View style={styles.previewRow}>
        <View style={styles.previewBox}>
          <Text style={styles.label}>Selected</Text>
          {localUri ? (
            <Image
              source={{ uri: localUri }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.muted}>No image</Text>
            </View>
          )}
        </View>
        <View style={styles.previewBox}>
          <Text style={styles.label}>Uploaded</Text>
          {uploadedUrl ? (
            <Image
              source={{ uri: uploadedUrl }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.muted}>No image</Text>
            </View>
          )}
        </View>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        <Button
          title={picking ? "Opening..." : "Pick image"}
          onPress={onPick}
          disabled={picking || uploading}
        />
        <View style={styles.spacer} />
        {uploading ? (
          <View style={styles.uploading}>
            <ActivityIndicator />
          </View>
        ) : (
          <Button title="Upload" onPress={onUpload} disabled={!canUpload} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: "600" },
  previewRow: { flexDirection: "row", gap: 12 },
  previewBox: { flex: 1 },
  label: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  placeholder: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  muted: { color: "#9ca3af" },
  actions: { flexDirection: "row", alignItems: "center" },
  spacer: { width: 12 },
  uploading: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
  },
  error: { color: "#ef4444" },
});
