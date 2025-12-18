import type { Meta, StoryObj } from "@storybook/react";
import { LoginForm } from "@/components/auth/login-form";

const meta: Meta<typeof LoginForm> = {
  title: "Auth/LoginForm",
  component: LoginForm,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    email: "",
    password: "",
    isLoading: false,
    error: "",
    onEmailChange: () => {},
    onPasswordChange: () => {},
    onSubmit: (e: React.FormEvent) => e.preventDefault(),
  },
};

export const WithError: Story = {
  args: {
    ...Default.args,
    error: "Invalid email or password",
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};
