import { Alert } from '@utakata-ui/react';
import type { ReactNode } from 'react';

export interface NoteProps {
  title: string;
  variant?: 'default' | 'destructive';
  children?: ReactNode;
}

/** A static in-page note rendered with Utakata Alert. */
export default function Note({
  title,
  variant = 'default',
  children,
}: NoteProps) {
  return (
    <div className="not-prose utakata-docs-block">
      <Alert.Root variant={variant}>
        <Alert.Title>{title}</Alert.Title>
        <Alert.Description>{children}</Alert.Description>
      </Alert.Root>
    </div>
  );
}
