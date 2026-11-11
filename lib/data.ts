// Mock data that mirrors the content in the Figma designs.
// Replace with real API data when a backend is added.

export type Story = {
  id: string;
  name: string;
  image: string;
  isOwn?: boolean;
  unseen?: boolean;
};

export type AvatarSpec =
  | { kind: "image"; src: string }
  | { kind: "initials"; initials: string; bg: string; fg: string }
  | { kind: "stylised"; variant: "group" | "contact" | "community" };

export type PreviewIcon = "deleted" | "missed-call" | "voice";

export type ChatPreview = {
  id: string;
  name: string;
  avatar: AvatarSpec;
  time: string;
  /** Unread timestamps are shown in brand green and bold. */
  unread?: number;
  /** Shows "3 >" style indicator used for communities. */
  communityCount?: number;
  ticks?: "seen" | "received";
  author?: string;
  message: string;
  previewIcon?: PreviewIcon;
  /** Community sub-group arrow, e.g. "Group 1 > message". */
  subGroup?: string;
  danger?: boolean;
  type: "individual" | "group";
  favourite?: boolean;
};

export const stories: Story[] = [
  { id: "me", name: "Add Story", image: "/figma/story-add.jpg", isOwn: true },
  { id: "yoga", name: "Yoga", image: "/figma/story-yoga.jpg", unseen: true },
  { id: "dono", name: "Dono", image: "/figma/story-dono.jpg" },
  { id: "scott", name: "Scott", image: "/figma/story-scott.jpg" },
  { id: "sarah", name: "Sarah", image: "/figma/story-sarah.jpg" },
  { id: "mike", name: "Mike", image: "/figma/story-mike.jpg" },
];

export const chats: ChatPreview[] = [
  {
    id: "shivam",
    name: "Shivam Srivastava",
    avatar: { kind: "image", src: "/figma/avatar-shivam.png" },
    time: "12:12",
    unread: 1,
    message: "Is there an update on hiring?",
    type: "individual",
    favourite: true,
  },
  {
    id: "garvit",
    name: "Garvit Bhati",
    avatar: { kind: "initials", initials: "GB", bg: "#cdeaa2", fg: "#415228" },
    time: "12:12",
    unread: 999,
    message: "Hello, I am coming from delhi",
    type: "individual",
  },
  {
    id: "yogesh",
    name: "Yogesh Rawat",
    avatar: { kind: "image", src: "/figma/avatar-yogesh.png" },
    time: "28/09/26",
    ticks: "seen",
    message: "Hello, I havent recieved an update yet about you",
    type: "individual",
  },
  {
    id: "scuba",
    name: "Scuba Practice",
    avatar: { kind: "image", src: "/figma/avatar-scuba.png" },
    time: "Yesterday",
    ticks: "seen",
    message: "You : I am going to Koh Tao Today",
    type: "group",
    favourite: true,
  },
  {
    id: "running",
    name: "Running Group",
    avatar: { kind: "initials", initials: "RG", bg: "#f3caca", fg: "#a0317b" },
    time: "12:12",
    unread: 1,
    author: "Himanshu",
    message: "I got new shoes today",
    type: "group",
  },
  {
    id: "test-community-2",
    name: "Test Community 2",
    avatar: { kind: "initials", initials: "TG", bg: "#e2caf3", fg: "#a0317b" },
    time: "",
    communityCount: 3,
    message: "Group 1, Group 2, General",
    type: "group",
  },
  {
    id: "franceska",
    name: "Franceska",
    avatar: { kind: "image", src: "/figma/avatar-franceska.png" },
    time: "12:12",
    unread: 1,
    message: "Going for the sunset?",
    type: "individual",
  },
  {
    id: "anton",
    name: "Anton Toye",
    avatar: { kind: "image", src: "/figma/avatar-anton.png" },
    time: "12:12",
    unread: 1,
    message: "I will be leaving for practice rn",
    type: "individual",
  },
  {
    id: "test-community-1",
    name: "Test Community 1",
    avatar: { kind: "stylised", variant: "community" },
    time: "",
    unread: 1,
    subGroup: "Group 1",
    message: "In stock God of War Ragnarok, please contact",
    type: "group",
  },
  {
    id: "running-2",
    name: "Running Group",
    avatar: { kind: "stylised", variant: "group" },
    time: "12:12",
    unread: 1,
    author: "Himanshu",
    message: "I got new shoes today",
    type: "group",
  },
  {
    id: "contact-1",
    name: "+91 9345 76655",
    avatar: { kind: "stylised", variant: "contact" },
    time: "12:12",
    ticks: "seen",
    previewIcon: "deleted",
    message: "I think i will delete this account",
    type: "individual",
  },
  {
    id: "contact-2",
    name: "+91 9345 76655",
    avatar: { kind: "stylised", variant: "contact" },
    time: "12:12",
    previewIcon: "missed-call",
    message: "Missed call",
    danger: true,
    type: "individual",
  },
  {
    id: "contact-3",
    name: "+91 9345 76655",
    avatar: { kind: "stylised", variant: "contact" },
    time: "12:12",
    previewIcon: "voice",
    message: "Voice Note",
    type: "individual",
  },
];

