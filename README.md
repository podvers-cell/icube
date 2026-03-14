<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/abe179e8-0f91-4259-aeb9-3dde641fb053

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Using Claude / Cursor AI for development

- **Chat:** Use the chat panel to ask questions, get explanations, or request code snippets. Reference files with `@filename` or `@folder` for context.
- **Composer (Agent):** Press **Cmd+I** (Mac) or **Ctrl+I** (Windows/Linux) to open Composer. Describe what you want (e.g. “add a dark mode toggle”); the AI can edit files and run commands. Use **Agent mode** when you want it to apply changes.
- **Ask vs Agent:** In **Ask mode** the AI only answers and suggests. Switch to **Agent mode** when you want it to edit code automatically.
- **Model:** In Cursor go to **Settings → Models** to choose Claude or another model for chat and Composer.
