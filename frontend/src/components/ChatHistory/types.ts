import type { Message, FlowState, FlowSuggestion, SessionId } from '../../types';

export interface ChatHistoryProps {
  chatHistory: Message[];
  loading: boolean;

  flowState: FlowState | null;
  setFlowState: React.Dispatch<React.SetStateAction<FlowState | null>>;

  flowSuggestion: FlowSuggestion | null;
  setFlowSuggestion: React.Dispatch<React.SetStateAction<FlowSuggestion | null>>;

  showFlowModal: boolean;
  setShowFlowModal: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveFlow: React.Dispatch<React.SetStateAction<string | null>>;
}
