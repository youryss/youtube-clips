import { renderHook, waitFor, act } from "@testing-library/react";
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
    listJobsMock = vi
      .spyOn(api, "listJobs")
      .mockResolvedValue({ jobs: [], total: 0, page: 1, per_page: 10, pages: 1 } as any);
  });

  afterEach(() => {
    listJobsMock.mockRestore();
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
    // First call: initial load
    listJobsMock.mockResolvedValueOnce({
      jobs: [],
      total: 0,
      page: 1,
      per_page: 10,
      pages: 1,
    } as any);

    const { result } = renderHook(() => useJobData(1000));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Second call: simulate background poll with showLoading = false
    listJobsMock.mockResolvedValueOnce({
      jobs: [],
      total: 0,
      page: 1,
      per_page: 10,
      pages: 1,
    } as any);

    await act(async () => {
      await result.current.loadJobs(false);
    });

    // Still not loading because background poll uses showLoading = false
    expect(result.current.isLoading).toBe(false);
  });
});
