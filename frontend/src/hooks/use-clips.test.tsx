import { renderHook, act, waitFor } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { useClips } from "./use-clips";
import type { Clip } from "@/types";
import { api } from "@/services/api";

let listClipsMock: jest.MockedFunction<typeof api.listClips>;

const makeClip = (overrides: Partial<Clip>): Clip =>
  ({
    id: 1,
    filename: "file.mp4",
    title: "My Clip",
    criteria_matched: [],
    is_uploaded: false,
    duration_seconds: 120,
    file_size_bytes: 1048576,
    ...overrides,
  } as Clip);

describe("useClips", () => {
  beforeEach(() => {
    listClipsMock = vi.spyOn(api, "listClips").mockResolvedValue({
      clips: [],
      total: 0,
      page: 1,
      per_page: 10,
      pages: 1,
    } as any);
  });

  afterEach(() => {
    listClipsMock.mockRestore();
  });

  it("loads clips on mount", async () => {
    listClipsMock.mockResolvedValue({
      clips: [makeClip({ id: 1 })],
      total: 1,
      page: 1,
      per_page: 10,
      pages: 1,
    } as any);

    const { result } = renderHook(() => useClips());

    await waitFor(() => {
      expect(result.current.clips).toHaveLength(1);
    });
  });

  it("returns formatted duration and file size", () => {
    const { result } = renderHook(() => useClips());

    expect(result.current.formatDuration(125)).toBe("2:05");
    expect(result.current.formatFileSize(1048576)).toBe("1.00 MB");
  });

  it("filters clips by search query", async () => {
    listClipsMock.mockResolvedValue({
      clips: [
        makeClip({ id: 1, title: "Foo", filename: "foo.mp4" }),
        makeClip({ id: 2, title: "Bar", filename: "bar.mp4" }),
      ],
      total: 2,
      page: 1,
      per_page: 10,
      pages: 1,
    } as any);

    const { result } = renderHook(() => useClips());

    await waitFor(() => {
      expect(result.current.clips).toHaveLength(2);
    });

    act(() => {
      result.current.setSearchQuery("foo");
    });

    expect(result.current.filteredClips).toHaveLength(1);
    expect(result.current.filteredClips[0].id).toBe(1);
  });
});
