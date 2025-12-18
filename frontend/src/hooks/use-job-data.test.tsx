import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

import { useJobData } from "./use-job-data";
import { api } from "@/services/api";

let listJobsMock: jest.MockedFunction<typeof api.listJobs>;

describe("useJobData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    listJobsMock = vi
      .spyOn(api, "listJobs")
      .mockResolvedValue({ jobs: [], total: 0, page: 1, per_page: 10, pages: 1 });
  });

  afterEach(() => {
    listJobsMock.mockRestore();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("loads jobs on mount and updates state", async () => {
    listJobsMock.mockResolvedValueOnce({
      jobs: [{ id: 1, status: "completed" }],
      total: 1,
      page: 1,
      per_page: 10,
      pages: 1,
    } as any);

    const { result } = renderHook(() => useJobData(10000));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.jobs).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.jobs).toHaveLength(1);
    });
  });

  it("does not change loading state when background poll runs", async () => {
    listJobsMock
      .mockResolvedValueOnce({ jobs: [], total: 0, page: 1, per_page: 10, pages: 1 } as any) // initial load
      .mockResolvedValueOnce({ jobs: [], total: 0, page: 1, per_page: 10, pages: 1 } as any); // poll

    const { result } = renderHook(() => useJobData(1000));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      // still not loading because background poll uses showLoading = false
      expect(result.current.isLoading).toBe(false);
    });
  });
});
