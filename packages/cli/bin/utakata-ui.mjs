#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { projectOptions } from '../src/config.mjs';
import {
  addComponents,
  initializeProject,
  listComponents,
} from '../src/install.mjs';

if (process.argv[2] === 'a11y') {
  const { runA11y } = await import('../dist/a11y/cli.js');
  process.exitCode = await runA11y(process.argv.slice(3));
} else {
  try {
    const { values, positionals } = parseArgs({
      allowPositionals: true,
      options: {
        registry: { type: 'string' },
        cwd: { type: 'string' },
        dir: { type: 'string' },
        palette: { type: 'string' },
        'dry-run': { type: 'boolean' },
        overwrite: { type: 'boolean' },
        'no-install': { type: 'boolean' },
        'package-manager': { type: 'string' },
        help: { type: 'boolean', short: 'h' },
      },
    });
    if (values.help || !positionals.length) {
      console.log(
        'Utakata UI (Base UI + Lism CSS)\n\n  utakata-ui init --registry <URL or directory> [--dir src/components/utakata] [--cwd path] [--palette <JSON>] [--dry-run] [--overwrite] [--no-install] [--package-manager npm|pnpm|yarn|bun]\n  utakata-ui list [--registry <URL or directory>] [--cwd path]\n  utakata-ui add <name...> [--registry <URL or directory>] [--dir path] [--cwd path] [--dry-run] [--overwrite]\n  utakata-ui a11y --config <path> [--json]\n\ninit saves registry and directory defaults in utakata.json.\ninit installs Base UI and Lism CSS with the detected package manager. Use --no-install to only generate files; --dry-run never installs.',
      );
    } else {
      const [command, ...names] = positionals;
      if (!['init', 'list', 'add'].includes(command))
        throw new Error(`Unknown command: ${command}`);
      if (values.palette !== undefined && command !== 'init')
        throw new Error('--palette is only supported by init');
      if (
        (values['no-install'] || values['package-manager']) &&
        command !== 'init'
      )
        throw new Error(
          '--no-install and --package-manager are only supported by init',
        );
      if (command !== 'add' && names.length)
        throw new Error(`${command} does not accept component names`);
      if (command === 'list') {
        const { registry } = await projectOptions({
          registry: values.registry,
          directory: values.dir,
          cwd: values.cwd,
        });
        for (const item of await listComponents(registry))
          console.log(`${item.name}\t${item.title}`);
      } else {
        const result = await (command === 'init'
          ? initializeProject
          : addComponents)({
          registry: values.registry,
          names,
          palette: values.palette,
          cwd: values.cwd,
          directory: values.dir,
          dryRun: values['dry-run'],
          overwrite: values.overwrite,
          install: !values['no-install'],
          packageManager: values['package-manager'],
        });
        for (const file of result.files)
          console.log(
            `${values['dry-run'] ? '[dry-run] ' : ''}${file.action}\t${file.target}`,
          );
        console.log(
          `\n${result.dependencyInstallation?.executed ? 'Installed dependencies' : 'Install dependencies'}: ${result.dependencyInstallation?.manager ?? 'pnpm'} ${result.dependencyInstallation?.manager === 'npm' ? 'install' : 'add'} ${Object.entries(
            result.dependencies,
          )
            .map(([name, version]) => `${name}@${version}`)
            .join(' ')}`,
        );
        console.log(
          `Import ${result.stylesheet ?? 'the generated styles/styles.css'} once from your global entry. Preserve labels, focus behavior and contrast when customizing.`,
        );
        if (command === 'init')
          console.log('Next: utakata-ui add button (use --cwd again if set).');
      }
    }
  } catch (error) {
    console.error(`Utakata UI: ${error.message}`);
    process.exitCode = 1;
  }
}
