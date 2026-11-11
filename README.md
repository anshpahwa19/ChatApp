# ChatApp

Next.js (App Router) + TypeScript implementation of the ChatApp mobile designs from Figma.

## Screens

| Route | Figma frame |
| --- | --- |
| `/` | **Main chat list**. Scrolling past the header shows the **Main chat list_scroll** compact header. The floating AI button opens the **AI Chat Assistant** sheet. |
| `/chat/[id]` | **Chat detail** with the floating glass header. The paperclip opens the **Attachments** sheet; the AI button opens the **AI Chat Assistant** sheet. |
| (sheet) | **AI Chat Assistant**. "Summarize chat" or a time-range chip switches the sheet to the **Chat Summary**. |

What works:

- Filter chips (All, Individual, Groups, Unread, Favourites).
- Tapping a chat opens it, and the back arrow returns to the list.
- Tab bar selection.
- Sending a message with Enter.
- Sheets (attachments, AI assistant, chat summary) close on outside click or Escape, and resize smoothly when switching views.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build + type check
```

## Structure

- `app/`: routes, plus `globals.css` with the design tokens taken from the Figma variables.
- `components/chat-list/`: chat list screen (header, stories, chips, rows, tab bar).
- `components/chat/`: chat screen (header, bubbles, voice notes, composer, attachment options).
- `components/ai/`: AI Chat Assistant and Chat Summary sheet content.
- `components/ui/`: shared pieces (device frame, status bar, avatar, read ticks, bottom sheet).
- `lib/data.ts`: mock data matching the designs. Swap it for API data later.
- `public/figma/`: icons and images exported from the Figma file.

Styling uses CSS Modules (no Tailwind). Fonts are Plus Jakarta Sans (via `@fontsource`) and the system SF font for the iOS status-bar and title text.
