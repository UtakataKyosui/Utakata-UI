import { Fragment } from 'react';

/** Renders `code` spans in manifest prose and translations. */
export default function RichText({ text }: { text: string }) {
  return text
    .split(/(`[^`]+`)/)
    .map((segment, index) =>
      segment.startsWith('`') && segment.endsWith('`') ? (
        <code key={index}>{segment.slice(1, -1)}</code>
      ) : (
        <Fragment key={index}>{segment}</Fragment>
      ),
    );
}
