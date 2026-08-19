import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PostStreak",
  description: "AI-powered social media scheduling & streak-tracking for African creators",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
