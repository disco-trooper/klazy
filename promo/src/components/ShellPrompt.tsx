import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

type ShellPromptProps = {
  startFrame?: number;
};

export const ShellPrompt: React.FC<ShellPromptProps> = ({ startFrame = 0 }) => {
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
    <div style={{ marginTop: 16, opacity: entrance }}>
      <span style={{ color: "#7ee787" }}>root@nginx</span>
      <span style={{ color: "#8b949e" }}>:</span>
      <span style={{ color: "#58a6ff" }}>/# </span>
      <span
        style={{
          opacity: interpolate(
            frame % 16,
            [0, 8, 16],
            [1, 0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
          color: "#8b949e",
        }}
      >
        _
      </span>
    </div>
  );
};
