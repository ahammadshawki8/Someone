import {Composition} from "remotion"
import {Film, FPS, totalFrames} from "./Film"

export const Root: React.FC = () => (
  <Composition id="Someone" component={Film} durationInFrames={totalFrames()} fps={FPS} width={1920} height={1080} />
)
