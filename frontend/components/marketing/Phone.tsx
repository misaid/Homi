import { Image, View } from "react-native";
import { shadowSoft } from "./theme";

export default function Phone({
  source,
  width,
  label,
  style,
}: {
  source: any;
  width: number;
  label: string;
  style?: any;
}) {
  const r = width * 0.13;
  const pad = width * 0.03;
  const innerW = width - pad * 2;
  return (
    <View
      style={[
        {
          width,
          padding: pad,
          borderRadius: r,
          backgroundColor: "#0e0c26",
        },
        shadowSoft,
        style,
      ]}
    >
      <Image
        source={source}
        accessibilityLabel={label}
        resizeMode="cover"
        style={{
          width: innerW,
          height: (innerW * 2400) / 1080,
          borderRadius: r * 0.78,
          backgroundColor: "#fff",
        }}
      />
    </View>
  );
}
