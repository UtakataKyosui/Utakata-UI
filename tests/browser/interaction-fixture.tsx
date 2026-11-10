import {
  Accordion,
  Button,
  Checkbox,
  Collapsible,
  Field,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Tabs,
  Toggle,
  ToggleGroup,
} from '../../packages/react/src/index.js';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';

const themes = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
];

function SelectCase({
  caseId,
  label,
  disabled,
}: {
  caseId: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Select.Root
      name={caseId}
      defaultValue="system"
      items={themes}
      disabled={disabled}
    >
      <Select.Label>{label}</Select.Label>
      <Select.Trigger data-case={caseId}>
        <Select.Value />
        <Select.Icon />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.List>
              {themes.map((theme) => (
                <Select.Item key={theme.value} value={theme.value}>
                  <Select.ItemText>{theme.label}</Select.ItemText>
                  <Select.ItemIndicator>✓</Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

/**
 * Every interactive state the audit measures: enabled, selected, disabled and
 * invalid, rendered once each so a single page load covers the whole table.
 * Each interactive element carries data-case; see interaction-states.spec.ts.
 */
export function InteractionFixture() {
  const { sizes, variants } = componentManifest.components.Button;
  return (
    <main className="interaction-states">
      <h1>Interaction states</h1>
      <section aria-label="Button states">
        {variants.flatMap((variant) =>
          sizes.flatMap((size) => [
            <Button
              key={`${variant}-${size}`}
              variant={variant}
              size={size}
              data-case={`button-${variant}-${size}`}
            >
              {variant} {size}
            </Button>,
            <Button
              key={`${variant}-${size}-disabled`}
              variant={variant}
              size={size}
              disabled
              data-case={`button-${variant}-${size}-disabled`}
            >
              {variant} {size} unavailable
            </Button>,
          ]),
        )}
      </section>
      <section aria-label="Disclosure states">
        <Collapsible.Root>
          <Collapsible.Trigger data-case="collapsible">
            Advanced settings
          </Collapsible.Trigger>
          <Collapsible.Panel>Additional settings</Collapsible.Panel>
        </Collapsible.Root>
        <Collapsible.Root disabled>
          <Collapsible.Trigger data-case="collapsible-disabled">
            Locked settings
          </Collapsible.Trigger>
          <Collapsible.Panel>Hidden settings</Collapsible.Panel>
        </Collapsible.Root>
        <Accordion.Root>
          <Accordion.Item value="account">
            <Accordion.Header level={3}>
              <Accordion.Trigger data-case="accordion">
                Account
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Account details</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="archive" disabled>
            <Accordion.Header level={3}>
              <Accordion.Trigger data-case="accordion-disabled">
                Archive
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Archived details</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      </section>
      <section aria-label="Tabs states">
        <Tabs.Root defaultValue="profile">
          <Tabs.List aria-label="Account sections">
            <Tabs.Tab value="profile" data-case="tab-selected">
              Profile
            </Tabs.Tab>
            <Tabs.Tab value="billing" data-case="tab">
              Billing
            </Tabs.Tab>
            <Tabs.Tab value="team" disabled data-case="tab-disabled">
              Team
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="profile">Profile panel</Tabs.Panel>
          <Tabs.Panel value="billing">Billing panel</Tabs.Panel>
          <Tabs.Panel value="team">Team panel</Tabs.Panel>
        </Tabs.Root>
      </section>
      <section aria-label="Toggle states">
        {componentManifest.components.Toggle.variants.flatMap((variant) => [
          <Toggle
            key={variant}
            variant={variant}
            data-case={`toggle-${variant}`}
          >
            Bold {variant}
          </Toggle>,
          <Toggle
            key={`${variant}-pressed`}
            variant={variant}
            defaultPressed
            data-case={`toggle-${variant}-pressed`}
          >
            Italic {variant}
          </Toggle>,
          <Toggle
            key={`${variant}-disabled`}
            variant={variant}
            disabled
            data-case={`toggle-${variant}-disabled`}
          >
            Underline {variant}
          </Toggle>,
        ])}
        <ToggleGroup.Root aria-label="Alignment" defaultValue={['center']}>
          <ToggleGroup.Item value="left" data-case="toggle-group-item">
            Left
          </ToggleGroup.Item>
          <ToggleGroup.Item
            value="center"
            data-case="toggle-group-item-pressed"
          >
            Center
          </ToggleGroup.Item>
          <ToggleGroup.Item
            value="right"
            disabled
            data-case="toggle-group-item-disabled"
          >
            Right
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </section>
      <section aria-label="Select states">
        <SelectCase caseId="select" label="Theme" />
        <SelectCase caseId="select-disabled" label="Locked theme" disabled />
        <Field.Root invalid>
          <SelectCase caseId="select-invalid" label="Required theme" />
        </Field.Root>
      </section>
      <section aria-label="Selection control states">
        <Checkbox.Root aria-label="Unchecked" data-case="checkbox">
          <Checkbox.Indicator />
        </Checkbox.Root>
        <Checkbox.Root
          aria-label="Checked"
          defaultChecked
          data-case="checkbox-checked"
        >
          <Checkbox.Indicator />
        </Checkbox.Root>
        <Checkbox.Root
          aria-label="Disabled"
          disabled
          data-case="checkbox-disabled"
        >
          <Checkbox.Indicator />
        </Checkbox.Root>
        <Checkbox.Root
          aria-label="Disabled checked"
          disabled
          defaultChecked
          data-case="checkbox-disabled-checked"
        >
          <Checkbox.Indicator />
        </Checkbox.Root>
        <Field.Root invalid>
          <Checkbox.Root aria-label="Invalid" data-case="checkbox-invalid">
            <Checkbox.Indicator />
          </Checkbox.Root>
        </Field.Root>
        <Switch.Root aria-label="Off" data-case="switch">
          <Switch.Thumb />
        </Switch.Root>
        <Switch.Root aria-label="On" defaultChecked data-case="switch-checked">
          <Switch.Thumb />
        </Switch.Root>
        <Switch.Root
          aria-label="Disabled switch"
          disabled
          data-case="switch-disabled"
        >
          <Switch.Thumb />
        </Switch.Root>
        <Switch.Root
          aria-label="Read only switch"
          readOnly
          data-case="switch-readonly"
        >
          <Switch.Thumb />
        </Switch.Root>
        <RadioGroup.Root aria-label="Plan" defaultValue="team">
          <RadioGroup.Item value="free" data-case="radio">
            <RadioGroup.Indicator />
            Free
          </RadioGroup.Item>
          <RadioGroup.Item value="team" data-case="radio-checked">
            <RadioGroup.Indicator />
            Team
          </RadioGroup.Item>
          <RadioGroup.Item value="pro" disabled data-case="radio-disabled">
            <RadioGroup.Indicator />
            Pro
          </RadioGroup.Item>
        </RadioGroup.Root>
        <Field.Root invalid>
          <RadioGroup.Root aria-label="Invalid plan">
            <RadioGroup.Item value="a" data-case="radio-invalid">
              <RadioGroup.Indicator />
              Invalid
            </RadioGroup.Item>
          </RadioGroup.Root>
        </Field.Root>
      </section>
      <section aria-label="Slider states">
        <Slider.Root defaultValue={30}>
          <Slider.Label>Volume</Slider.Label>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb data-case="slider-thumb" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
        <Slider.Root defaultValue={60} disabled>
          <Slider.Label>Locked volume</Slider.Label>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb data-case="slider-thumb-disabled" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </section>
    </main>
  );
}
