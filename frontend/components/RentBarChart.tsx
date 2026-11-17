// Rent due per month, as bars. The data is a handful of discrete monthly
// totals, so bars (not a smoothed line) are the honest shape. The selected bar
// drives the big number in the header; there is no tooltip.
import { memo, useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, type LayoutChangeEvent, Platform, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Path, Rect, Text as SvgText } from "react-native-svg";

import { palette } from "@/constants/theme";
import { svgFont, type } from "@/constants/type";

export type RentBar = {
  key: string; // "YYYY-MM"
  label: string; // "Nov"
  longLabel: string; // "November"
  total: number;
  count: number;
};

const HEIGHT = 168;
const LEFT = 36;
const RIGHT = 4;
const TOP = 8;
const BOTTOM = 24;
const MAX_BARS = 12;

/** Smallest step from {1, 2, 2.5, 5} x 10^n that needs at most 3 intervals. */
export function niceScale(max: number): { step: number; top: number } {
  const m = Math.max(1, max);
  const pow = Math.pow(10, Math.floor(Math.log10(m / 3)));
  for (const p of [pow, pow * 10]) {
    for (const k of [1, 2, 2.5, 5]) {
      const step = k * p;
      if (m / step <= 3) return { step, top: Math.ceil(m / step) * step };
    }
  }
  return { step: m, top: m };
}

export function formatTick(n: number): string {
  if (n === 0) return "$0";
  if (n >= 1000) return `$${String(Math.round((n / 1000) * 10) / 10).replace(/\.0$/, "")}k`;
  return `$${Math.round(n)}`;
}

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function topRounded(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, h, w / 2));
  return `M ${x} ${y + h} L ${x} ${y + rr} Q ${x} ${y} ${x + rr} ${y} L ${x + w - rr} ${y} Q ${x + w} ${y} ${x + w} ${y + rr} L ${x + w} ${y + h} Z`;
}

/** 0..1 growth per bar: 220ms ease-out, 30ms stagger. Skipped under reduced motion. */
function useGrow(count: number, ready: boolean): (i: number) => number {
  const [t, setT] = useState<number | null>(0);
  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    let cancelled = false;
    let start = 0;
    const total = 220 + 30 * Math.max(0, count - 1);
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce || typeof requestAnimationFrame !== "function") return setT(null);
        const tick = (now: number) => {
          if (cancelled) return;
          if (!start) start = now;
          const el = now - start;
          if (el >= total) return setT(null);
          setT(el);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      });
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ready, count]);
  return (i: number) => {
    if (t == null) return 1;
    const p = Math.max(0, Math.min(1, (t - i * 30) / 220));
    return 1 - Math.pow(1 - p, 3);
  };
}

export default memo(function RentBarChart({
  data,
  currentKey,
  title = "Rent due by month",
}: {
  data: RentBar[];
  currentKey: string;
  title?: string;
}) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };

  // Show at most 12 months, starting from the current one when it exists.
  const bars = useMemo(() => {
    if (data.length <= MAX_BARS) return data;
    const from = Math.max(0, data.findIndex((d) => d.key >= currentKey));
    return data.slice(from, from + MAX_BARS);
  }, [data, currentKey]);

  const defaultKey = bars.find((b) => b.key === currentKey)?.key ?? bars[0]?.key;
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const [hover, setHover] = useState<string | null>(null);
  const selectedKey = bars.some((b) => b.key === picked) ? picked : defaultKey;
  const selected = bars.find((b) => b.key === selectedKey);

  const { step, top } = useMemo(() => niceScale(Math.max(0, ...bars.map((b) => b.total))), [bars]);
  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let v = 0; v <= top + step / 2; v += step) out.push(v);
    return out;
  }, [step, top]);

  const grow = useGrow(bars.length, width > 0);

  const plotW = Math.max(1, width - LEFT - RIGHT);
  const plotH = HEIGHT - TOP - BOTTOM;
  const slot = plotW / Math.max(1, bars.length);
  const barW = Math.max(14, Math.min(44, slot * 0.56));
  const y = (v: number) => TOP + plotH - (v / top) * plotH;
  const labelEvery = bars.length > 8 ? 2 : 1;

  return (
    <View>
      <Text style={styles.label}>{title}</Text>
      <Text style={styles.value}>{selected ? money(selected.total) : "$0"}</Text>
      <Text style={styles.sub}>
        {selected
          ? `${selected.longLabel} · ${selected.count} ${selected.count === 1 ? "payment" : "payments"}`
          : "Nothing due"}
      </Text>
      <View onLayout={onLayout} style={{ marginTop: 12 }} accessibilityLabel={`${title} chart`}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            {ticks.map((v, i) => (
              <Line
                key={`g${i}`}
                x1={LEFT}
                x2={width - RIGHT}
                y1={y(v)}
                y2={y(v)}
                stroke={i === 0 ? palette.border : palette.grid}
                strokeWidth={1}
              />
            ))}
            {ticks.map((v, i) => (
              <SvgText
                key={`t${i}`}
                x={LEFT - 8}
                y={y(v) + 4}
                fontSize={11}
                fill={palette.muted}
                textAnchor="end"
                {...svgFont(500)}
              >
                {formatTick(v)}
              </SvgText>
            ))}
            {bars.map((b, i) => {
              const on = b.key === selectedKey;
              const cx = LEFT + slot * i + slot / 2;
              const h = Math.max(b.total > 0 ? 2 : 0, (b.total / top) * plotH * grow(i));
              return (
                <Path
                  key={b.key}
                  d={topRounded(cx - barW / 2, TOP + plotH - h, barW, h, 6)}
                  fill={on ? palette.tint : palette.washDeep}
                  opacity={hover === b.key && !on ? 0.75 : 1}
                />
              );
            })}
            {bars.map((b, i) => {
              if (i % labelEvery !== 0 && b.key !== selectedKey) return null;
              const on = b.key === selectedKey;
              return (
                <SvgText
                  key={`x${b.key}`}
                  x={LEFT + slot * i + slot / 2}
                  y={HEIGHT - 6}
                  fontSize={11}
                  fill={on ? palette.ink : palette.muted}
                  textAnchor="middle"
                  {...svgFont(on ? 700 : 500)}
                >
                  {b.label}
                </SvgText>
              );
            })}
            {/* Full-height hit targets, one per month */}
            {bars.map((b, i) => (
              <Rect
                key={`h${b.key}`}
                x={LEFT + slot * i}
                y={0}
                width={slot}
                height={HEIGHT}
                fill="transparent"
                onPress={() => setPicked(b.key)}
                {...(Platform.OS === "web"
                  ? ({
                      onMouseEnter: () => setHover(b.key),
                      onMouseLeave: () => setHover(null),
                      style: { cursor: "pointer" },
                    } as any)
                  : {})}
                accessibilityLabel={`${b.longLabel}, ${money(b.total)} due`}
              />
            ))}
          </Svg>
        ) : (
          <View style={{ height: HEIGHT }} />
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  label: { ...type.section, color: palette.muted },
  value: { ...type.numeral, color: palette.ink, marginTop: 6 },
  sub: { ...type.caption, color: palette.muted, marginTop: 2 },
});
