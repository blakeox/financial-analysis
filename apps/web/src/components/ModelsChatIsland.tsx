import { useEffect, useRef, useState } from 'react';
import { VSCodeChatPanel, type ChatMessage } from '@financial-analysis/ui';

interface ModelsChatIslandProps {
  className?: string;
}

interface ModelData {
  [key: string]: unknown;
}

export default function ModelsChatIsland({ className = '' }: ModelsChatIslandProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState<string>();
  const [modelData, setModelData] = useState<ModelData>();
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      
      // Set up global functions for model page interaction
      window.toggleChatPanel = () => {
        setIsOpen((prev: boolean) => !prev);
      };

      window.updateChatContext = (model: string | null, data: ModelData | null) => {
        setActiveModel(model || undefined);
        setModelData(data || undefined);
      };

      // Listen for toggle events
      const handleToggleChat = () => {
        setIsOpen((prev: boolean) => !prev);
      };

      const handleUpdateContext = (event: CustomEvent) => {
        const { model, data } = event.detail;
        setActiveModel(model || undefined);
        setModelData(data || undefined);
      };

      window.addEventListener('toggleChat', handleToggleChat);
      window.addEventListener('updateChatContext', handleUpdateContext as EventListener);

      return () => {
        window.removeEventListener('toggleChat', handleToggleChat);
        window.removeEventListener('updateChatContext', handleUpdateContext as EventListener);
      };
    }
  }, []);

  useEffect(() => {
    // Notify the main page layout to adjust when panel opens/closes
    if (window.adjustLayoutForChat) {
      window.adjustLayoutForChat(isOpen);
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev: boolean) => !prev);
  };

  const handleSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Simulate API call - replace with actual chat API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `You asked about: "${message}". ${activeModel ? `Current model: ${activeModel}` : 'No model selected.'}${modelData ? ` Data available: ${Object.keys(modelData).length} properties` : ''}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <VSCodeChatPanel
        isOpen={isOpen}
        onToggle={handleToggle}
        onSendMessage={handleSendMessage}
        messages={messages}
        isLoading={isLoading}
      />
    </div>
  );
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    toggleChatPanel?: () => void;
    updateChatContext?: (model: string | null, data: ModelData | null) => void;
    adjustLayoutForChat?: (isOpen: boolean) => void;
    selectedModel?: () => string | null;
    selectedModelData?: () => ModelData | null;
  }
}