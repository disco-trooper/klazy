import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { AnimatedTerminal } from "./components/AnimatedTerminal";
import { Typewriter } from "./components/Typewriter";
import { AsciiBanner } from "./components/AsciiBanner";
import { InstallLog } from "./components/InstallLog";
import { FuzzyMatchList } from "./components/FuzzyMatchList";
import { ShellPrompt } from "./components/ShellPrompt";
import { Announcement } from "./components/Announcement";

const { fontFamily } = loadFont();

const PODS = [
  "nginx-deployment-7f8d9c-abc12",
  "nginx-deployment-7f8d9c-def34",
];

// Timeline (30 fps, 210 frames = 7 seconds):
//
// PHASE 1: Install (0-90 frames = 0-3s)
// 0-30:    Terminal enters with 3D animation
// 10-50:   Typing "npm install -g klazy"
// 50-85:   ASCII banner + install log appears
// 85-90:   Terminal exits
//
// PHASE 2: Demo (90-160 frames = 3-5.3s)
// 90-100:  New terminal enters
// 95-130:  Typing "kl exec nignx"
// 130-145: Fuzzy list appears
// 145-155: Shell prompt appears
// 155-160: Terminal exits
//
// PHASE 3: Announcement (160-210 frames = 5.3-7s)
// 160-210: "kubectl, but lazy" + tagline

export const KlazyDemo = () => {
  const frame = useCurrentFrame();

  // Phase detection
  const phase1 = frame < 90;
  const phase2 = frame >= 90 && frame < 160;
  const phase3 = frame >= 160;

  // Phase 1 states
  const showAsciiBanner = frame >= 50 && frame < 90;
  const showInstallLog = frame >= 55 && frame < 90;

  // Phase 2 states
  const phase2LocalFrame = frame - 90;
  const showFuzzyList = phase2 && phase2LocalFrame >= 40 && phase2LocalFrame < 55;
  const showShell = phase2 && phase2LocalFrame >= 55;

  if (phase3) {
    return (
      <AbsoluteFill>
        <Announcement startFrame={160} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {phase1 && (
        <AnimatedTerminal fontFamily={fontFamily} exitFrame={82}>
          {/* Phase 1: Install */}
          <div style={{ display: "flex" }}>
            <span style={{ color: "#7ee787" }}>$ </span>
            <Typewriter
              text="npm install -g klazy"
              startFrame={10}
              charsPerSecond={12}
              showCursor={!showAsciiBanner}
            />
          </div>
          {showAsciiBanner && <AsciiBanner startFrame={50} />}
          {showInstallLog && <InstallLog startFrame={55} />}
        </AnimatedTerminal>
      )}

      {phase2 && (
        <AnimatedTerminal fontFamily={fontFamily} startFrame={90} exitFrame={152}>
          {/* Phase 2: Demo */}
          <div style={{ display: "flex" }}>
            <span style={{ color: "#7ee787" }}>$ </span>
            <Typewriter
              text="kl exec nignx"
              startFrame={95}
              charsPerSecond={10}
              showCursor={!showShell}
            />
          </div>
          {showFuzzyList && (
            <FuzzyMatchList
              items={PODS}
              selectedIndex={0}
              startFrame={130}
            />
          )}
          {showShell && <ShellPrompt startFrame={145} />}
        </AnimatedTerminal>
      )}
    </AbsoluteFill>
  );
};
