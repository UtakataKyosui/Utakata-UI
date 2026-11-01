import { writeFile } from 'node:fs/promises';
import { componentManifest } from '@utakata-ui/react/manifest';

const pages = Object.entries(componentManifest.components).map(
  ([name, component]) => `## ${name}

${component.description}

${component.composition}

${component.accessibility}

\`\`\`tsx
${component.example}
\`\`\`

### API・既定値・品質要件

\`\`\`json
${JSON.stringify({ ...component, sharedQualityRules: componentManifest.sharedQualityRules }, null, 2)}
\`\`\`
`,
);

await writeFile(
  new URL('../docs/components.md', import.meta.url),
  `---
title: コンポーネント
description: UI ライブラリの公開 manifest から生成した仕様です。
---

${pages.join('\n')}`,
);
