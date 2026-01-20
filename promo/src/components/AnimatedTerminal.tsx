import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

type AnimatedTerminalProps = {
  title?: string;
  fontFamily?: string;
  children: React.ReactNode;
  startFrame?: number; // frame at which terminal starts entering
  exitFrame?: number; // frame at which terminal starts exiting
};

export const AnimatedTerminal: React.FC<AnimatedTerminalProps> = ({
  title = "kl - klazy",
  fontFamily,
  children,
  startFrame = 0,
  exitFrame = 999,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - startFrame;

  // Entrance animation (first ~30 frames after startFrame)
  const entranceProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  // Subtle floating/zoom during content
  const floatProgress = Math.min(1, Math.max(0, (localFrame - 30) / 60));

  // Exit animation
  const isExiting = frame >= exitFrame;
  const exitProgress = isExiting
    ? spring({
        frame: frame - exitFrame,
        fps,
        config: { damping: 200 },
      })
    : 0;

  // 3D transforms
  // Start: rotated, scaled down, below view
  // End: straight, full size, centered
  const rotateY = interpolate(entranceProgress, [0, 1], [12, 0]); // start tilted right
  const rotateX = interpolate(entranceProgress, [0, 1], [8, 0]); // start tilted back
  const translateY = interpolate(entranceProgress, [0, 1], [40, 0]); // slide up
  const scale = interpolate(entranceProgress, [0, 1], [0.88, 1]); // grow in

  // Subtle zoom during content
  const contentZoom = interpolate(floatProgress, [0, 1], [1, 1.015]);

  // Exit: fade and slide out
  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);
  const exitScale = interpolate(exitProgress, [0, 1], [1, 0.96]);
  const exitTranslateY = interpolate(exitProgress, [0, 1], [0, -20]);

  const finalScale = scale * contentZoom * exitScale;
  const finalTranslateY = translateY + exitTranslateY;
  const opacity = entranceProgress * exitOpacity;

  // Dynamic shadow based on position
  const shadowY = 20 + translateY * 0.3;
  const shadowBlur = 40 + translateY * 0.5;

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
        perspective: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          backgroundColor: "#0d1117",
          borderRadius: 12,
          boxShadow: `
            0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.4),
            0 ${shadowY * 0.5}px ${shadowBlur * 0.5}px rgba(0,0,0,0.3)
          `,
          overflow: "hidden",
          opacity,
          transform: `
            translateY(${finalTranslateY}px)
            rotateY(${rotateY}deg)
            rotateX(${rotateX}deg)
            scale(${finalScale})
          `,
          transformStyle: "preserve-3d",
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
          <div style={{ width: 54 }} />
        </div>
        {/* Content */}
        <div
          style={{
            padding: 20,
            minHeight: 200,
            fontFamily: fontFamily || "'JetBrains Mono', 'Fira Code', monospace",
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
