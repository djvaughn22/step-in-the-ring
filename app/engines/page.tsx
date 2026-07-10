import type { Metadata } from "next";
import EngineSystem from "./EngineSystem";

export const metadata: Metadata = {
  title: "Engine Room — Step In The Ring",
  description:
    "Pick an engine, answer your real situation, and get a detailed build package you can hand to Claude Code or anyone. Return with results and generate the next focused cycle.",
};

export default function EnginesPage() {
  return <EngineSystem />;
}
