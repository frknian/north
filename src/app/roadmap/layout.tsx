import type { Metadata } from "next";

export const metadata: Metadata = { title: "Yol Haritası" };

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