export type Message =
  | { id: string; kind: "date"; label: string }
  | {
      id: string;
      kind: "text";
      from: "me" | "them";
      text: string;
      time: string;
      /** Timestamp sits on its own line under the text (vs. inline). */
      timeBelow?: boolean;
      replyable?: boolean;
      forwarded?: boolean;
      highlight?: boolean;
      /** Read-receipt colour for messages I sent. */
      ticks?: "seen" | "delivered";
    }
  | {
      id: string;
      kind: "voice";
      from: "me" | "them";
      duration: string;
      time: string;
      listened?: boolean;
    };

export type Conversation = {
  id: string;
  name: string;
  status: string;
  avatar: string;
  messages: Message[];
};

export const conversation: Conversation = {
  id: "rehan",
  name: "Rehan Wangsaff",
  status: "Online",
  avatar: "/figma/avatar-rehan.png",
  messages: [
    { id: "d1", kind: "date", label: "Yesterday" },
    { id: "m1", kind: "text", from: "them", text: "Awesome! Want to grab coffee later?", time: "23:01", timeBelow: true },
    { id: "m2", kind: "text", from: "me", text: "Brooooo I still can’t get over that trip 😭✈️", time: "23:01", ticks: "seen" },
    { id: "m3", kind: "text", from: "me", text: "I'm great! Just finished a project. How about you?", time: "23:01", ticks: "delivered" },
    { id: "d2", kind: "date", label: "Today" },
    { id: "m4", kind: "text", from: "them", text: "Sure! How about 3pm at the usual place?", time: "23:01", replyable: true },
    { id: "m5", kind: "voice", from: "me", duration: "0:23", time: "23:01", listened: true },
    { id: "m6", kind: "voice", from: "me", duration: "0:23", time: "23:01" },
    { id: "m7", kind: "text", from: "me", text: "Happy New Year! 🥳", time: "23:01", forwarded: true, highlight: true, ticks: "seen" },
  ],
};

export function getConversation(id: string): Conversation {
  const chat = chats.find((c) => c.id === id);
  if (!chat || id === conversation.id) return conversation;
  return {
    ...conversation,
    id,
    name: chat.name,
    avatar: chat.avatar.kind === "image" ? chat.avatar.src : conversation.avatar,
  };
}

// ---- AI assistant -----------------------------------------------------------

export type SummaryRange = "2h" | "4h" | "6h" | "24h" | "since-last";

export const summaryRanges: { id: SummaryRange; label: string; description: string }[] = [
  { id: "2h", label: "Last 2h", description: "Summary of the last 2 hours" },
  { id: "4h", label: "Last 4h", description: "Summary of the last 4 hours" },
  { id: "6h", label: "Last 6h", description: "Summary of the last 6 hours" },
  { id: "24h", label: "Last 24h", description: "Summary of the last 24 hours" },
  { id: "since-last", label: "Since last summary", description: "Summary since your last summary" },
];

/** Placeholder summary content from the Figma "Chat Summary" sheet. */
export const chatSummary = {
  missed: "Sarah Chen confirmed tomorrow's meeting at 3 PM and requested bring snacks Too. Fix date added for tomorrow.",
  decisions: ["Contract needs signatures tomorrow at 3 PM", "Fix date added for tomorrow."],
  actions: ["Contract needs signatures tomorrow at 3 PM", "Fix date added for tomorrow."],
  deadlines: [{ text: "Contract needs signatures tomorrow at 3 PM", dueToday: true }],
};
