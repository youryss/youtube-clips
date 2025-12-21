import Home from "./page";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

describe("Home page", () => {
  it("redirects to /dashboard", () => {
    Home();
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });
});
