import { render, screen, fireEvent } from "@testing-library/react";
import RegisterPage from "./page";

const mockRegister = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    register: mockRegister,
    isAuthenticated: false,
  }),
}));

describe("RegisterPage", () => {
  it("renders heading and submit button", () => {
    render(<RegisterPage />);

    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create account/i })
    ).toBeInTheDocument();
  });

  it("handles submit when passwords do not match without crashing", () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "different" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create account/i }));
    // Page should still be rendered after submit
    expect(screen.getByText("Create your account")).toBeInTheDocument();
  });
});
