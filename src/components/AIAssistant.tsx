import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Sparkles, Loader2, Lightbulb } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { api } from '../utils/api';
import { toast } from 'sonner@2.0.3';
import { useTranslation, Language } from '../utils/translations';
import { Board } from '../utils/api';
import { Badge } from './ui/badge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  board?: {
    title: string;
    keywords: string[];
  };
}

interface AIAssistantProps {
  accessToken: string;
  language: Language;
  onUseBoard: (board: Board) => void;
}

export function AIAssistant({ accessToken, language, onUseBoard }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = useTranslation(language);

  // Show welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: t.ai.welcomeMessage,
        },
      ]);
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (messageToSend?: string) => {
    const userMessage = messageToSend || inputMessage.trim();
    if (!userMessage || isLoading) return;

    // Only clear input if sending from input field (not from suggestion button)
    if (!messageToSend) {
      setInputMessage('');
    }

    // Add user message
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Call AI API
      const response = await api.chatWithAI(accessToken, userMessage, language);

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message,
        board: response.board,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Show toast if board was created
      if (response.board) {
        toast.success(t.ai.boardCreated);
      }
    } catch (error: any) {
      console.error('Error chatting with AI:', error);
      const errorDetails = error?.message || error?.toString() || 'Unknown error';
      console.error('Error details:', errorDetails);
      
      // Check if it's an API key configuration issue
      let userFriendlyMessage = t.ai.errorMessage;
      if (errorDetails.includes('not configured') || errorDetails.includes('403') || errorDetails.includes('401')) {
        userFriendlyMessage = language === 'pt' 
          ? 'Por favor, configure a chave API nas configurações do projeto.'
          : 'Please configure your API key in the project settings.';
      } else if (errorDetails.includes('429')) {
        userFriendlyMessage = language === 'pt'
          ? 'Limite de requisições atingido. Por favor, tente novamente mais tarde.'
          : 'Rate limit reached. Please try again later.';
      }
      
      toast.error(userFriendlyMessage);
      
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: `${userFriendlyMessage}\n\n${language === 'pt' ? 'Detalhes técnicos' : 'Technical details'}: ${errorDetails}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseBoard = (boardData: { title: string; keywords: string[] }) => {
    // Create a temporary board that will be handled by the BoardEditor
    const tempBoard: Board = {
      id: `temp-${Date.now()}`,
      title: boardData.title,
      pictograms: boardData.keywords.map((keyword, index) => ({
        id: 0, // Will be filled when pictograms are loaded
        keyword,
        imageUrl: '',
        position: index,
      })),
      userId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    onUseBoard(tempBoard);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
          <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-purple-900 dark:text-white">{t.ai.title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t.ai.subtitle}</p>
        </div>
      </div>

      {/* Messages Container */}
      <Card className="flex-1 mb-4 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                
                {/* Board Template Button */}
                {message.board && (
                  <Button
                    onClick={() => handleUseBoard(message.board!)}
                    className="mt-3 w-full bg-white text-purple-600 hover:bg-purple-50 dark:bg-gray-700 dark:text-purple-400 dark:hover:bg-gray-600"
                    size="sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t.ai.useThisBoard}
                  </Button>
                )}
              </div>
            </motion.div>
          ))}

          {/* Quick Suggestions - Show only when there's just the welcome message */}
          {messages.length === 1 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-3">
                <Lightbulb className="w-4 h-4" />
                <span className="text-sm font-medium">{t.ai.suggestionsTitle}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {t.ai.suggestions.map((suggestion, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSendMessage(suggestion)}
                    className="group relative bg-white dark:bg-gray-700 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 rounded-xl p-3 text-left transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400 dark:text-purple-500 flex-shrink-0 mt-0.5 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                      <span className="text-sm text-gray-700 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                        {suggestion}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.ai.thinking}</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Input Area */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t.ai.placeholder}
          disabled={isLoading}
          className="flex-1 min-h-[80px] sm:min-h-[44px] resize-none text-sm sm:text-base"
          rows={3}
        />
        <Button
          onClick={handleSendMessage}
          disabled={isLoading || !inputMessage.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto h-12 sm:h-auto"
        >
          <Send className="w-4 h-4 sm:mr-2" />
          <span className="ml-2 sm:ml-0">{language === 'pt' ? 'Enviar' : 'Send'}</span>
        </Button>
      </div>
    </div>
  );
}
