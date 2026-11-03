#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getComponent, listComponents, searchComponents } from './tools.js';

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

const server = new McpServer({
  name: 'utakata-ui',
  version,
});

server.registerTool(
  'list_components',
  {
    description: 'List the components and composition metadata in Utakata-UI.',
  },
  async () => ({
    content: [{ type: 'text', text: JSON.stringify(listComponents()) }],
  }),
);

server.registerTool(
  'get_component',
  {
    description:
      'Get the full manifest entry for a named Utakata-UI component.',
    inputSchema: { name: z.string().min(1) },
  },
  async ({ name }) => {
    const component = getComponent(name);

    if (!component) {
      return {
        content: [{ type: 'text', text: `Unknown component: ${name}` }],
        isError: true,
      };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(component) }],
    };
  },
);

server.registerTool(
  'search_components',
  {
    description:
      'Search component names, props, composition guidance, and accessibility requirements.',
    inputSchema: { query: z.string().trim().min(1) },
  },
  async ({ query }) => ({
    content: [{ type: 'text', text: JSON.stringify(searchComponents(query)) }],
  }),
);

await server.connect(new StdioServerTransport());
