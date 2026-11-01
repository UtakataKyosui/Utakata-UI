import { createRoot } from 'react-dom/client';
import { Button, Dialog, Field } from '../../packages/react/src/index.js';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import '../../packages/react/src/styles/styles.css';
import './fixture.css';

function Fixture() {
  return (
    <main>
      <h1>Accessibility fixtures</h1>
      <section aria-label="Buttons">
        {componentManifest.components.Button.variants.flatMap((variant) =>
          componentManifest.components.Button.sizes.map((size) => (
            <Button key={`${variant}-${size}`} variant={variant} size={size}>
              {variant} {size}
            </Button>
          )),
        )}
        <Button iconOnly aria-label="Close notification">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
            <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" />
          </svg>
        </Button>
        <Button disabled>Unavailable</Button>
      </section>
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Field.Control type="email" />
        <Field.Description>Enter your contact email.</Field.Description>
      </Field.Root>
      <Dialog.Root>
        <Dialog.Trigger render={<Button />}>Open settings</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Settings</Dialog.Title>
            <Dialog.Description>Update your preferences.</Dialog.Description>
            <Dialog.Close render={<Button />}>Close settings</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing fixture root');
createRoot(root).render(<Fixture />);
