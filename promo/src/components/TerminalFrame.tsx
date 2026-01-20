import React from "react";

type TerminalFrameProps = {
  title?: string;
  fontFamily?: string;
  children: React.ReactNode;
};

export const TerminalFrame: React.FC<TerminalFrameProps> = ({
  title = "kl - klazy",
  fontFamily,
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
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ff5f57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#febc2e" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#28c840" }} />
          </div>
          {/* Title */}
          <div style={{ flex: 1, textAlign: "center", color: "#8b949e", fontSize: 13, fontFamily: "system-ui, sans-serif" }}>
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
