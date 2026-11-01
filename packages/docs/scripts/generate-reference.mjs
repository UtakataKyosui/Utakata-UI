import { mkdir, writeFile } from 'node:fs/promises';
import { componentManifest } from '@utakata-ui/react/manifest';

const componentsDirectory = new URL('../docs/components/', import.meta.url);
await mkdir(componentsDirectory, { recursive: true });

const pages = Object.entries(componentManifest.components).map(
  async ([name, component]) => {
    const slug = name.toLowerCase();
    await writeFile(
      new URL(`${slug}.mdx`, componentsDirectory),
      `---
title: ${name}
description: ${component.description}
---

${component.description}

## プレビュー

<Component path="${slug}" />

## 使い方

${component.composition}

${component.accessibility}

\`\`\`tsx
${component.example}
\`\`\`

## API・既定値・品質要件

\`\`\`json
${JSON.stringify({ ...component, sharedQualityRules: componentManifest.sharedQualityRules }, null, 2)}
\`\`\`

[コンポーネント一覧に戻る](../components)
`,
    );
    return `- [${name}](./components/${slug}) — ${component.description}`;
  },
);

await writeFile(
  new URL('../docs/components.md', import.meta.url),
  `---
title: コンポーネント
description: UI ライブラリの公開 manifest から生成した仕様です。
---

UI Component ごとのページで、操作できる実例・使い方・API・品質要件を確認できます。

${(await Promise.all(pages)).join('\n')}`,
);
