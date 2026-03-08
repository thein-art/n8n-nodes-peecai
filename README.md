# n8n-nodes-peecai

n8n community node for the [Peec.ai](https://peec.ai) API — AI Search Analytics for brand visibility, sentiment, and citations across ChatGPT, Perplexity, and other AI models.

> **Note:** This is an unofficial community project, not affiliated with or endorsed by Peec.ai.

## Installation

In your n8n instance, go to **Settings > Community Nodes** and install:

```
n8n-nodes-peecai
```

## Credentials

1. Sign up at [app.peec.ai](https://app.peec.ai)
2. Create an API key under **Settings > API Keys**
3. In n8n, create a new **Peec.ai API** credential and paste your API key

## Resources & Operations

| Resource | Operations | Description |
|----------|-----------|-------------|
| Project | Get Many | List all projects |
| Brand | Get Many | List tracked brands with domains |
| Prompt | Get Many | List monitored search prompts |
| Tag | Get Many | List category tags |
| Topic | Get Many | List topic groupings |
| Model | Get Many | List tracked AI models |
| Chat | Get Many, Get Content | List chats or get full chat content |
| Brand Report | Get | Brand visibility, sentiment, position, share of voice |
| Domain Report | Get | Domain-level citation analytics |
| URL Report | Get | URL-level citation analytics |

### Report Options

All report resources support:
- **Dimensions**: Break down by prompt, model, tag, or topic
- **Date filtering**: Start/end date (YYYY-MM-DD)
- **Filters**: Server-side filtering by field (e.g. `brand_id`, `classification`)

## License

[MIT](./LICENSE)

---

Built by [Tobias Hein](https://github.com/thein-art) at [artaxo](https://artaxo.com).
