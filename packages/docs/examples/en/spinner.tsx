import { Button, Flex, Spinner } from '@utakata-ui/react';

export default function SpinnerExample() {
  return (
    <Flex style={{ gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" label="Uploading file" />
      <Button disabled>
        <Spinner size="sm" decorative />
        Saving
      </Button>
    </Flex>
  );
}
