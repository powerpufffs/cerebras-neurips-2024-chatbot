<a href="https://chat.vercel.ai/">
  <img alt="AI-powered NEURIPS 2024 paper directory" src="app/(chat)/opengraph-image.png">
  <h1 align="center">Chatting Your Way Through NEURIPS 2024</h1>
</a>

<p align="center">
  A helpful directory of all the papers from NEURIPS 2024, powered with lightning fast inference from Cerebras.
</p>

## Environment Variables

This project requires the following environment variables to be set in your `.env` file:

| Variable | Description |
|----------|-------------|
| `CEREBRAS_API_KEY` | Your Cerebras API key for accessing their inference API |
| `POSTGRES_URL` | PostgreSQL connection string for the database |
| `HUGGINGFACE_API_KEY` | HuggingFace API key for additional model access |

You can obtain these keys from:
- Cerebras API Key: Contact Cerebras for access
- PostgreSQL URL: Set up a PostgreSQL database (e.g. via Vercel Postgres or Supabase)
- HuggingFace API Key: Get from [HuggingFace settings](https://huggingface.co/settings/tokens)

Create a `.env` file in the root directory and add these variables:
