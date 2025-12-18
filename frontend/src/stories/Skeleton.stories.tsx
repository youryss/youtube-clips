import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Skeleton className="h-4 w-[250px]" />,
};

export const Circle: Story = {
  render: () => <Skeleton className="size-12 rounded-full" />,
};

export const WithAvatar: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <Skeleton className="h-5 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
      </CardContent>
    </Card>
  ),
};

export const JobCard: Story = {
  render: () => (
    <Card className="w-[500px]">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Thumbnail skeleton */}
          <Skeleton className="h-20 w-32 rounded-lg" />

          <div className="flex-1 space-y-3">
            {/* Title */}
            <Skeleton className="h-5 w-[200px]" />

            {/* Status and date */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Progress bar */}
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const Table: Story = {
  render: () => (
    <div className="w-[600px] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[80px]" />
      </div>

      {/* Rows */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      ))}
    </div>
  ),
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="w-[200px]">
          <Skeleton className="aspect-video w-full" />
          <CardContent className="space-y-2 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[60%]" />
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};
