// src/types.ts

import { Type } from "lucide-react";

export interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
}

export type Message = {
    role: 'user' | 'assistant'
    content: string
}

export type FlowSuggestion = {
    flowId: string;
    title: string;
    confidence: number;
    sessionId: string;
}

export interface FlowState {
    flowId: string;
    prompt: any
}