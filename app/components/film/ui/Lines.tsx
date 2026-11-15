import {Fragment} from 'react';
import {linesOf} from '~/lib/film/format';

/** A multi-line content field, each line after the first on a new line. */
export function Lines({text}: {text: string}) {
  return linesOf(text).map((line, i) => (
    // Lines are positional and can repeat; they never reorder.
    // eslint-disable-next-line react/no-array-index-key
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));
}
