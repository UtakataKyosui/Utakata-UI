import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  Field,
  Input,
} from '../../packages/react/src/index.js';

export function LismFixture() {
  const [saved, setSaved] = useState(0);
  return (
    <Box as="main" isContainer data-testid="lism-container">
      <h1>Lism styling contract</h1>
      <Card.Root p={{ base: '1rem', md: '2rem' }} data-testid="lism-card">
        <Card.Title>Account</Card.Title>
        <Field.Root>
          <Field.Label>Email</Field.Label>
          <Input w="100%" />
        </Field.Root>
        <Button
          p="1rem"
          w={{ base: '100%', md: 'auto' }}
          onClick={() => setSaved(saved + 1)}
        >
          Save account
        </Button>
        <output aria-label="Saved count">{saved}</output>
        <Dialog.Root>
          <Dialog.Trigger render={<Button p="1rem" />}>
            Review account
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Popup p="2rem">
              <Dialog.Title>Review account</Dialog.Title>
              <Dialog.Description>
                Confirm the account details.
              </Dialog.Description>
              <Dialog.Close render={<Button />}>Close review</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </Card.Root>
    </Box>
  );
}
