import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useJobActions } from "./use-job-actions";
import type { Job } from "@/types";
import { api } from "@/services/api";

let deleteJobMock: jest.MockedFunction<typeof api.deleteJob>;
let createJobMock: jest.MockedFunction<typeof api.createJob>;
let cancelJobMock: jest.MockedFunction<typeof api.cancelJob>;

describe("useJobActions", () => {
  const baseJobs: Job[] = [
    {
      id: 1,
      status: "completed",
      video_url: "https://example.com/1",
    } as Job,
    {
      id: 2,
      status: "failed",
      video_url: "https://example.com/2",
    } as Job,
  ];

  beforeEach(() => {
    deleteJobMock = vi
      .spyOn(api, "deleteJob")
      .mockResolvedValue({ message: "" } as any);
    createJobMock = vi
      .spyOn(api, "createJob")
      .mockResolvedValue({ message: "", job: baseJobs[0] } as any);
    cancelJobMock = vi
      .spyOn(api, "cancelJob")
      .mockResolvedValue({ message: "", job: baseJobs[0] } as any);
  });

  afterEach(() => {
    deleteJobMock.mockRestore();
    createJobMock.mockRestore();
    cancelJobMock.mockRestore();
  });

  it("calls deleteJob and reloads when confirmed", async () => {
    const loadJobs = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);

    deleteJobMock.mockResolvedValueOnce({ message: "" } as any);

    const { result } = renderHook(() => useJobActions(baseJobs, loadJobs));

    await act(async () => {
      await result.current.handleDeleteJob(1);
    });

    expect(deleteJobMock).toHaveBeenCalledWith(1);
    expect(loadJobs).toHaveBeenCalled();
  });

  it("does not call deleteJob when user cancels confirm", async () => {
    const loadJobs = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValueOnce(false);

    const { result } = renderHook(() => useJobActions(baseJobs, loadJobs));

    await act(async () => {
      await result.current.handleDeleteJob(1);
    });

    expect(deleteJobMock).not.toHaveBeenCalled();
    expect(loadJobs).not.toHaveBeenCalled();
  });

  it("retries job by deleting and recreating it", async () => {
    const loadJobs = vi.fn().mockResolvedValue(undefined);
    deleteJobMock.mockResolvedValueOnce({ message: "" } as any);
    createJobMock.mockResolvedValueOnce({
      message: "",
      job: baseJobs[0],
    } as any);

    const { result } = renderHook(() => useJobActions(baseJobs, loadJobs));

    await act(async () => {
      await result.current.handleRetryJob(1);
    });

    expect(deleteJobMock).toHaveBeenCalledWith(1);
    expect(createJobMock).toHaveBeenCalledWith("https://example.com/1");
    expect(loadJobs).toHaveBeenCalled();
  });

  it("computes status counts correctly", () => {
    const loadJobs = vi.fn();

    const { result } = renderHook(() => useJobActions(baseJobs, loadJobs));

    expect(result.current.getStatusCount("all")).toBe(2);
    expect(result.current.getStatusCount("completed")).toBe(1);
    expect(result.current.getStatusCount("failed")).toBe(1);
  });
});
