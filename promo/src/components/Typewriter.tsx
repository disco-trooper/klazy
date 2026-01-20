import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

type TypewriterProps = {
  text: string;
  startFrame?: number;
  charsPerSecond?: number;
  showCursor?: boolean;
  cursorBlinkFrames?: number;
  color?: string;
};

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  startFrame = 0,
  charsPerSecond = 12,
  showCursor = true,
  cursorBlinkFrames = 16,
  color = "#e6edf3",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = Math.max(0, frame - startFrame);
  const charsPerFrame = charsPerSecond / fps;
  const visibleChars = Math.min(text.length, Math.floor(localFrame * charsPerFrame));

  const typedText = text.slice(0, visibleChars);
  const isComplete = visibleChars >= text.length;

  const cursorOpacity = showCursor
    ? interpolate(
        frame % cursorBlinkFrames,
        [0, cursorBlinkFrames / 2, cursorBlinkFrames],
        [1, 0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;

  return (
    <span style={{ color }}>
      {typedText}
      {showCursor && (
        <span style={{ opacity: cursorOpacity, color: "#8b949e" }}>
          {isComplete ? "_" : "\u258C"}
        </span>
      )}
    </span>
  );
};
