import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  Field,
  Input,
  Kbd,
  KbdGroup,
  NativeSelect,
  RadioGroup,
  Select,
  Separator,
  Skeleton,
  Slider,
  Switch,
  Textarea,
} from '../../packages/react/src/index.js';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import '../../packages/react/src/styles/styles.css';
import './fixture.css';

function cancelResetRef(form: HTMLFormElement | null) {
  if (!form) return;
  const cancel = (event: Event) => event.preventDefault();
  form.addEventListener('reset', cancel);
  return () => form.removeEventListener('reset', cancel);
}

function SwitchStates() {
  const [changes, setChanges] = useState<string[]>([]);
  return (
    <section aria-label="Switch input">
      <Button>Before switches</Button>
      {['Enabled', 'Disabled', 'Read only'].map((state) => (
        <label key={state}>
          <Switch.Root
            disabled={state === 'Disabled'}
            readOnly={state === 'Read only'}
            onCheckedChange={(checked) =>
              setChanges((previous) => [...previous, `${state}:${checked}`])
            }
          >
            <Switch.Thumb />
          </Switch.Root>
          <span>{state} switch</span>
        </label>
      ))}
      <output aria-label="Switch changes">{JSON.stringify(changes)}</output>
    </section>
  );
}

function RadioGroupStates() {
  const [changes, setChanges] = useState<string[]>([]);
  return (
    <section aria-label="RadioGroup input">
      <Button>Before radios</Button>
      <RadioGroup.Root
        aria-label="Plan"
        onValueChange={(value) =>
          setChanges((previous) => [...previous, String(value)])
        }
      >
        {['free', 'team', 'pro'].map((value) => (
          <RadioGroup.Item
            key={value}
            value={value}
            disabled={value === 'team'}
          >
            <RadioGroup.Indicator />
            {value}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
      <Button>After radios</Button>
      <output aria-label="RadioGroup changes">{JSON.stringify(changes)}</output>
    </section>
  );
}

const selectThemes = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

function SelectStates() {
  const [changes, setChanges] = useState<string[]>([]);
  return (
    <section aria-label="Select input">
      <Button>Before select</Button>
      <form aria-label="Select form">
        <Select.Root
          name="theme"
          defaultValue="system"
          items={selectThemes}
          onValueChange={(value) =>
            setChanges((previous) => [...previous, String(value)])
          }
        >
          <Select.Label>Theme</Select.Label>
          <Select.Trigger>
            <Select.Value placeholder="Choose a theme" />
            <Select.Icon />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  {selectThemes.map((theme) => (
                    <Select.Item
                      key={theme.value}
                      value={theme.value}
                      disabled={theme.value === 'dark'}
                    >
                      <Select.ItemText>{theme.label}</Select.ItemText>
                      <Select.ItemIndicator>✓</Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </form>
      <Button>After select</Button>
      <output aria-label="Select changes">{JSON.stringify(changes)}</output>
    </section>
  );
}

function SliderStates() {
  const [events, setEvents] = useState<string[]>([]);
  return (
    <section aria-label="Slider input">
      <Button>Before slider</Button>
      <Slider.Root
        min={0}
        max={1}
        step={0.1}
        largeStep={0.5}
        defaultValue={0.5}
      >
        <Slider.Label>Gain</Slider.Label>
        <Slider.Value />
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb getAriaValueText={(value) => `${value} gain`} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Slider.Root
        defaultValue={50}
        step={5}
        onValueChange={(value) =>
          setEvents((previous) => [...previous, `change:${value}`])
        }
        onValueCommitted={(value) =>
          setEvents((previous) => [...previous, `commit:${value}`])
        }
      >
        <Slider.Label>Volume</Slider.Label>
        <Slider.Value />
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb getAriaValueText={(value) => `${value} percent`} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <output aria-label="Slider events">{JSON.stringify(events)}</output>
    </section>
  );
}

const badgeLongText =
  'Awaiting approval from the regional administration team before publication';

function BadgeStates() {
  return (
    <section aria-label="Badge states">
      {componentManifest.components.Badge.variants.map((variant) => (
        <div key={variant} className="fixture-badges">
          <Badge variant={variant} data-case="short">
            Active {variant}
          </Badge>
          <Badge variant={variant} data-case="long">
            {badgeLongText} {variant}
          </Badge>
          <Badge variant={variant} data-case="icon">
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="5" fill="currentColor" />
            </svg>
            Icon {variant}
          </Badge>
        </div>
      ))}
    </section>
  );
}

function SkeletonStates() {
  return (
    <section aria-label="Skeleton states">
      <p role="status">Loading profile</p>
      <div aria-busy="true" className="fixture-skeletons">
        <Skeleton shape="circle" style={{ width: 40, height: 40 }} />
        <Skeleton style={{ width: 160, height: 16 }} />
      </div>
    </section>
  );
}

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
      <section aria-label="Static display">
        <p>
          Search:{' '}
          <KbdGroup aria-label="Control and K">
            <span aria-hidden="true">
              <Kbd>Ctrl</Kbd> + <Kbd size="sm">K</Kbd>
            </span>
          </KbdGroup>
        </p>
        <Separator />
        <div className="fixture-row">
          <span>Profile</span>
          <Separator decorative={false} orientation="vertical" />
          <span>Settings</span>
        </div>
      </section>
      <section aria-label="Input states">
        {componentManifest.components.Input.sizes.map((size) => (
          <div key={size} className="fixture-inputs">
            <Field.Root name={`input-${size}`}>
              <Field.Label>Input {size}</Field.Label>
              <Input size={size} placeholder="Enter a value" />
              <Field.Description>
                Required contact information.
              </Field.Description>
            </Field.Root>
            <Input
              size={size}
              aria-label={`Read only ${size}`}
              readOnly
              defaultValue="Kept value"
            />
            <Input
              size={size}
              aria-label={`Disabled ${size}`}
              disabled
              defaultValue="Unavailable"
            />
            <Field.Root invalid>
              <Field.Label>Invalid {size}</Field.Label>
              <Input size={size} defaultValue="Invalid value" />
              <Field.Error match>Enter a valid contact value.</Field.Error>
            </Field.Root>
          </div>
        ))}
      </section>
      <section aria-label="Textarea states">
        {componentManifest.components.Textarea.sizes.map((size) => (
          <form key={size} className="fixture-inputs">
            <Field.Root name="notes">
              <Field.Label>Notes {size}</Field.Label>
              <Textarea size={size} maxLength={8} />
              <Field.Description>
                Up to 8 characters, including line breaks.
              </Field.Description>
            </Field.Root>
            <Textarea
              size={size}
              aria-label={`Read only notes ${size}`}
              name="readonly"
              readOnly
              defaultValue="Kept value"
            />
            <Textarea
              size={size}
              aria-label={`Disabled notes ${size}`}
              name="disabled"
              disabled
              defaultValue="Unavailable"
            />
            <Field.Root invalid>
              <Field.Label>Invalid notes {size}</Field.Label>
              <Textarea size={size} defaultValue="Invalid note" />
              <Field.Error match>Enter a valid note.</Field.Error>
            </Field.Root>
          </form>
        ))}
      </section>
      <section aria-label="NativeSelect states">
        {componentManifest.components.NativeSelect.sizes.map((size) => (
          <form key={size} className="fixture-inputs">
            <Field.Root name="country">
              <Field.Label>Country {size}</Field.Label>
              <NativeSelect size={size} defaultValue="jp">
                <option value="jp">Japan</option>
                <option value="ca" disabled>
                  Canada
                </option>
                <optgroup label="Other countries">
                  <option value="us">United States</option>
                </optgroup>
              </NativeSelect>
              <Field.Description>Used for shipping.</Field.Description>
            </Field.Root>
            <NativeSelect
              size={size}
              disabled
              name="disabled"
              aria-label={`Disabled country ${size}`}
            >
              <option value="jp">Japan</option>
            </NativeSelect>
            <Field.Root invalid>
              <Field.Label>Invalid country {size}</Field.Label>
              <NativeSelect size={size}>
                <option value="">Choose a country</option>
              </NativeSelect>
              <Field.Error match>Choose a valid country.</Field.Error>
            </Field.Root>
            <Button type="reset">Reset country {size}</Button>
          </form>
        ))}
      </section>
      <section aria-label="Checkbox reset">
        {[false, true].flatMap((canceled) =>
          [false, true].map((defaultChecked) => {
            const name = `Reset ${canceled ? 'canceled' : 'allowed'} default ${defaultChecked}`;
            return (
              <form key={name} ref={canceled ? cancelResetRef : undefined}>
                <Checkbox.Root
                  aria-label={name}
                  name="choice"
                  value="yes"
                  defaultChecked={defaultChecked}
                >
                  <Checkbox.Indicator />
                </Checkbox.Root>
                <Button type="reset">{name}</Button>
              </form>
            );
          }),
        )}
      </section>
      <SwitchStates />
      <RadioGroupStates />
      <SelectStates />
      <SliderStates />
      <BadgeStates />
      <SkeletonStates />
    </main>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing fixture root');
createRoot(root).render(<Fixture />);
