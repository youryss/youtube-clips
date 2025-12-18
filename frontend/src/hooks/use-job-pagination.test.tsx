import { renderHook, act } from "@testing-library/react";

import { useJobPagination } from "./use-job-pagination";
import type { Job } from "@/types";

const makeJobs = (count: number): Job[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    status: "completed",
  })) as Job[];

describe("useJobPagination", () => {
  it("computes totalPages and paginatedJobs correctly", () => {
    const jobs = makeJobs(15); // with ITEMS_PER_PAGE = 10 -> 2 pages

    const { result } = renderHook(() => useJobPagination(jobs));

    expect(result.current.totalPages).toBe(2);
    expect(result.current.paginatedJobs).toHaveLength(10);

    act(() => {
      result.current.setCurrentPage(2);
    });

    expect(result.current.paginatedJobs).toHaveLength(5);
    expect(result.current.startIndex).toBe(10);
  });

  it("resets currentPage to 1 when filteredJobs changes", () => {
    const initialJobs = makeJobs(5);
    const { result, rerender } = renderHook(
      (props: { jobs: Job[] }) => useJobPagination(props.jobs),
      { initialProps: { jobs: initialJobs } }
    );

    act(() => {
      result.current.setCurrentPage(2);
    });
    expect(result.current.currentPage).toBe(2);

    // change filtered jobs -> should reset page
    const fewerJobs = makeJobs(3);
    rerender({ jobs: fewerJobs });

    expect(result.current.currentPage).toBe(1);
  });
});
