import {Fragment} from 'react';
import {linesOf} from '~/lib/film/format';

/** A multi-line content field, each line after the first on a new line. */
export function Lines({text}: {text: string}) {
  return linesOf(text).map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));
}
