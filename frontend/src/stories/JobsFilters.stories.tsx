import type { Meta, StoryObj } from "@storybook/react";
import { JobsFilters } from "@/components/jobs/jobs-filters";
import type { StatusFilter, JobsViewMode } from "@/hooks/jobs-state";
import { Play, CheckCircle, XCircle, Clock } from "lucide-react";

const statusTabs: {
  value: StatusFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "all", label: "All", icon: Play },
  { value: "processing", label: "Processing", icon: Clock },
  { value: "completed", label: "Completed", icon: CheckCircle },
  { value: "failed", label: "Failed", icon: XCircle },
];

const meta: Meta<typeof JobsFilters> = {
  title: "Jobs/JobsFilters",
  component: JobsFilters,
};

export default meta;
type Story = StoryObj<typeof meta>;

const getStatusCount = (status: StatusFilter) => {
  switch (status) {
    case "processing":
      return 2;
    case "completed":
      return 10;
    case "failed":
      return 1;
    default:
      return 13;
  }
};

export const GridView: Story = {
  args: {
    searchQuery: "",
    viewMode: "grid" as JobsViewMode,
    statusTabs,
    statusFilter: "all",
    onSearchChange: () => {},
    onViewModeChange: () => {},
    onStatusFilterChange: () => {},
    getStatusCount,
  },
};

export const ListViewWithFilter: Story = {
  args: {
    ...GridView.args,
    searchQuery: "podcast",
    viewMode: "list" as JobsViewMode,
    statusFilter: "processing",
  },
};
