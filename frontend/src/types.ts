// src/types.ts

import { Type } from "lucide-react";
import type { Node, Edge } from "reactflow";

// Define UUID and SessionId types for better clarity
export type UUID = string;

export type SessionId = UUID;

export interface ChatSession {
    id: UUID;
    title: string;
    createdAt: string;
}

export type Message = {
    role: 'user' | 'assistant'
    content: string
    flowSuggestion?: FlowSuggestion | null
    sources: string[] // Array of source IDs or names
}

export type FlowSuggestion = {
    flowId: string;
    title: string | null | undefined;
    confidence: number;
    sessionId: string;
}

export interface FlowState {
    flowId: string;
    prompt: any
}

export interface Flow {
    id: string;
    name: string;
    nodes: Node[];
    edges: Edge[];
    description?: string;
}

export type TypeHint =
  | { kind: 'text' }
  | { kind: 'link' }
  | { kind: 'json' }
  | { kind: 'html' }
  | { kind: 'list'; of: TypeHint }
  | { kind: 'struct'; name: 'listing_page' | 'listing' }
  | { kind: 'union'; anyOf: TypeHint[] }
  | { kind: 'any' };

export const tText = (): TypeHint => ({ kind: 'text' });
export const tLink = (): TypeHint => ({ kind: 'link' });
export const tList = (of: TypeHint): TypeHint => ({ kind: 'list', of });
export const tStruct = (name: 'listing_page' | 'listing' | 'page'): TypeHint => ({ kind: 'struct', name });
export const tAny = (): TypeHint => ({ kind: 'any' });
export const tUnion = (...anyOf: TypeHint[]): TypeHint => ({ kind: 'union', anyOf });

// ---- Envelope: the standardized runtime payload ----
export type Envelope =
  | { type: 'text'; value: string; meta?: any }
  | { type: 'link'; url: string; title?: string; meta?: any }
  | { type: 'json'; value: any; meta?: any }
  | { type: 'html'; value: string; meta?: any }
  | { type: 'list'; items: Envelope[]; item?: { type: string }; meta?: any }
  // domain structs:
  | { type: 'listing_page'; url: string; domain?: string; meta?: any }
  | { type: 'listing'; url: string; price?: number; beds?: number; address?: string; images?: string[]; meta?: any }
  // catch-all for future extension:
  | { type: string; [k: string]: any };

// ---- Type compatibility (used by the UI and runner) ----
export function isCompatible(out: TypeHint, need: TypeHint): boolean {
  if (!out || !need) return false;
  if (out.kind === 'any' || need.kind === 'any') return true;           // ← allow either side to be any
  if (need.kind === 'union') return need.anyOf.some(t => isCompatible(out, t));
  if (need.kind === 'list') return out.kind === 'list' && isCompatible(out.of, need.of);
  if (out.kind === 'list') return false; // scalar sink cannot accept a list
  if (need.kind === 'struct' && out.kind === 'struct') return out.name === need.name;
  return out.kind === need.kind;
}

// ---- Human-readable label for ports ----
export function hintLabel(h: TypeHint): string {
  switch (h.kind) {
    case 'list': return `list<${hintLabel(h.of)}>`;
    case 'struct': return h.name;
    case 'union': return h.anyOf.map(hintLabel).join(' | ');
    default: return h.kind;
  }
}
