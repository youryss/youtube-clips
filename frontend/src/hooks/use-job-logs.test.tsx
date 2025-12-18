import { renderHook, act, waitFor } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

import { useJobLogs } from "./use-job-logs";
import { api } from "@/services/api";

let getJobLogsMock: jest.MockedFunction<typeof api.getJobLogs>;

describe("useJobLogs", () => {
  beforeEach(() => {
    getJobLogsMock = vi
      .spyOn(api, "getJobLogs")
      .mockResolvedValue({
        job_id: 1,
        status: "completed",
        progress: 100,
        message: "",
      } as any);
  });

  afterEach(() => {
    getJobLogsMock.mockRestore();
  });

  it("toggles off when same job is clicked again", async () => {
    getJobLogsMock.mockResolvedValueOnce({
      job_id: 1,
      status: "completed",
      progress: 100,
      message: "logs",
    } as any);

    const { result } = renderHook(() => useJobLogs());

    await act(async () => {
      await result.current.handleViewLogs(1);
    });

    expect(result.current.expandedJobId).toBe(1);

    await act(async () => {
      await result.current.handleViewLogs(1);
    });

    expect(result.current.expandedJobId).toBeNull();
  });

  it("loads logs and stores them as pretty JSON", async () => {
    const logs = { foo: "bar" };
    getJobLogsMock.mockResolvedValueOnce(logs as any);

    const { result } = renderHook(() => useJobLogs());

    await act(async () => {
      await result.current.handleViewLogs(2);
    });

    await waitFor(() => {
      expect(result.current.expandedJobId).toBe(2);
      expect(result.current.jobLogs[2]).toContain('"foo": "bar"');
    });
  });
});
