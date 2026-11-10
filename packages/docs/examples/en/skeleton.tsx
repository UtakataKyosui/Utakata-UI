import { Button, Flex, Skeleton, Stack, Text } from '@utakata-ui/react';
import { useState } from 'react';

export default function SkeletonExample() {
  const [loading, setLoading] = useState(true);
  return (
    <Stack style={{ gap: '1rem' }}>
      <Text role="status">
        {loading ? 'Loading profile' : 'Profile loaded'}
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
          <Text>Aya (designer)</Text>
        )}
      </Flex>
      <Button variant="outline" onClick={() => setLoading((value) => !value)}>
        {loading ? 'Finish loading' : 'Load again'}
      </Button>
    </Stack>
  );
}
