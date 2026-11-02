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
        <Alert.Title>お知らせ：メンテナンス予定</Alert.Title>
        <Alert.Description>
          22時から30分間、サービスを停止します。
        </Alert.Description>
      </Alert.Root>
      <Button variant="outline" onClick={() => setFailed(true)}>
        保存を試す
      </Button>
      <div role="alert">
        {failed && (
          <Alert.Root variant="destructive">
            <Alert.Title>エラー：保存できませんでした</Alert.Title>
            <Alert.Description>
              時間をおいて再試行してください。
            </Alert.Description>
          </Alert.Root>
        )}
      </div>
    </Stack>
  );
}
