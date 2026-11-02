import { Button, Flex, Skeleton, Stack, Text } from '@utakata-ui/react';
import { useState } from 'react';

export default function SkeletonExample() {
  const [loading, setLoading] = useState(true);
  return (
    <Stack style={{ gap: '1rem' }}>
      <Text role="status">
        {loading ? 'プロフィールを読み込み中' : 'プロフィールを読み込みました'}
      </Text>
      <Flex
        aria-busy={loading}
        style={{ gap: '0.75rem', alignItems: 'center' }}
      >
        {loading ? (
          <>
            <Skeleton shape="circle" style={{ width: 40, height: 40 }} />
            <Skeleton style={{ width: 160, height: 16 }} />
          </>
        ) : (
          <Text>綾（デザイナー）</Text>
        )}
      </Flex>
      <Button variant="outline" onClick={() => setLoading((value) => !value)}>
        {loading ? '読み込みを完了する' : 'もう一度読み込む'}
      </Button>
    </Stack>
  );
}
