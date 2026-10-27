import {Composition, Still} from "remotion"
import {Film, FPS, totalFrames} from "./Film"
import {POSTER_H, POSTER_W, PosterFlow, PosterPipeline, PosterProblem, PosterResearch, PosterRuntime} from "./Posters"

export const Root: React.FC = () => (
  <>
    <Composition id="Someone" component={Film} durationInFrames={totalFrames()} fps={FPS} width={1920} height={1080} />
    <Still id="poster-problem" component={PosterProblem} width={POSTER_W} height={POSTER_H} />
    <Still id="poster-research" component={PosterResearch} width={POSTER_W} height={POSTER_H} />
    <Still id="poster-flow" component={PosterFlow} width={POSTER_W} height={POSTER_H} />
    <Still id="poster-pipeline" component={PosterPipeline} width={POSTER_W} height={POSTER_H} />
    <Still id="poster-runtime" component={PosterRuntime} width={POSTER_W} height={POSTER_H} />
  </>
)
