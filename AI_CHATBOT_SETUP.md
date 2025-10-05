# AI Chatbot Setup Guide

## Quick Setup for Team Members

When you pull this repository, the AI Chatbot won't work immediately because the API key is stored in `.env.local` which is not committed to git for security reasons.

### Steps to Enable the AI Chatbot:

1. **Create a `.env.local` file** in the project root directory:
   ```bash
   # Copy the example file
   cp .env.example .env.local
   ```

2. **Add the API key** - Open `.env.local` and replace `your_api_key_here` with the actual API key:
   ```bash
   VITE_DEEPSEEK_API_KEY=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
   VITE_DEEPSEEK_MODEL=deepseek/deepseek-chat
   VITE_DEEPSEEK_API_URL=https://openrouter.ai/api/v1/chat/completions
   ```

   > **Note:** Ask the team lead for the current API key if you don't have it.

3. **Restart the dev server**:
   ```bash
   npm run dev
   ```

4. **Test the chatbot**:
   - Open http://localhost:8081/
   - Look for the bright blue circular button in the bottom-right corner
   - Click it and ask a weather question!

## How It Works

- The chatbot button appears as a floating blue circle in the bottom-right
- Hover over it to see "AI Chatbot" text expand
- Click to open the AI assistant panel
- The AI uses live weather data to provide context-aware responses

## Troubleshooting

### "Missing API key" error
- Make sure you created `.env.local` in the project root
- Verify the file contains `VITE_DEEPSEEK_API_KEY=sk-or-v1-...`
- Restart the dev server after creating/editing `.env.local`

### Chatbot button doesn't appear
- Check browser console for errors (F12)
- Make sure you're on the latest branch
- Try clearing browser cache and refreshing

### API errors
- Verify the API key is correct and hasn't expired
- Check that you're using the correct API endpoint for your key type
- OpenRouter keys start with `sk-or-v1-`

## Security Notes

- **Never commit `.env.local` to git** - It's in `.gitignore` for security
- Share API keys securely (encrypted channels, password managers, etc.)
- Each team member can use the same shared key for development
- For production, use environment-specific keys
