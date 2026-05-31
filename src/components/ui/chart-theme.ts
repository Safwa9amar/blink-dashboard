// Design-system chart palette. These are CSS-variable references, so every chart
// follows the active theme (dark/light) automatically — never hardcode hex in charts.
export const CHART = {
  primary: "var(--primary)",
  info: "var(--info)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  neutral: "var(--subtext)",
} as const;

// Ordered palette for multi-series / multi-segment charts that don't pass explicit colors.
export const CHART_COLORS: string[] = [
  CHART.primary,
  CHART.info,
  CHART.success,
  CHART.warning,
  CHART.danger,
  CHART.neutral,
];
