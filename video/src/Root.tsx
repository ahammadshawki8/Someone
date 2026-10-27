import {Composition} from "remotion"
import {FPS, totalFrames, Video} from "./Video"

export const Root: React.FC = () => (
  <Composition id="Someone" component={Video} durationInFrames={totalFrames()} fps={FPS} width={1920} height={1080} />
)
