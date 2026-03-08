[![npm version](https://img.shields.io/npm/v/n8n-nodes-peecai.svg)](https://www.npmjs.com/package/n8n-nodes-peecai)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-peecai.svg)](https://www.npmjs.com/package/n8n-nodes-peecai)
[![License: MIT](https://img.shields.io/npm/l/n8n-nodes-peecai.svg)](https://opensource.org/licenses/MIT)
[![n8n community node](https://img.shields.io/badge/n8n-community%20node-ff6d5a)](https://docs.n8n.io/integrations/community-nodes/)

# n8n-nodes-peecai

This is an n8n community node for the [Peec AI](https://peec.ai) API. It lets you monitor and analyze your brand visibility across AI search engines like ChatGPT, Perplexity, Gemini, and others — directly from your n8n workflows.

[Peec AI](https://peec.ai) is an AI Search Analytics platform that tracks how brands appear in AI-generated answers, including citations, sentiment, and competitive positioning.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

> **Note:** This is an unofficial community node, not affiliated with or endorsed by Peec AI.

[Installation](#installation) | [Credentials](#credentials) | [Operations](#operations) | [Usage](#usage) | [Compatibility](#compatibility) | [Resources](#resources) | [Version History](#version-history)

## Installation

### Community Nodes (Recommended)

For users on n8n v1.0+, you can install this node directly from the n8n editor:

1. Open your n8n editor
2. Go to **Settings > Community Nodes**
3. Search for `n8n-nodes-peecai`
4. Click **Install**

For more details, see the [n8n community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

### Manual Installation

Navigate to your n8n installation directory and run:

```bash
npm install n8n-nodes-peecai
```

Then restart your n8n instance.

## Credentials

You need a Peec AI API key to use this node.

1. Sign up at [app.peec.ai](https://app.peec.ai)
2. Navigate to **Settings > API Keys** and create a new key
3. In n8n, go to **Credentials > New Credential > Peec AI API**
4. Paste your API key and save

The credential is automatically validated against the Peec AI API when you save it.

## Operations

### 1. Projects & Configuration

- **Project — Get Many**: List all monitoring projects in your Peec AI account

### 2. Monitoring Data

- **Brand — Get Many**: List tracked brands and their associated domains for a project
- **Prompt — Get Many**: List search prompts used for AI search monitoring
- **Tag — Get Many**: List tags for organizing prompts and reports
- **Topic — Get Many**: List topic categories used for analysis grouping
- **Model — Get Many**: List monitored AI models (ChatGPT, Perplexity, Gemini, etc.)

### 3. Chat Interactions

- **Chat — Get Many**: List tracked AI chat interactions with date filtering
- **Chat — Get Content**: Retrieve the full content and messages of a specific chat

### 4. Analytics Reports

- **Brand Report — Get**: Brand visibility, sentiment, competitive position, and share of voice across AI models
- **Domain Report — Get**: Domain-level citation frequency and visibility analytics
- **URL Report — Get**: URL-level citation tracking and visibility analytics

All reports support:

- **Dimensions** — Break down results by AI model, search prompt, tag, or topic
- **Date range** — Filter by start and end date using a date picker
- **Filters** — Server-side filtering by brand, model, tag, topic, prompt, or classification

### Pagination

All "Get Many" operations include a **Return All** toggle:

- **On**: Automatically paginates through all available results
- **Off**: Returns up to the specified **Limit** (default: 50) with optional **Offset**

## Usage

### Basic Workflow

1. Add a **Peec AI** node to your workflow
2. Select a resource (e.g. Brand Report) and operation
3. Choose your project from the dropdown
4. Configure date range, dimensions, and filters as needed
5. Execute the node to retrieve your analytics data

### AI Agent Integration

This node has `usableAsTool` enabled, which means it can be used as a tool by n8n's [AI Agent](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/) node. This allows AI agents to query Peec AI data autonomously as part of a conversation or reasoning chain.

### Example Use Cases

- **Automated reporting** — Schedule daily or weekly brand visibility reports and send them via email or Slack
- **Alert on changes** — Monitor brand sentiment and trigger alerts when it drops below a threshold
- **Competitive analysis** — Compare brand positioning across AI models over time
- **Data pipeline** — Feed Peec AI analytics into a data warehouse or dashboard tool

## Compatibility

| Requirement | Version |
|-------------|---------|
| n8n | >= 1.85.0 |
| Node.js | >= 22.16 |

Requires n8n 1.85.0+ due to `NodeConnectionTypes` and `usableAsTool` support. Tested with n8n v2.9.x (self-hosted Docker).

## Resources

- [Peec AI Website](https://peec.ai)
- [Peec AI App](https://app.peec.ai)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [n8n Community Forum](https://community.n8n.io/)

## Development

```bash
git clone https://github.com/thein-art/n8n-nodes-peecai.git
cd n8n-nodes-peecai
npm install
npm run build    # Build with n8n node CLI
npm run lint     # Lint with n8n node linter rules
npm run dev      # Watch mode for development
```

## Version History

### 0.3.2
- Fixed release pipeline: merged publish into release workflow
- Updated GitHub Actions to v6 (checkout, setup-node)
- Bumped @types/node to v25

### 0.3.1
- CI/CD pipeline: automated releases via git tags, npm publish with OIDC trusted publishing
- Added Dependabot for dependency updates

### 0.3.0
- Refactored node to resource-based file structure
- Added n8n node linter compliance
- Improved error handling and parameter descriptions

### 0.2.0
- Synced types with Peec AI API spec
- Added server-side filters and drift detection for reports
- Added dimensions support for analytics breakdown

### 0.1.0
- Initial release with full Peec AI API coverage
- 10 resources: Project, Brand, Prompt, Tag, Topic, Model, Chat, Brand Report, Domain Report, URL Report
- Dynamic project dropdown with API validation
- Automatic pagination with Return All toggle
- AI Agent compatibility (`usableAsTool`)

## License

[MIT](./LICENSE)

---

Built by [Tobias Hein](https://github.com/thein-art) at [artaxo](https://artaxo.com).
