// frontend/src/components/ChatHistory/types.ts
import type { Message, FlowState, FlowSuggestion } from '../../types'

export interface ChatHistoryProps {
  chatHistory: Message[]
  loading: boolean

  flowState: FlowState | null
  setFlowState: React.Dispatch<React.SetStateAction<FlowState | null>>

  showFlowModal: boolean
  setShowFlowModal: React.Dispatch<React.SetStateAction<boolean>>

  // setActiveFlow by object:
  setActiveFlow: (flow: FlowSuggestion | null) => void

}
