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
