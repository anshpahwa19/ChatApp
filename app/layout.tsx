import type { Metadata, Viewport } from "next";
import { Navigator } from "@/components/nav/Navigator";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatApp",
  description: "Chat app built from the Figma designs",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#8e85bf",
};

// The navigation stack lives in the root layout so it survives route changes: the pages only
// set the URL, and the Navigator animates between the chat list and the chat it names.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navigator />
        {children}
      </body>
    </html>
  );
}
