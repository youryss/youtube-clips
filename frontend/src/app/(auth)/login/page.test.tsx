import { render } from "@testing-library/react";
import LoginPage from "./page";

const mockUseLogin = vi.fn();

vi.mock("@/hooks/use-login", () => ({
  useLogin: (...args: unknown[]) => mockUseLogin(...args),
}));

vi.mock("@/components/auth/login-form", () => ({
  LoginForm: ({ email, password }: { email: string; password: string }) => (
    <div>
      Login Form {email} / {password}
    </div>
  ),
}));

describe("LoginPage", () => {
  it("renders LoginForm with values from useLogin", () => {
    mockUseLogin.mockReturnValue({
      email: "test@example.com",
      setEmail: vi.fn(),
      password: "secret",
      setPassword: vi.fn(),
      isLoading: false,
      error: null,
      handleSubmit: vi.fn(),
    });

    const { getByText } = render(<LoginPage />);

    expect(
      getByText(/Login Form test@example.com \/ secret/)
    ).toBeInTheDocument();
  });
});
