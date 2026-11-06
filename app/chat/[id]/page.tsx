import { ChatScreen } from "@/components/chat/ChatScreen";
import { chats, getConversation } from "@/lib/data";

export function generateStaticParams() {
  return [{ id: "rehan" }, ...chats.map((c) => ({ id: c.id }))];
}

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatScreen conversation={getConversation(id)} />;
}
