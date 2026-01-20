import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

type AnnouncementProps = {
  startFrame?: number;
};

export const Announcement: React.FC<AnnouncementProps> = ({ startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = Math.max(0, frame - startFrame);

  const titleEntrance = spring({
    frame: localFrame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const subtitleEntrance = spring({
    frame: localFrame - 8,
    fps,
    config: { damping: 200 },
  });

  const titleY = interpolate(titleEntrance, [0, 1], [30, 0]);
  const subtitleY = interpolate(subtitleEntrance, [0, 1], [20, 0]);

  if (localFrame < 0) return null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
      }}
    >
      <div
        style={{
          opacity: titleEntrance,
          transform: `translateY(${titleY}px)`,
          fontSize: 42,
          fontWeight: 700,
          color: "#e6edf3",
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: -1,
        }}
      >
        kubectl, but lazy
      </div>
      <div
        style={{
          opacity: Math.max(0, subtitleEntrance),
          transform: `translateY(${subtitleY}px)`,
          marginTop: 12,
          fontSize: 18,
          fontWeight: 400,
          color: "#8b949e",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        Fuzzy search. Zero dependencies.
      </div>
    </div>
  );
};
