---

title: Utakata-UI
description: A React and TypeScript UI framework for building well-designed interfaces on an accessible foundation
---

Utakata UI is a React and TypeScript UI component library built on Base UI and styled internally with Lism CSS. It is designed for **Agent Coding**, where you build interfaces together with AI agents.

## What Utakata UI aims for [#goals]

The main goal of Utakata UI is to **give you an environment for building well-designed interfaces while reliably and sufficiently ensuring accessibility**.

The foundation of any interface is that people can receive the information they need, understand how to operate it and complete what they set out to do. Keeping that foundation, Utakata UI aims to let you express your service's identity through how components are combined and styled.

### Component concept [#concept]

- **Build accessibility into component design.** Utakata UI emphasizes meaningful HTML, keyboard operation, focus management and associating names and descriptions.
- **Keep accessibility while you design.** Components with shared behavior and a styling system let you build well-designed interfaces.

## Built for Agent Coding [#agent-coding]

The intended workflow is that you describe the screen, design and interactions you want to an agent, and the agent selects, composes and implements components according to the public Utakata UI specification.

Utakata UI packages Base UI behavior and Lism CSS styling as Utakata UI components so agents can build interfaces from a shared design. Through the [component reference](/en/components) and [MCP](/en/mcp), agents can look up the public API, supported Props, composition and accessibility notes.

## Documentation [#documentation]

- Getting started: [Installation](/en/getting-started), [Theme colors](/en/theming)
- Components: [Component list](/en/components), [UI preview](/en/components/preview)
- AI agents: [Using MCP](/en/mcp)
- Advanced: [Copying and modifying source](/en/registry)

## Accessibility [#accessibility]

The goal is to meet the applicable WCAG 2.2 Level A and AA success criteria. Beyond component behavior and verification, the accessibility of a real screen also depends on you checking the wording, page structure, component composition and custom styles.

The maintainers provide verification procedures for keyboard operation, focus and contrast in real browsers and for screen reader output, in addition to automated checks. Passing automated checks does not guarantee overall WCAG conformance.
