import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  Field,
  Frame,
  Input,
} from '../../packages/react/src/index.js';

const placeholderImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
const tallImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='400'%3E%3Crect width='100' height='400' fill='%23575'/%3E%3C/svg%3E";

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
      <section
        aria-label="Aspect ratio composition"
        data-testid="aspect-section"
      >
        <Frame ar="16/9" w="100%" data-testid="aspect-media">
          {/* A tiny placeholder is replaced by a wide image in the browser test. */}
          <img
            alt="Wide sample"
            src={placeholderImage}
            width="1"
            height="1"
            data-testid="aspect-image"
          />
        </Frame>
        <Frame
          ar={{ base: '1/1', md: '16/9' }}
          w="100%"
          data-testid="aspect-responsive"
        >
          <img alt="Tall sample" src={tallImage} width="100" height="400" />
        </Frame>
        <Frame ar="4/3" w="100%" data-testid="aspect-long">
          <p>
            {'Long content that is much taller than the frame. '.repeat(400)}
          </p>
        </Frame>
      </section>
    </Box>
  );
}
