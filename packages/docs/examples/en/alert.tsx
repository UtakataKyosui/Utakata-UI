import { Alert, Button, Stack } from '@utakata-ui/react';
import { useState } from 'react';

export default function AlertExample() {
  const [failed, setFailed] = useState(false);
  return (
    <Stack style={{ gap: '1rem' }}>
      <Alert.Root>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" />
          <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <Alert.Title>Notice: scheduled maintenance</Alert.Title>
        <Alert.Description>
          The service will be unavailable for 30 minutes from 10 p.m.
        </Alert.Description>
      </Alert.Root>
      <Button variant="outline" onClick={() => setFailed(true)}>
        Try saving
      </Button>
      <div role="alert">
        {failed && (
          <Alert.Root variant="destructive">
            <Alert.Title>Error: could not save</Alert.Title>
            <Alert.Description>Wait a moment and try again.</Alert.Description>
          </Alert.Root>
        )}
      </div>
    </Stack>
  );
}
