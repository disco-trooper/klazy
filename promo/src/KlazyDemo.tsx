import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { TerminalFrame } from "./components/TerminalFrame";
import { Typewriter } from "./components/Typewriter";
import { FuzzyMatchList } from "./components/FuzzyMatchList";
import { ShellPrompt } from "./components/ShellPrompt";

const { fontFamily } = loadFont();

const PODS = [
  "nginx-deployment-7f8d9c-abc12",
  "nginx-deployment-7f8d9c-def34",
];

// Timeline (30 fps, 120 frames = 4 seconds):
// 0-15:   Empty terminal, cursor blinks
// 15-55:  Typing "kl exec nignx" (~40 frames for 13 chars)
// 55-75:  Fuzzy list appears
// 75-95:  Selection highlight visible
// 95-120: Shell prompt appears

export const KlazyDemo = () => {
  const frame = useCurrentFrame();

  // Hide fuzzy list after selection (frame 95)
  const showFuzzyList = frame >= 55 && frame < 95;
  // Show shell prompt after selection
  const showShell = frame >= 95;

  return (
    <AbsoluteFill>
      <TerminalFrame fontFamily={fontFamily}>
        {/* Command line */}
        <div style={{ display: "flex" }}>
          <span style={{ color: "#7ee787" }}>$ </span>
          <Typewriter
            text="kl exec nignx"
            startFrame={15}
            charsPerSecond={10}
            showCursor={!showShell}
          />
        </div>

        {/* Fuzzy match results */}
        {showFuzzyList && (
          <FuzzyMatchList
            items={PODS}
            selectedIndex={0}
            startFrame={55}
          />
        )}

        {/* Shell prompt after exec */}
        {showShell && <ShellPrompt startFrame={95} />}
      </TerminalFrame>
    </AbsoluteFill>
  );
};
