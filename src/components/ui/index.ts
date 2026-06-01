// Blink dashboard UI kit — generic primitives + the dashboard component set,
// one component per file. Import everything from "@/components/ui".

// shared, non-visual primitives
export * from "./primitives";

// icons
export { DashIcon, BMark, DI } from "./icons";

// core components
export { Button } from "./button";
export { Badge } from "./badge";
export { Card, CardHeader } from "./card";
export { StatCard } from "./stat-card";
export { StatGrid } from "./stat-grid";
export { DataTable, type Column } from "./data-table";
export { EmptyState } from "./empty-state";
export { PageHeader } from "./page-header";
export { Modal } from "./modal";

// layout / chrome
export { Toolbar } from "./toolbar";
export { SearchBox } from "./search-box";
export { Avatar } from "./avatar";
export { NameCell } from "./name-cell";
export { Toggle } from "./toggle";
export { LivePill } from "./live-pill";
export { Segmented } from "./segmented";
export { RoleChips } from "./role-chips";
export { FilterPills } from "./filter-pills";
export { FormRow } from "./form-row";
export { SubTabs, type SubTab } from "./sub-tabs";
export { SubNav, type SubNavItem } from "./sub-nav";
export { LangTabs } from "./lang-tabs";
export { RichEditor } from "./rich-editor";

// charts
export { CHART, CHART_COLORS } from "./chart-theme";
export { Donut, type DonutSegment } from "./donut";
export { ColumnChart, type ColumnDatum } from "./column-chart";
export { Legend } from "./legend";
export { ChartHead } from "./chart-head";
