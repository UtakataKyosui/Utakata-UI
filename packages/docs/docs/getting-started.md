---

title: 導入方法
description: Utakata-UI を React アプリケーションで使う
---

React 18.3.1 以降を使用します。現在は開発段階のため、このリポジトリのワークスペース内で利用できます。

```tsx
import { Button, Dialog, Field } from '@utakata-ui/react';
import '@utakata-ui/react/styles.css';

export function Example() {
  return <Button variant="solid">保存</Button>;
}
```

Button・Field・Dialog と、Box・Stack・Flex・Grid・Container・Text・Heading を公開しています。

対応する Props・構成例・品質要件は[コンポーネント仕様](./components)を参照してください。
