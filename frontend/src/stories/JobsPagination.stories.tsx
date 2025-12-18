import type { Meta, StoryObj } from "@storybook/react";
import { JobsPagination } from "@/components/jobs/jobs-pagination";

const meta: Meta<typeof JobsPagination> = {
  title: "Jobs/JobsPagination",
  component: JobsPagination,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const MiddlePage: Story = {
  args: {
    currentPage: 2,
    totalPages: 5,
    startIndex: 10,
    endIndex: 20,
    totalItems: 50,
    onPageChange: () => {},
  },
};

export const LastPage: Story = {
  args: {
    currentPage: 5,
    totalPages: 5,
    startIndex: 40,
    endIndex: 50,
    totalItems: 50,
    onPageChange: () => {},
  },
};
