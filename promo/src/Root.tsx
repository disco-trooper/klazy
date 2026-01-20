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
