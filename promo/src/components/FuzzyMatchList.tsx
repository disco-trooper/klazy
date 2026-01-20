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

  const entrance = spring({
    frame: localFrame,
    fps,
    config: { damping: 200 },
  });

  const translateY = interpolate(entrance, [0, 1], [10, 0]);
  const opacity = entrance;

  if (localFrame < 0) return null;

  return (
    <div style={{ marginTop: 12, opacity, transform: `translateY(${translateY}px)` }}>
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
            <span style={{ color: isSelected ? highlightColor : "#8b949e", fontWeight: isSelected ? 600 : 400 }}>
              {item}
            </span>
          </div>
        );
      })}
    </div>
  );
};
