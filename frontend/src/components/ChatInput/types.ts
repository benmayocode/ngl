// frontend/src/components/ChatInput/types.ts
import { Message, FlowState, FlowSuggestion } from "../../types";

export interface ChatInputProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  chatHistory: Message[];
  setChatHistory: React.Dispatch<React.SetStateAction<Message[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  sessionId: string | null;
  flowState: FlowState | null;
  setFlowState: React.Dispatch<React.SetStateAction<FlowState | null>>;
  flowSuggestion: FlowSuggestion | null;
  setFlowSuggestion: React.Dispatch<React.SetStateAction<FlowSuggestion | null>>;
}