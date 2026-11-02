import { Button, Card, Field, Grid } from '@utakata-ui/react';

export default function CardExample() {
  return (
    <Grid
      style={{
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
      }}
    >
      <Card.Root>
        <Card.Header>
          <Card.Title>プロフィール</Card.Title>
          <Card.Description>公開情報を編集</Card.Description>
        </Card.Header>
        <Card.Content>
          <Field.Root>
            <Field.Label>表示名</Field.Label>
            <Field.Control defaultValue="綾" />
          </Field.Root>
        </Card.Content>
        <Card.Footer>
          <Button>保存</Button>
        </Card.Footer>
      </Card.Root>
      <Card.Root>
        <Card.Title level="4">お知らせ</Card.Title>
        <Card.Content>
          長い本文でも内側の余白を保ったまま折り返します。Cardそのものはクリックできず、操作は内側のボタンやリンクが担当します。
        </Card.Content>
      </Card.Root>
    </Grid>
  );
}
