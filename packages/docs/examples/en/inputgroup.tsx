import { Field, Input, InputGroup, Stack, Textarea } from '@utakata-ui/react';
import { useId } from 'react';

export default function InputGroupExample() {
  const priceUnitId = useId();
  const commentLimitId = useId();
  return (
    <Stack style={{ gap: '1.5rem', maxWidth: '28rem' }}>
      <Field.Root name="query">
        <Field.Label>Search</Field.Label>
        <InputGroup.Root>
          <InputGroup.Addon>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
              <circle
                cx="7"
                cy="7"
                r="5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M11 11l4 4" stroke="currentColor" strokeWidth="2" />
            </svg>
          </InputGroup.Addon>
          <Input type="search" />
          <InputGroup.Addon align="inline-end">
            <InputGroup.Button>Search</InputGroup.Button>
          </InputGroup.Addon>
        </InputGroup.Root>
      </Field.Root>
      <Field.Root name="price">
        <Field.Label>Price</Field.Label>
        <InputGroup.Root>
          <Input inputMode="numeric" aria-describedby={priceUnitId} />
          <InputGroup.Addon align="inline-end">
            <InputGroup.Text id={priceUnitId}>
              JPY (tax included)
            </InputGroup.Text>
          </InputGroup.Addon>
        </InputGroup.Root>
      </Field.Root>
      <Field.Root name="comment">
        <Field.Label>Comment</Field.Label>
        <InputGroup.Root>
          <Textarea maxLength={200} aria-describedby={commentLimitId} />
          <InputGroup.Addon align="block-end">
            <InputGroup.Text id={commentLimitId}>
              Up to 200 characters
            </InputGroup.Text>
          </InputGroup.Addon>
        </InputGroup.Root>
      </Field.Root>
      <Field.Root name="site" disabled>
        <Field.Label>Website URL (disabled)</Field.Label>
        <InputGroup.Root>
          <InputGroup.Addon>
            <InputGroup.Text>https://</InputGroup.Text>
          </InputGroup.Addon>
          <Input defaultValue="example.com" />
        </InputGroup.Root>
      </Field.Root>
    </Stack>
  );
}
