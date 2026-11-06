import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatApp",
  description: "Chat app built from the Figma designs",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#296072",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
