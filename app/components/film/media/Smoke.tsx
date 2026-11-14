import {pickSources} from '~/components/film/cards/ReelPile';
import type {FilmVideo} from '~/lib/film/model';

/**
 * A scene's smoke: the uploaded video when its `smoke` field has one, otherwise the canvas
 * stand-in that S1Motion / S9Motion draw into (PORTING-DECISIONS.md · B.4, C).
 */
export function Smoke({video}: {video: FilmVideo | null}) {
  if (!video) return <canvas className="fb-smoke" aria-hidden="true" />;
  return (
    <video
      className="fb-fill fb-smoke-video"
      poster={video.poster?.url}
      aria-hidden="true"
      muted
      playsInline
      loop
      autoPlay
      preload="metadata"
    >
      {pickSources(video, 1080).map((source) => (
        <source key={source.url} src={source.url} type={source.mimeType} />
      ))}
    </video>
  );
}
