# klazy Hero GIF Animation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a 4-second animated GIF showing fuzzy exec with typo "nignx" → matches "nginx-deployment-abc123"

**Architecture:** Remotion project in `promo/` subfolder. Terminal frame component wraps typewriter + fuzzy list components. Series-based sequencing for timing.

**Tech Stack:** Remotion 4.x, React, TypeScript, @remotion/gif for output

---

## Task 1: Initialize Remotion Project

**Files:**
- Create: `promo/` directory with Remotion template

**Step 1: Create Remotion project**

```bash
cd /Users/discotrooper/Desktop/Coding/klazy
npx create-video@latest promo --template blank
```

Select: TypeScript, no Tailwind (we'll use inline styles)

**Step 2: Verify installation**

```bash
cd promo
npm install
npm start
```

Expected: Browser opens with Remotion Studio at localhost:3000

**Step 3: Update composition settings in Root.tsx**

Replace content of `promo/src/Root.tsx`:

```tsx
import { Composition } from "remotion";
import { KlazyDemo } from "./KlazyDemo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="KlazyDemo"
      component={KlazyDemo}
      durationInFrames={120}
      fps={30}
      width={600}
      height={400}
    />
  );
};
```

**Step 4: Create placeholder KlazyDemo**

Create `promo/src/KlazyDemo.tsx`:

```tsx
import { AbsoluteFill } from "remotion";

export const KlazyDemo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      <div style={{ color: "white", padding: 40 }}>Placeholder</div>
    </AbsoluteFill>
  );
};
```

**Step 5: Verify in Studio**

```bash
npm start
```

Expected: See dark background with "Placeholder" text

**Step 6: Commit**

```bash
git add promo/
git commit -m "feat(promo): initialize Remotion project for hero GIF"
```

---

## Task 2: Create Terminal Frame Component

**Files:**
- Create: `promo/src/components/TerminalFrame.tsx`

**Step 1: Create components directory**

```bash
mkdir -p promo/src/components
```

**Step 2: Create TerminalFrame component**

Create `promo/src/components/TerminalFrame.tsx`:

```tsx
import React from "react";

type TerminalFrameProps = {
  title?: string;
  children: React.ReactNode;
};

export const TerminalFrame: React.FC<TerminalFrameProps> = ({
  title = "kl - klazy",
  children,
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        padding: 40,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          backgroundColor: "#0d1117",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            backgroundColor: "#161b22",
            borderBottom: "1px solid #30363d",
          }}
        >
          {/* Traffic lights */}
          <div style={{ display: "flex", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#ff5f57",
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#febc2e",
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#28c840",
              }}
            />
          </div>
          {/* Title */}
          <div
            style={{
              flex: 1,
              textAlign: "center",
              color: "#8b949e",
              fontSize: 13,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {title}
          </div>
          <div style={{ width: 54 }} /> {/* Spacer for centering */}
        </div>
        {/* Content */}
        <div
          style={{
            padding: 20,
            minHeight: 200,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
```

**Step 3: Test in KlazyDemo**

Update `promo/src/KlazyDemo.tsx`:

```tsx
import { AbsoluteFill } from "remotion";
import { TerminalFrame } from "./components/TerminalFrame";

export const KlazyDemo = () => {
  return (
    <AbsoluteFill>
      <TerminalFrame>
        <div style={{ color: "#7ee787" }}>$ </div>
      </TerminalFrame>
    </AbsoluteFill>
  );
};
```

**Step 4: Verify in Studio**

```bash
npm start
```

Expected: Styled terminal window with traffic lights and green prompt

**Step 5: Commit**

```bash
git add promo/src/components/
git commit -m "feat(promo): add TerminalFrame component"
```

---

## Task 3: Create Typewriter Component

**Files:**
- Create: `promo/src/components/Typewriter.tsx`

**Step 1: Create Typewriter component**

Create `promo/src/components/Typewriter.tsx`:

```tsx
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
  const visibleChars = Math.min(
    text.length,
    Math.floor(localFrame * charsPerFrame)
  );

  const typedText = text.slice(0, visibleChars);
  const isComplete = visibleChars >= text.length;

  // Cursor blink
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
        <span
          style={{
            opacity: cursorOpacity,
            color: "#8b949e",
          }}
        >
          {isComplete ? "_" : "\u258C"}
        </span>
      )}
    </span>
  );
};
```

**Step 2: Test in KlazyDemo**

Update `promo/src/KlazyDemo.tsx`:

```tsx
import { AbsoluteFill } from "remotion";
import { TerminalFrame } from "./components/TerminalFrame";
import { Typewriter } from "./components/Typewriter";

export const KlazyDemo = () => {
  return (
    <AbsoluteFill>
      <TerminalFrame>
        <div style={{ display: "flex" }}>
          <span style={{ color: "#7ee787" }}>$ </span>
          <Typewriter text="kl exec nignx" startFrame={15} />
        </div>
      </TerminalFrame>
    </AbsoluteFill>
  );
};
```

**Step 3: Verify in Studio**

Expected: Typewriter effect types "kl exec nignx" with blinking cursor

**Step 4: Commit**

```bash
git add promo/src/components/Typewriter.tsx promo/src/KlazyDemo.tsx
git commit -m "feat(promo): add Typewriter component with cursor"
```

---

## Task 4: Create FuzzyMatch List Component

**Files:**
- Create: `promo/src/components/FuzzyMatchList.tsx`

**Step 1: Create FuzzyMatchList component**

Create `promo/src/components/FuzzyMatchList.tsx`:

```tsx
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

type FuzzyMatchListProps = {
  items: string[];
  selectedIndex?: number;
  startFrame?: number;
  highlightColor?: string;
};

export const FuzzyMatchList: React.FC<FuzzyMatchListProps> = ({
  items,
  selectedIndex = 0,
  startFrame = 0,
  highlightColor = "#58a6ff",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = Math.max(0, frame - startFrame);

  // Entrance animation
  const entrance = spring({
    frame: localFrame,
    fps,
    config: { damping: 200 },
  });

  const translateY = interpolate(entrance, [0, 1], [10, 0]);
  const opacity = entrance;

  if (localFrame < 0) return null;

  return (
    <div
      style={{
        marginTop: 12,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <div
            key={item}
            style={{
              padding: "4px 8px",
              marginBottom: 2,
              borderRadius: 4,
              backgroundColor: isSelected ? "#21262d" : "transparent",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: isSelected ? highlightColor : "#8b949e" }}>
              {isSelected ? ">" : " "}
            </span>
            <span
              style={{
                color: isSelected ? highlightColor : "#8b949e",
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {item}
            </span>
          </div>
        );
      })}
    </div>
  );
};
```

**Step 2: Test in KlazyDemo**

Update `promo/src/KlazyDemo.tsx`:

```tsx
import { AbsoluteFill, Sequence } from "remotion";
import { TerminalFrame } from "./components/TerminalFrame";
import { Typewriter } from "./components/Typewriter";
import { FuzzyMatchList } from "./components/FuzzyMatchList";

const PODS = [
  "nginx-deployment-7f8d9c-abc12",
  "nginx-deployment-7f8d9c-def34",
];

export const KlazyDemo = () => {
  return (
    <AbsoluteFill>
      <TerminalFrame>
        <div style={{ display: "flex" }}>
          <span style={{ color: "#7ee787" }}>$ </span>
          <Typewriter text="kl exec nignx" startFrame={15} />
        </div>
        <Sequence from={60} layout="none">
          <FuzzyMatchList items={PODS} selectedIndex={0} />
        </Sequence>
      </TerminalFrame>
    </AbsoluteFill>
  );
};
```

**Step 3: Verify in Studio**

Expected: After typing completes, fuzzy match list slides in

**Step 4: Commit**

```bash
git add promo/src/components/FuzzyMatchList.tsx promo/src/KlazyDemo.tsx
git commit -m "feat(promo): add FuzzyMatchList component"
```

---

## Task 5: Create Shell Prompt Component

**Files:**
- Create: `promo/src/components/ShellPrompt.tsx`

**Step 1: Create ShellPrompt component**

Create `promo/src/components/ShellPrompt.tsx`:

```tsx
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
    <div
      style={{
        marginTop: 16,
        opacity: entrance,
      }}
    >
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
```

**Step 2: Commit**

```bash
git add promo/src/components/ShellPrompt.tsx
git commit -m "feat(promo): add ShellPrompt component"
```

---

## Task 6: Assemble Final Composition

**Files:**
- Modify: `promo/src/KlazyDemo.tsx`

**Step 1: Update KlazyDemo with full sequence**

Replace `promo/src/KlazyDemo.tsx`:

```tsx
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { TerminalFrame } from "./components/TerminalFrame";
import { Typewriter } from "./components/Typewriter";
import { FuzzyMatchList } from "./components/FuzzyMatchList";
import { ShellPrompt } from "./components/ShellPrompt";

const PODS = [
  "nginx-deployment-7f8d9c-abc12",
  "nginx-deployment-7f8d9c-def34",
];

// Timeline (30 fps, 120 frames = 4 seconds):
// 0-15:   Empty terminal, cursor blinks
// 15-55:  Typing "kl exec nignx" (~40 frames for 13 chars)
// 55-75:  Fuzzy list appears
// 75-95:  Selection highlight
// 95-120: Shell prompt appears

export const KlazyDemo = () => {
  const frame = useCurrentFrame();

  // Hide fuzzy list after selection (frame 95)
  const showFuzzyList = frame >= 55 && frame < 95;
  // Show shell prompt after selection
  const showShell = frame >= 95;

  return (
    <AbsoluteFill>
      <TerminalFrame>
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
```

**Step 2: Fine-tune in Studio**

```bash
npm start
```

Scrub through timeline and verify:
- 0-0.5s: Cursor blinks
- 0.5-1.8s: Types "kl exec nignx"
- 1.8-2.5s: Fuzzy list appears
- 2.5-3.2s: List visible with selection
- 3.2-4s: Shell prompt appears

**Step 3: Commit**

```bash
git add promo/src/KlazyDemo.tsx
git commit -m "feat(promo): assemble final demo composition"
```

---

## Task 7: Load JetBrains Mono Font

**Files:**
- Modify: `promo/src/KlazyDemo.tsx`

**Step 1: Load Google Font**

Add to top of `promo/src/KlazyDemo.tsx`:

```tsx
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily } = loadFont();
```

**Step 2: Update TerminalFrame to accept fontFamily prop**

Update `promo/src/components/TerminalFrame.tsx`, add prop:

```tsx
type TerminalFrameProps = {
  title?: string;
  fontFamily?: string;
  children: React.ReactNode;
};
```

And use it in content div:

```tsx
fontFamily: fontFamily || "'JetBrains Mono', monospace",
```

**Step 3: Pass fontFamily to TerminalFrame**

In KlazyDemo:

```tsx
<TerminalFrame fontFamily={fontFamily}>
```

**Step 4: Verify font loads**

```bash
npm start
```

Expected: JetBrains Mono font renders correctly

**Step 5: Commit**

```bash
git add promo/src/
git commit -m "feat(promo): load JetBrains Mono font"
```

---

## Task 8: Render GIF

**Files:**
- Output: `promo/out/klazy-demo.gif`

**Step 1: Install GIF dependencies**

```bash
cd promo
npm install @remotion/gif
```

**Step 2: Render to GIF**

```bash
npx remotion render KlazyDemo --codec=gif out/klazy-demo.gif
```

**Step 3: Check file size**

```bash
ls -lh out/klazy-demo.gif
```

Target: Under 500KB. If larger, reduce quality or colors.

**Step 4: Optimize if needed**

If file too large, render with reduced quality:

```bash
npx remotion render KlazyDemo --codec=gif --quality=80 out/klazy-demo.gif
```

Or use external tool:

```bash
gifsicle -O3 --colors 128 out/klazy-demo.gif -o out/klazy-demo-optimized.gif
```

**Step 5: Commit**

```bash
git add promo/out/klazy-demo.gif
git commit -m "feat(promo): render hero GIF"
```

---

## Task 9: Add GIF to README

**Files:**
- Modify: `README.md`

**Step 1: Copy GIF to repo root or assets**

```bash
cp promo/out/klazy-demo.gif ./assets/demo.gif
```

**Step 2: Update README**

Add after badges, before "Use as `kl` or `klazy`":

```markdown
![klazy demo](./assets/demo.gif)
```

**Step 3: Verify rendering**

Open README in GitHub preview or VS Code preview.

**Step 4: Commit**

```bash
mkdir -p assets
cp promo/out/klazy-demo.gif assets/demo.gif
git add assets/demo.gif README.md
git commit -m "docs: add hero GIF to README"
```

---

## Summary

| Task | Description | Time |
|------|-------------|------|
| 1 | Initialize Remotion project | 5 min |
| 2 | Terminal frame component | 10 min |
| 3 | Typewriter component | 10 min |
| 4 | FuzzyMatchList component | 10 min |
| 5 | ShellPrompt component | 5 min |
| 6 | Assemble composition | 10 min |
| 7 | Load font | 5 min |
| 8 | Render GIF | 5 min |
| 9 | Add to README | 5 min |

**Total: ~65 min**

## Verification

```bash
# Preview animation
cd promo && npm start

# Render GIF
npx remotion render KlazyDemo --codec=gif out/klazy-demo.gif

# Check size
ls -lh out/klazy-demo.gif

# View in README
open README.md
```
