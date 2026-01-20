import { useCurrentFrame, useVideoConfig, spring } from "remotion";

type InstallLogProps = {
  startFrame?: number;
};

export const InstallLog: React.FC<InstallLogProps> = ({ startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = Math.max(0, frame - startFrame);

  const entrance = spring({
    frame: localFrame,
    fps,
    config: { damping: 200 },
  });

  if (localFrame < 0) return null;

  return (
    <div
      style={{
        marginTop: 8,
        opacity: entrance,
        fontSize: 11,
        lineHeight: 1.4,
      }}
    >
      <div style={{ color: "#8b949e" }}>added 1 package in 2s</div>
      <div style={{ color: "#7ee787" }}>✓ klazy installed globally</div>
    </div>
  );
};
