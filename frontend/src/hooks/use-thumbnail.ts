import React from "react";
import { api } from "@/services/api";

/**
 * Hook to fetch and manage authenticated thumbnail URLs
 * Since thumbnails require JWT auth, we fetch them as blobs and create object URLs
 */
export function useThumbnail(
  clipId: number | undefined,
  thumbnailPath: string | undefined
) {
  const [thumbnailUrl, setThumbnailUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const blobUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!clipId || !thumbnailPath) {
      // Cleanup previous blob URL if it exists
      if (blobUrlRef.current) {
        window.URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setThumbnailUrl(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadThumbnail = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("No auth token available");
        }

        const url = api.getThumbnailUrl(clipId);
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load thumbnail: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        // Cleanup previous blob URL if it exists
        if (blobUrlRef.current) {
          window.URL.revokeObjectURL(blobUrlRef.current);
        }

        blobUrlRef.current = blobUrl;
        setThumbnailUrl(blobUrl);
      } catch (err) {
        console.error("Error loading thumbnail:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to load thumbnail")
        );
        setThumbnailUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadThumbnail();

    // Cleanup: revoke object URL when component unmounts or clipId changes
    return () => {
      if (blobUrlRef.current) {
        window.URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [clipId, thumbnailPath]);

  return { thumbnailUrl, isLoading, error };
}
