import { serverApi } from "@/services/serverApi";
import Link from "next/link";
import type { Clip } from "@/types";

async function getClip(clipId: string): Promise<Clip> {
  try {
    const { clip } = await serverApi.getClip(clipId);
    return clip;
  } catch (error) {
    throw error;
  }
}

export default async function ClipPage({
  params,
}: {
  params: Promise<{ clipId: string }>;
}) {
  const { clipId } = await params;

  const clip = await getClip(clipId);

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link href="/clips" className="text-primary hover:underline">
            ← Back to Clips
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-6">Clip {clipId}</h1>
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              {clip.title || `Clip ${clip.id}`}
            </h2>
            {clip.duration && (
              <p className="text-muted-foreground">
                Duration: {clip.duration}s
              </p>
            )}
            {clip.viral_score !== undefined && (
              <p className="text-muted-foreground">
                Viral Score: {clip.viral_score.toFixed(2)}
              </p>
            )}
            {clip.start_time !== undefined && clip.end_time !== undefined && (
              <p className="text-muted-foreground">
                Time Range: {clip.start_time}s - {clip.end_time}s
              </p>
            )}
            {clip.criteria_matched && clip.criteria_matched.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Matched Criteria:</p>
                <div className="flex flex-wrap gap-2">
                  {clip.criteria_matched.map((criterion, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                    >
                      {criterion}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {clip.reasoning && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-1">Reasoning:</p>
                <p className="text-sm text-muted-foreground">
                  {clip.reasoning}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
