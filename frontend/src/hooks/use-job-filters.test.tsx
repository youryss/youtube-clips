import { renderHook, act } from "@testing-library/react";

import { useJobFilters } from "./use-job-filters";
import type { Job } from "@/types";

const makeJob = (overrides: Partial<Job>): Job =>
  ({
    id: 1,
    status: "completed",
    video_url: "https://example.com",
    video_title: "Example",
    ...overrides,
  } as Job);

describe("useJobFilters", () => {
  it("filters by search query on title and url", () => {
    const jobs: Job[] = [
      makeJob({ id: 1, video_title: "Foo Video", video_url: "https://foo" }),
      makeJob({ id: 2, video_title: "Bar Clip", video_url: "https://bar" }),
    ];

    const { result } = renderHook(() => useJobFilters(jobs));

    act(() => {
      result.current.setSearchQuery("foo");
    });

    expect(result.current.filteredJobs).toHaveLength(1);
    expect(result.current.filteredJobs[0].id).toBe(1);
  });

  it("filters by processing and completed status", () => {
    const jobs: Job[] = [
      makeJob({ id: 1, status: "downloading" as Job["status"] }),
      makeJob({ id: 2, status: "transcribing" as Job["status"] }),
      makeJob({ id: 3, status: "completed" }),
    ];

    const { result } = renderHook(() => useJobFilters(jobs));

    act(() => {
      result.current.setStatusFilter("processing");
    });

    // processing should include downloading/transcribing etc
    expect(result.current.filteredJobs.map((j) => j.id)).toEqual([1, 2]);

    act(() => {
      result.current.setStatusFilter("completed");
    });

    expect(result.current.filteredJobs.map((j) => j.id)).toEqual([3]);
  });
});


