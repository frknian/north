"use client";

import React from "react";
import { CheckCircle2, Sparkles, Trophy } from "lucide-react";

export interface ProgressRingProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function ProgressRing({
  value,
  size = 76,
  strokeWidth = 6,
  color = "var(--primary)",
  label,
  sublabel,
  className = "",
}: ProgressRingProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="color-mix(in srgb, var(--border) 80%, transparent)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
            %{Math.round(clampedValue)}
          </span>
        </div>
      </div>
      {(label || sublabel) && (
        <div className="min-w-0">
          {label && <div className="text-xs font-semibold text-foreground">{label}</div>}
          {sublabel && <div className="mt-0.5 text-xs text-muted-foreground">{sublabel}</div>}
        </div>
      )}
    </div>
  );
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondary?: string;
}

export interface NetTrendChartProps {
  data: ChartDataPoint[];
  targetValue?: number;
  unit?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function NetTrendChart({
  data,
  targetValue,
  unit = "Net",
  title,
  subtitle,
  className = "",
}: NetTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground ${className}`}>
        Henüz deneme veya metrik kaydı girilmedi.
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, targetValue ?? 100, 10);
  const range = maxVal - minVal || 1;

  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingTop = 25;
  const paddingBottom = 35;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingTop - paddingBottom;

  const points = data.map((d, index) => {
    const x = data.length === 1 ? width / 2 : paddingX + (index / (data.length - 1)) * chartW;
    const y = paddingTop + chartH - ((d.value - minVal) / range) * chartH;
    return { x, y, ...d };
  });

  const pathD = points.length === 1
    ? `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`
    : points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), "");

  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartH} L ${points[0].x} ${paddingTop + chartH} Z`
    : "";

  const targetY = targetValue !== undefined ? paddingTop + chartH - ((targetValue - minVal) / range) * chartH : null;

  return (
    <div className={`rounded-2xl border bg-card p-5 shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            {title && <h4 className="text-sm font-semibold tracking-tight text-foreground">{title}</h4>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {targetValue !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <Trophy className="size-3.5" />
              <span>Hedef: {targetValue} {unit}</span>
            </div>
          )}
        </div>
      )}

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="netTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingTop + chartH}
            x2={width - paddingX}
            y2={paddingTop + chartH}
            stroke="var(--border)"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={paddingTop}
            x2={width - paddingX}
            y2={paddingTop}
            stroke="var(--border)"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Target Reference Line */}
          {targetY !== null && (
            <g>
              <line
                x1={paddingX}
                y1={targetY}
                x2={width - paddingX}
                y2={targetY}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={width - paddingX + 5}
                y={targetY + 4}
                fill="#10b981"
                fontSize="10"
                fontFamily="inherit"
                fontWeight="600"
              >
                {targetValue}
              </text>
            </g>
          )}

          {/* Area Fill */}
          {areaD && <path d={areaD} fill="url(#netTrendGrad)" />}

          {/* Trend Line */}
          <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />

          {/* Points & Labels */}
          {points.map((pt, i) => (
            <g key={i} className="group">
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                fill="var(--background)"
                stroke="var(--primary)"
                strokeWidth="2.5"
                className="transition-transform group-hover:scale-125"
              />
              {/* Value label on point */}
              <text
                x={pt.x}
                y={pt.y - 9}
                textAnchor="middle"
                fill="var(--foreground)"
                fontSize="10.5"
                fontWeight="600"
                fontFamily="inherit"
              >
                {pt.value}
              </text>
              {/* Bottom label */}
              <text
                x={pt.x}
                y={paddingTop + chartH + 18}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                fontSize="10"
                fontFamily="inherit"
              >
                {pt.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export interface RestCelebrationCardProps {
  completedCount: number;
  totalMinutes: number;
  areaCount?: number;
  onPlanTomorrow?: () => void;
  className?: string;
}

export function RestCelebrationCard({
  completedCount,
  totalMinutes,
  areaCount = 1,
  onPlanTomorrow,
  className = "",
}: RestCelebrationCardProps) {
  return (
    <section
      className={`celebrate-pop relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-transparent p-6 sm:p-7 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 shadow-sm">
            <Sparkles className="size-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                Günün Odak Hedefi Tamamlandı
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Harika bir odak günü çıkardın. Şimdi dinlenme zamanı!
            </h3>
            <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Bugün {completedCount} görevi bitirdin ve toplam {totalMinutes} dakika derin çalışma yaptın.
              North&apos;un felsefesinde dinlenmek en az çalışmak kadar değerlidir; zihnini toparla, yarın için her şey hazır.
            </p>
          </div>
        </div>

        {onPlanTomorrow && (
          <button
            type="button"
            onClick={onPlanTomorrow}
            className="rounded-xl border border-emerald-500/30 bg-background/80 px-4 py-2 text-xs font-medium text-emerald-800 transition hover:bg-background hover:shadow-sm dark:text-emerald-300"
          >
            Yarının Planını İncele →
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-emerald-500/15 pt-4 sm:grid-cols-3">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tamamlanan Görev</span>
          <p className="font-mono text-base font-semibold text-foreground">{completedCount}</p>
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Toplam Odak</span>
          <p className="font-mono text-base font-semibold text-foreground">{totalMinutes} dk</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Aktif Alan</span>
          <p className="font-mono text-base font-semibold text-foreground">{areaCount} Alan</p>
        </div>
      </div>
    </section>
  );
}
