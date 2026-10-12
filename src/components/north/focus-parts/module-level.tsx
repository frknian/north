"use client";



export type Timer = {
  id: string;
  started: number;
  beganAt?: number;
  accumulated: number;
  running: boolean;
  pauses?: number;
};

export interface BrainDumpItem {
  id: string;
  text: string;
  createdAt: string;
  done?: boolean;
}

export const BRAIN_DUMP_KEY = "north:brain_dump_items";
