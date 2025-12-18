import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const meta: Meta<typeof Avatar> = {
  title: "UI/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
};

export const WithFallback: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="" alt="User" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
};

export const CustomSize: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar className="size-8">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar className="size-12">
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar className="size-16">
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
      <Avatar className="size-24">
        <AvatarFallback>XL</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const WithCustomColors: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarFallback className="bg-primary text-primary-foreground">
          PR
        </AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-success text-success-foreground">
          SC
        </AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-warning text-warning-foreground">
          WR
        </AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-destructive text-destructive-foreground">
          ER
        </AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const AvatarGroup: Story = {
  render: () => (
    <div className="flex -space-x-4">
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-primary text-primary-foreground">
          A
        </AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-success text-success-foreground">
          B
        </AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-warning text-warning-foreground">
          C
        </AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-muted text-muted-foreground">
          +3
        </AvatarFallback>
      </Avatar>
    </div>
  ),
};
