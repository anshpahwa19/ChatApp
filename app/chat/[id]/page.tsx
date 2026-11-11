import { chats } from "@/lib/data";

export function generateStaticParams() {
  return [{ id: "rehan" }, ...chats.map((c) => ({ id: c.id }))];
}

// The chat is pushed by the Navigator in the root layout; this route only sets the URL.
export default function ChatPage() {
  return null;
}
