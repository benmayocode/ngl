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