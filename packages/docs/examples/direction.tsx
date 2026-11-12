import { Button, Card, Field, Input, Stack } from '@utakata-ui/react';

// 右から左へ読む領域は、その範囲に dir="rtl" と lang を指定します。
// 余白は論理プロパティ（inline-start/end）で書くと向きに追従します。
export default function DirectionExample() {
  return (
    <Stack style={{ gap: '1rem', maxWidth: '28rem' }}>
      <div dir="rtl" lang="ar">
        <Card.Root>
          <Card.Header>
            <Card.Title level="3">تسجيل الدخول</Card.Title>
          </Card.Header>
          <Card.Content>
            <Field.Root name="email">
              <Field.Label>البريد الإلكتروني</Field.Label>
              <Input type="email" autoComplete="email" />
            </Field.Root>
          </Card.Content>
          <Card.Footer>
            <Button style={{ marginInlineStart: 'auto' }}>متابعة</Button>
          </Card.Footer>
        </Card.Root>
      </div>
      <p>
        上の枠は <code>dir="rtl"</code>{' '}
        の例です。ボタンは論理プロパティで行末側に置いています。
      </p>
    </Stack>
  );
}
