import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build Your First App",
  description:
    "A 6-round beginner coach for building your first web app. No login, no database — progress saves on your device.",
};

export default function BuildLayout({ children }: { children: React.ReactNode }) {
  return children;
}
