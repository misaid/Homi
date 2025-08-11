import { memo, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

export type MinimalLineChartProps = {
  values: number[]; // 0..100
  labels?: string[];
  height?: number; // default 160
  strokeWidth?: number; // default 2
  showArea?: boolean; // default true
  showAxes?: boolean; // default true (legacy)
  showXAxis?: boolean; // optional override
  showYAxis?: boolean; // optional override
  yTicks?: number; // default 4
};

const PADDING = 12; // inner padding

function buildPath(
  points: Array<{ x: number; y: number }>,
  tension: number = 0.2
): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default memo(function MinimalLineChart({
  values,
  labels,
  height = 160,
  strokeWidth = 2,
  showArea = true,
  showAxes = true,
  showXAxis,
  showYAxis,
  yTicks = 4,
}: MinimalLineChartProps) {
  const [width, setWidth] = useState<number>(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== width) setWidth(w);
  };

  // Clamp chart domain to 0..100 for percentage-like series to avoid odd ticks
  const rawMin = Math.min(...values, 0);
  const rawMax = Math.max(...values, 100);
  const headroom = (rawMax - rawMin) * 0.08;
  const yMin = 0; // lock to 0%
  const yMax = 100; // lock to 100%

  const color = values[values.length - 1] >= values[0] ? "#16a34a" : "#dc2626";
  const areaId = useRef(`grad_${Math.random().toString(36).slice(2)}`).current;

  const { path, areaPath, points, mapY } = useMemo(() => {
    const w = Math.max(1, width - PADDING * 2);
    const h = Math.max(1, height - PADDING * 2);
    const stepX = values.length > 1 ? w / (values.length - 1) : 0;
    const mapY = (v: number) => h - ((v - yMin) / (yMax - yMin)) * h;
    const pts = values.map((v, i) => ({
      x: PADDING + i * stepX,
      y: PADDING + mapY(v),
    }));
    const line = buildPath(pts);
    const area =
      showArea && pts.length > 1
        ? `${line} L ${PADDING + (values.length - 1) * stepX} ${
            PADDING + h
          } L ${PADDING} ${PADDING + h} Z`
        : undefined;
    return { path: line, areaPath: area, points: pts, mapY };
  }, [width, height, values, yMin, yMax, showArea]);

  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const handleTouch = (x: number) => {
    if (points.length === 0) return;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(points[i].x - x);
      if (d < best) {
        best = d;
        nearest = i;
      }
    }
    setActiveIdx(nearest);
  };

  const accLabel = useMemo(() => {
    const first = values[0];
    const last = values[values.length - 1];
    const up = last >= first;
    return `Tenant satisfaction. Last ${Math.round(last)}. Trend ${
      up ? "up" : "down"
    }.`;
  }, [values]);

  return (
    <View accessible accessibilityLabel={accLabel} onLayout={onLayout}>
      {width > 0 && (
        <Svg
          width={width}
          height={height}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => handleTouch(e.nativeEvent.locationX)}
          onResponderMove={(e) => handleTouch(e.nativeEvent.locationX)}
          onResponderRelease={() => setActiveIdx(null)}
        >
          {(showXAxis ?? showAxes) || (showYAxis ?? showAxes) ? (
            <>
              {(showYAxis ?? showAxes) && (
                <>
                  <Path
                    d={`M ${PADDING} ${PADDING} L ${PADDING} ${
                      height - PADDING
                    }`}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                  />
                  {Array.from({ length: yTicks + 1 }).map((_, i) => {
                    const v = (100 * i) / yTicks; // 0..100 ticks
                    const y = PADDING + mapY(v);
                    return (
                      <SvgText
                        key={`yt-${i}`}
                        x={PADDING - 6}
                        y={y + 3}
                        fontSize={9}
                        fill="#6b7280"
                        textAnchor="end"
                      >
                        {Math.round(v)}%
                      </SvgText>
                    );
                  })}
                </>
              )}
              {(showXAxis ?? showAxes) && (
                <>
                  <Path
                    d={`M ${PADDING} ${height - PADDING} L ${width - PADDING} ${
                      height - PADDING
                    }`}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                  />
                  {labels?.length ? (
                    <>
                      <SvgText
                        x={PADDING}
                        y={height - PADDING + 12}
                        fontSize={10}
                        fill="#6b7280"
                        textAnchor="start"
                      >
                        {labels[0]}
                      </SvgText>
                      <SvgText
                        x={width - PADDING}
                        y={height - PADDING + 12}
                        fontSize={10}
                        fill="#6b7280"
                        textAnchor="end"
                      >
                        {labels[labels.length - 1]}
                      </SvgText>
                    </>
                  ) : null}
                </>
              )}
            </>
          ) : null}
          <Defs>
            <LinearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <Stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </LinearGradient>
          </Defs>
          {areaPath && <Path d={areaPath} fill={`url(#${areaId})`} />}
          <Path
            d={path}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {activeIdx != null && (
            <>
              <Circle
                cx={points[activeIdx].x}
                cy={points[activeIdx].y}
                r={4}
                fill={color}
              />
              {/* Tooltip pill */}
              <Rect
                x={Math.max(points[activeIdx].x - 18, PADDING)}
                y={Math.max(points[activeIdx].y - 26, 2)}
                width={36}
                height={18}
                rx={9}
                fill={color}
              />
              <SvgText
                x={Math.max(points[activeIdx].x - 18, PADDING) + 18}
                y={Math.max(points[activeIdx].y - 26, 2) + 12}
                fontSize={10}
                fill="#fff"
                textAnchor="middle"
              >
                {Math.round(values[activeIdx])}
              </SvgText>
              {/* Bottom label */}
              {labels?.[activeIdx] && (
                <SvgText
                  x={points[activeIdx].x}
                  y={height - 4}
                  fontSize={11}
                  fill="#374151"
                  textAnchor="middle"
                >
                  {labels[activeIdx]} • {Math.round(values[activeIdx])}
                </SvgText>
              )}
            </>
          )}
        </Svg>
      )}
    </View>
  );
});
