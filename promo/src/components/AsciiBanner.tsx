import { useCurrentFrame, useVideoConfig, spring } from "remotion";

const ASCII_KLAZY = `
██╗  ██╗██╗      █████╗ ███████╗██╗   ██╗
██║ ██╔╝██║     ██╔══██╗╚══███╔╝╚██╗ ██╔╝
█████╔╝ ██║     ███████║  ███╔╝  ╚████╔╝
██╔═██╗ ██║     ██╔══██║ ███╔╝    ╚██╔╝
██║  ██╗███████╗██║  ██║███████╗   ██║
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝
`.trim();

type AsciiBannerProps = {
  startFrame?: number;
};

export const AsciiBanner: React.FC<AsciiBannerProps> = ({ startFrame = 0 }) => {
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
        fontFamily: "monospace",
        fontSize: 6,
        lineHeight: 1.1,
        color: "#58a6ff",
        whiteSpace: "pre",
        letterSpacing: -0.5,
      }}
    >
      {ASCII_KLAZY}
    </div>
  );
};
