import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect, vi } from 'vitest';
import {
  Accordion,
  type AccordionRootProps,
} from '../../components/Accordion.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

const items = ['Shipping', 'Returns', 'Payment'];

function Faq(props: AccordionRootProps & { disabledItem?: string }) {
  const { disabledItem, ...rootProps } = props;
  return (
    <Accordion.Root {...rootProps}>
      {items.map((item) => (
        <Accordion.Item
          key={item}
          value={item}
          disabled={item === disabledItem}
        >
          <Accordion.Header>
            <Accordion.Trigger>{item}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <a href={`#${item}`}>{item} details</a>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

const trigger = (name: string) => screen.getByRole('button', { name });
const expanded = () =>
  items.filter(
    (name) => trigger(name).getAttribute('aria-expanded') === 'true',
  );

function Controlled() {
  const [value, setValue] = useState<string[]>(['Returns']);
  return (
    <>
      <Faq value={value} onValueChange={setValue} />
      <output>{value.join(',') || 'none'}</output>
    </>
  );
}

export const accordionChecks: Record<string, QualityCheck> = {
  'accordion.header-trigger': async () => {
    const { container } = render(<Faq />);
    for (const name of items) {
      expect(trigger(name).parentElement?.tagName).toBe('H3');
      expect(trigger(name)).toHaveAttribute('aria-expanded', 'false');
    }
    expect((await audit(container)).violations).toEqual([]);
    fireEvent.click(trigger('Shipping'));
    const panel = screen.getByRole('region', { name: 'Shipping' });
    expect(trigger('Shipping')).toHaveAttribute('aria-controls', panel.id);
    expect((await audit(container)).violations).toEqual([]);
  },
  'accordion.expansion-modes': () => {
    const single = render(<Faq />);
    expect(expanded()).toEqual([]);
    fireEvent.click(trigger('Shipping'));
    fireEvent.click(trigger('Returns'));
    expect(expanded()).toEqual(['Returns']);
    single.unmount();
    const multiple = render(<Faq multiple defaultValue={['Payment']} />);
    expect(expanded()).toEqual(['Payment']);
    fireEvent.click(trigger('Shipping'));
    expect(expanded()).toEqual(['Shipping', 'Payment']);
    multiple.unmount();
    render(<Controlled />);
    expect(expanded()).toEqual(['Returns']);
    fireEvent.click(trigger('Returns'));
    expect(expanded()).toEqual([]);
    expect(screen.getByText('none')).toBeInTheDocument();
  },
  'accordion.disabled-tab-order': () => {
    const onValueChange = vi.fn();
    render(<Faq disabledItem="Returns" onValueChange={onValueChange} />);
    for (const name of ['Shipping', 'Payment']) {
      expect(trigger(name).tagName).toBe('BUTTON');
      expect(trigger(name)).not.toHaveAttribute('tabindex', '-1');
    }
    const disabled = trigger('Returns');
    expect(disabled).toBeDisabled();
    fireEvent.click(disabled);
    expect(disabled).toHaveAttribute('aria-expanded', 'false');
    expect(onValueChange).not.toHaveBeenCalled();
  },
  'accordion.closed-content': async () => {
    const { container } = render(<Faq keepMounted />);
    expect(screen.queryByRole('link')).toBeNull();
    for (const link of container.querySelectorAll('a'))
      expect(link.closest('[hidden]')).not.toBeNull();
    fireEvent.click(trigger('Payment'));
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect((await audit(container)).violations).toEqual([]);
  },
};
