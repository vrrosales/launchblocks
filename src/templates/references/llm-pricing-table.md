# LLM Pricing Table

Reference pricing for supported LLM providers. Prices are per 1M tokens unless noted.

> **Note:** Prices change frequently. Always verify current pricing at the provider's website.

## OpenAI

| Model | Input (per 1M) | Output (per 1M) | Context Window |
|---|---|---|---|
| gpt-4o | $2.50 | $10.00 | 128K |
| gpt-4o-mini | $0.15 | $0.60 | 128K |
| gpt-4-turbo | $10.00 | $30.00 | 128K |
| o1 | $15.00 | $60.00 | 200K |
| o1-mini | $1.10 | $4.40 | 128K |
| o3-mini | $1.10 | $4.40 | 200K |

**Pricing page:** https://openai.com/api/pricing

## Anthropic

| Model | Input (per 1M) | Output (per 1M) | Context Window |
|---|---|---|---|
| claude-sonnet-4-6 | $3.00 | $15.00 | 200K |
| claude-haiku-4-5 | $0.80 | $4.00 | 200K |
| claude-opus-4-6 | $15.00 | $75.00 | 200K |

**Pricing page:** https://www.anthropic.com/pricing

## Google

| Model | Input (per 1M) | Output (per 1M) | Context Window |
|---|---|---|---|
| gemini-2.0-flash | $0.10 | $0.40 | 1M |
| gemini-2.0-flash-lite | $0.02 | $0.10 | 1M |
| gemini-2.5-pro | $1.25 / $2.50 | $10.00 / $15.00 | 1M |

**Pricing page:** https://ai.google.dev/pricing

## Mistral

| Model | Input (per 1M) | Output (per 1M) | Context Window |
|---|---|---|---|
| mistral-large-latest | $2.00 | $6.00 | 128K |
| mistral-small-latest | $0.20 | $0.60 | 128K |
| codestral-latest | $0.30 | $0.90 | 256K |

**Pricing page:** https://mistral.ai/technology/#pricing

## Cohere

| Model | Input (per 1M) | Output (per 1M) | Context Window |
|---|---|---|---|
| command-r-plus | $2.50 | $10.00 | 128K |
| command-r | $0.15 | $0.60 | 128K |

**Pricing page:** https://cohere.com/pricing

## xAI

| Model | Input (per 1M) | Output (per 1M) | Context Window |
|---|---|---|---|
| grok-2 | $2.00 | $10.00 | 128K |
| grok-2-mini | $0.30 | $0.50 | 128K |

**Pricing page:** https://docs.x.ai/docs/models

## DeepSeek

| Model | Input (per 1M) | Output (per 1M) | Context Window |
|---|---|---|---|
| deepseek-chat | $0.14 | $0.28 | 64K |
| deepseek-reasoner | $0.55 | $2.19 | 64K |

**Pricing page:** https://platform.deepseek.com/api-docs/pricing

## Groq

| Model | Input (per 1M) | Output (per 1M) | Context Window |
|---|---|---|---|
| llama-3.3-70b-versatile | $0.59 | $0.79 | 128K |
| llama-3.1-8b-instant | $0.05 | $0.08 | 128K |
| mixtral-8x7b-32768 | $0.24 | $0.24 | 32K |

**Pricing page:** https://groq.com/pricing

## Cost Estimation Formula

The LLM audit log tracks costs using this formula:

```
estimated_cost = (input_tokens / 1_000_000 * input_price) + (output_tokens / 1_000_000 * output_price)
```

Store per-model pricing in your application config or database and update as prices change. The `llm_audit_log` table stores the `estimated_cost` for each request.

## Tips for Cost Management

1. **Use smaller models for simple tasks** — gpt-4o-mini and claude-haiku-4-5 are significantly cheaper
2. **Set max_tokens limits** on prompt templates to prevent runaway costs
3. **Monitor the audit dashboard** — the `llm_audit_summary` view aggregates costs by day/provider/model
4. **Cache responses** where appropriate — identical prompts with temperature=0 produce identical outputs
5. **Use streaming** for better UX without increasing costs (same token count, better perceived latency)
