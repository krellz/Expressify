import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Grid3x3, Edit2, Trash2, Play, LogOut, User, Search, Volume2, X, Moon, Sun, Languages, Info, Mail, Sparkles, QrCode, Download, Copy, CheckCircle, Gamepad2 } from 'lucide-react';
import logo from 'figma:asset/d157766a8345b6fa303858c91e8dfa895bcf80a4.png';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { api, Board } from '../utils/api';
import { toast } from 'sonner@2.0.3';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { createClient } from '../utils/supabase/client';
import { useSettings, getArasaacApiUrl, getPictogramImageUrl } from '../utils/settings-context';
import { useTranslation } from '../utils/translations';
import { ArasaacFooter } from './ArasaacFooter';
import { AIAssistant } from './AIAssistant';
import { CaregiverOverview } from './CaregiverOverview';
import { TaskTracker } from './TaskTracker';
import { LearnAndPlay } from './LearnAndPlay';
import QRCode from 'qrcode';
import { RoutineTask } from '../utils/api';
import { GUEST_TOKEN } from '../utils/local-storage-api';

interface ArasaacPictogram {
  _id: number;
  keywords: Array<{ keyword: string }>;
}

interface CaregiverDashboardProps {
  accessToken: string;
  onCreateBoard: () => void;
  onEditBoard: (board: Board) => void;
  onViewBoard: (board: Board) => void;
  onLogout: () => void;
  onShowAbout: () => void;
  onShowContact: () => void;
}

export function CaregiverDashboard({
  accessToken,
  onCreateBoard,
  onEditBoard,
  onViewBoard,
  onLogout,
  onShowAbout,
  onShowContact,
}: CaregiverDashboardProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [boardToShare, setBoardToShare] = useState<Board | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [userName, setUserName] = useState('');
  const [pictogramUsageCount, setPictogramUsageCount] = useState(0);
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  
  // Pictogram search state
  const [searchQuery, setSearchQuery] = useState('');
  const [pictograms, setPictograms] = useState<ArasaacPictogram[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPictogram, setSelectedPictogram] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [commonPictograms, setCommonPictograms] = useState<ArasaacPictogram[]>([]);

  const supabase = createClient();
  const { language, setLanguage, theme, toggleTheme } = useSettings();
  const t = useTranslation(language);

  useEffect(() => {
    loadBoards();
    loadUserInfo();
    loadCommonPictograms();
    loadPictogramUsageCount();
  }, [language]);

  const loadUserInfo = async () => {
    if (accessToken === GUEST_TOKEN) {
      setUserName('Guest');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (user) {
        setUserName(user.user_metadata?.name || 'User');
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadPictogramUsageCount = async () => {
    try {
      const count = await api.getPictogramUsageCount(accessToken);
      setPictogramUsageCount(count);
    } catch (error) {
      console.error('Error loading pictogram usage count:', error);
    }
  };

  const loadBoards = async () => {
    setIsLoading(true);
    try {
      const fetchedBoards = await api.getBoards(accessToken);
      setBoards(fetchedBoards);
    } catch (error: any) {
      console.error('Error loading boards:', error);
      toast.error(t.toast.failedToLoad);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!boardToDelete) return;

    try {
      await api.deleteBoard(accessToken, boardToDelete.id);
      toast.success(t.toast.boardDeleted);
      setBoards(boards.filter(b => b.id !== boardToDelete.id));
      setBoardToDelete(null);
    } catch (error: any) {
      console.error('Error deleting board:', error);
      toast.error(t.toast.failedToDelete);
    }
  };

  const handleShareBoard = async (board: Board) => {
    try {
      // Create shareable board data
      const shareData = {
        title: board.title,
        pictograms: board.pictograms.map(p => ({
          id: p.id,
          keyword: p.keyword,
          imageUrl: p.imageUrl
        })),
        sharedFrom: 'Expressify'
      };

      // Convert to JSON string
      const shareDataString = JSON.stringify(shareData);

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(shareDataString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#7c3aed', // Purple color
          light: '#ffffff'
        }
      });

      setQrCodeUrl(qrDataUrl);
      setBoardToShare(board);
      toast.success(language === 'pt' ? 'Código QR gerado!' : 'QR Code generated!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error(language === 'pt' ? 'Erro ao gerar código QR' : 'Failed to generate QR code');
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl || !boardToShare) return;

    const link = document.createElement('a');
    link.download = `${boardToShare.title}-QR.png`;
    link.href = qrCodeUrl;
    link.click();
    toast.success(language === 'pt' ? 'Código QR baixado!' : 'QR Code downloaded!');
  };

  const handleCopyShareData = async () => {
    if (!boardToShare) return;

    const shareData = {
      title: boardToShare.title,
      pictograms: boardToShare.pictograms.map(p => ({
        id: p.id,
        keyword: p.keyword,
        imageUrl: p.imageUrl
      })),
      sharedFrom: 'Expressify'
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(shareData, null, 2));
      toast.success(language === 'pt' ? 'Dados copiados!' : 'Data copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error(language === 'pt' ? 'Erro ao copiar' : 'Failed to copy');
    }
  };

  // Load common pictograms
  const loadCommonPictograms = async () => {
    // Map of fallback search terms and known pictogram IDs for common words
    const fallbackMap: { [key: string]: { alternatives: string[], id?: number } } = {
      'adeus': { alternatives: ['goodbye', 'bye', 'farewell'], id: 8796 },
      'casa de banho': { alternatives: ['bathroom', 'toilet', 'WC'], id: 5012 },
      'quero': { alternatives: ['i want', 'want', 'desire'], id: 10239 },
      'jogar': { alternatives: ['play', 'game'], id: 23392 },
      'bye': { alternatives: ['goodbye', 'farewell'], id: 8796 },
      'bathroom': { alternatives: ['toilet', 'WC'], id: 5012 },
      'i want': { alternatives: ['want', 'desire'], id: 10239 },
      'play': { alternatives: ['game', 'playing'], id: 23392 },
    };

    const commonWords = Object.values(t.dashboard.commonWords);
    const pictogramPromises = commonWords.map(async (word) => {
      try {
        // First try the original word
        let results: any[] = [];
        
        try {
          results = await api.searchPictograms(accessToken, word, language);
        } catch (searchError) {
          console.log(`Initial search failed for "${word}", trying fallbacks...`);
        }
        
        // If no results and we have fallbacks, try alternatives
        if (results.length === 0 && fallbackMap[word.toLowerCase()]) {
          const fallback = fallbackMap[word.toLowerCase()];
          
          // Try known ID first if available
          if (fallback.id) {
            return {
              _id: fallback.id,
              keywords: [{ keyword: word }]
            };
          }
          
          // Try alternative search terms
          for (const alt of fallback.alternatives) {
            try {
              results = await api.searchPictograms(accessToken, alt, 'en');
              if (results.length > 0) {
                return {
                  _id: results[0].id,
                  keywords: [{ keyword: word }]
                };
              }
            } catch (e) {
              console.error(`Failed alternative search for ${alt}:`, e);
            }
          }
        }
        
        if (results && results.length > 0) {
          return {
            _id: results[0].id,
            keywords: results[0].keywords
          };
        }
        return null;
      } catch (error: any) {
        console.warn(`Could not load pictogram for "${word}":`, error?.message || error);
        return null;
      }
    });

    const results = await Promise.all(pictogramPromises);
    const validPictograms = results.filter((p): p is ArasaacPictogram => p !== null);
    setCommonPictograms(validPictograms);
  };

  // Pictogram search functions
  const searchPictograms = async (query: string) => {
    if (!query.trim()) {
      setPictograms([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      // Use the server API to search pictograms with language parameter
      const results = await api.searchPictograms(accessToken, query.trim(), language);
      
      // Transform server results to match the ArasaacPictogram interface
      const transformedResults = results.map((r: any) => ({
        _id: r.id,
        keywords: r.keywords
      }));
      
      setPictograms(transformedResults);
      
      if (transformedResults.length === 0) {
        toast.info(t.dashboard.noPictogramsFound);
      }
    } catch (error: any) {
      console.error('Error searching pictograms:', error);
      toast.error(t.toast.failedToSearch);
      setPictograms([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchPictograms(searchQuery);
  };

  const handlePictogramTap = async (pictogram: ArasaacPictogram) => {
    setSelectedPictogram(pictogram._id);

    const keyword = pictogram.keywords[0]?.keyword || 'unknown';

    // Track pictogram usage in database
    try {
      const newCount = await api.trackPictogramUsage(accessToken);
      setPictogramUsageCount(newCount);
    } catch (error) {
      console.error('Error tracking pictogram usage:', error);
    }

    // Text-to-speech with language support
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(keyword);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      // Set language for TTS: 'en-US' for English, 'pt-PT' for Portuguese
      utterance.lang = language === 'pt' ? 'pt-PT' : 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }

    // Reset selection after animation
    setTimeout(() => {
      setSelectedPictogram(null);
    }, 500);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setPictograms([]);
    setHasSearched(false);
  };

  const getImageUrl = (id: number) => {
    return getPictogramImageUrl(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 dark:from-[#1a1625] dark:via-[#2d2438] dark:to-[#1a1625] flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-[#2d2438] border-b border-gray-200 dark:border-[#3d3348] sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-center w-full md:w-auto">
            <img 
              src={logo} 
              alt="Expressify Logo" 
              className="h-20 w-auto sm:h-24 md:h-28 lg:h-32 object-contain"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end">
            {/* About Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onShowAbout}
              className="border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              <Info className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{t.footer.about}</span>
            </Button>

            {/* Contact Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onShowContact}
              className="border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
            >
              <Mail className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{t.footer.contact}</span>
            </Button>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Languages className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">{language === 'en' ? 'English' : 'Português'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('en')}>
                  🇬🇧 English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('pt')}>
                  🇵🇹 Português
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>

            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-[#3d3348] rounded-lg">
              <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{userName}</span>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 flex-1">
        <Tabs defaultValue="express" className="w-full">
          <TabsList className="grid w-full max-w-5xl mx-auto grid-cols-3 sm:grid-cols-6 mb-4 sm:mb-6 h-auto gap-1">
            <TabsTrigger value="express" className="text-xs sm:text-base flex-col sm:flex-row gap-1 sm:gap-2 py-2 sm:py-2.5">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">{t.dashboard.expressYourself}</span>
              <span className="sm:hidden text-[10px]">Express</span>
            </TabsTrigger>
            <TabsTrigger value="boards" className="text-xs sm:text-base flex-col sm:flex-row gap-1 sm:gap-2 py-2 sm:py-2.5">
              <Grid3x3 className="w-4 h-4" />
              <span className="hidden sm:inline">{t.dashboard.myBoards}</span>
              <span className="sm:hidden text-[10px]">Boards</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs sm:text-base flex-col sm:flex-row gap-1 sm:gap-2 py-2 sm:py-2.5">
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t.dashboard.tasks}</span>
              <span className="sm:hidden text-[10px]">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="games" className="text-xs sm:text-base flex-col sm:flex-row gap-1 sm:gap-2 py-2 sm:py-2.5">
              <Gamepad2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t.games.title}</span>
              <span className="sm:hidden text-[10px]">Games</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs sm:text-base flex-col sm:flex-row gap-1 sm:gap-2 py-2 sm:py-2.5">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">{t.dashboard.aiAssistant}</span>
              <span className="sm:hidden text-[10px]">AI</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="text-xs sm:text-base flex-col sm:flex-row gap-1 sm:gap-2 py-2 sm:py-2.5">
              <Grid3x3 className="w-4 h-4" />
              <span className="hidden sm:inline">{t.dashboard.overview}</span>
              <span className="sm:hidden text-[10px]">Home</span>
            </TabsTrigger>
          </TabsList>

          {/* Express Yourself Tab */}
          <TabsContent value="express" className="mt-0 pt-2 sm:pt-0">
            <div className="space-y-4 sm:space-y-6">
              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
                  <div className="relative">
                    <Search className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-7 sm:h-7 text-purple-400" />
                    <Input
                      type="text"
                      placeholder={t.dashboard.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-11 sm:pl-16 pr-20 sm:pr-28 h-14 sm:h-20 text-base sm:text-2xl rounded-2xl sm:rounded-3xl border-4 border-purple-200 focus:border-purple-400 shadow-xl bg-white dark:bg-[#2d2438] dark:border-purple-700"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-16 sm:right-24 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-10 sm:h-10 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                      </button>
                    )}
                    <Button
                      type="submit"
                      disabled={isSearching || !searchQuery.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 sm:h-16 px-3 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-500 to-orange-400 hover:from-purple-600 hover:to-orange-500 shadow-lg text-sm sm:text-lg"
                    >
                      {isSearching ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Search className="w-4 h-4 sm:w-6 sm:h-6" />
                        </motion.div>
                      ) : (
                        'Go!'
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>

              {/* Common Pictograms */}
              {!hasSearched && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="max-w-5xl mx-auto">
                    <div className="p-4 sm:p-6 bg-white/80 dark:bg-[#2d2438]/80 backdrop-blur-sm rounded-3xl shadow-xl border-4 border-purple-200 dark:border-purple-700">

                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-center">
                        {t.dashboard.tapPictogramToExpress}
                      </p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                        {commonPictograms.map((pictogram, index) => {
                          const keyword = pictogram.keywords[0]?.keyword || 'unknown';
                          const isSelected = selectedPictogram === pictogram._id;

                          return (
                            <motion.button
                              key={pictogram._id}
                              onClick={() => handlePictogramTap(pictogram)}
                              className={`relative aspect-square rounded-2xl sm:rounded-3xl border-4 transition-all duration-200 ${
                                isSelected
                                  ? 'border-purple-600 bg-purple-100 dark:bg-purple-900/50 shadow-2xl scale-95'
                                  : 'border-white dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-xl active:scale-95'
                              }`}
                              whileTap={{ scale: 0.92 }}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              {/* Pictogram Image */}
                              <div className="absolute inset-0 p-3 sm:p-4 flex flex-col items-center justify-center">
                                <img
                                  src={getImageUrl(
                                    keyword.toLowerCase() === 'play' || keyword.toLowerCase() === 'jogar' 
                                      ? 23392 
                                      : keyword.toLowerCase() === 'please' || keyword.toLowerCase() === 'por favor'
                                      ? 8195
                                      : pictogram._id
                                  )}
                                  alt={keyword}
                                  className="w-full h-full object-contain mb-2"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Image';
                                  }}
                                />
                              </div>

                              {/* Label */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 dark:from-gray-800/95 to-transparent rounded-b-2xl sm:rounded-b-3xl p-2 sm:p-3">
                                <p className="text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate px-1">
                                  {keyword}
                                </p>
                              </div>

                              {/* Audio Indicator */}
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg"
                                >
                                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Loading State */}
              {isSearching && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <div
                      key={i}
                      className="aspect-square bg-white/60 rounded-2xl sm:rounded-3xl animate-pulse border-4 border-purple-100"
                    />
                  ))}
                </div>
              )}

              {/* Results */}
              {!isSearching && pictograms.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="flex items-center justify-between px-2">
                    <p className="text-lg sm:text-xl text-purple-600">
                      Found {pictograms.length} pictogram{pictograms.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600">
                      <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Tap to hear</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {pictograms.map((pictogram, index) => {
                      const keyword = pictogram.keywords[0]?.keyword || 'unknown';
                      const isSelected = selectedPictogram === pictogram._id;

                      return (
                        <motion.button
                          key={pictogram._id}
                          onClick={() => handlePictogramTap(pictogram)}
                          className={`relative aspect-square rounded-2xl sm:rounded-3xl border-4 transition-all duration-200 ${
                            isSelected
                              ? 'border-purple-600 bg-purple-100 shadow-2xl scale-95'
                              : 'border-white bg-white hover:border-purple-300 hover:shadow-xl active:scale-95'
                          }`}
                          whileTap={{ scale: 0.92 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          {/* Pictogram Image */}
                          <div className="absolute inset-0 p-3 sm:p-4 flex flex-col items-center justify-center">
                            <img
                              src={getImageUrl(pictogram._id)}
                              alt={keyword}
                              className="w-full h-full object-contain mb-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Image';
                              }}
                            />
                          </div>

                          {/* Label */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 to-transparent rounded-b-2xl sm:rounded-b-3xl p-2 sm:p-3">
                            <p className="text-center text-sm sm:text-base text-gray-900 truncate px-1">
                              {keyword}
                            </p>
                          </div>

                          {/* Audio Indicator */}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg"
                            >
                              <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* No Results */}
              {!isSearching && hasSearched && pictograms.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 sm:py-16"
                >
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <Search className="w-10 h-10 sm:w-12 sm:h-12 text-orange-400" />
                    </div>
                    <h3 className="text-xl sm:text-2xl text-gray-900 mb-2 sm:mb-3">
                      No pictures found
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
                      Try searching for a different word!
                    </p>
                    <p className="text-sm sm:text-base text-gray-500">
                      💡 Try simple words like "happy", "food", "play", or "help"
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </TabsContent>

          {/* My Boards Tab */}
          <TabsContent value="boards" className="mt-0 pt-2 sm:pt-0">
            {/* Create Board Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 sm:mb-8"
            >
              <Button
                onClick={onCreateBoard}
                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg h-12 sm:h-14 px-6 sm:px-8 w-full sm:w-auto text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {t.dashboard.createBoard}
              </Button>
            </motion.div>

            {/* Boards Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : boards.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Grid3x3 className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl text-gray-900 dark:text-gray-100 mb-2">{t.dashboard.noBoards}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  {t.dashboard.noBoardsDesc}
                </p>
                <Button
                  onClick={onCreateBoard}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t.dashboard.createBoard}
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {boards.map((board, index) => (
                  <motion.div
                    key={board.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-purple-200">
                      <CardContent className="p-0">
                        {/* Board Preview */}
                        <div className="h-32 bg-gradient-to-br from-purple-100 to-orange-50 p-4 flex items-center justify-center">
                          {board.pictograms.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                              {board.pictograms.slice(0, 6).map((pic, i) => (
                                <img
                                  key={i}
                                  src={pic.imageUrl}
                                  alt={pic.keyword}
                                  className="w-10 h-10 object-contain bg-white rounded-lg p-1"
                                />
                              ))}
                            </div>
                          ) : (
                            <Grid3x3 className="w-12 h-12 text-purple-300" />
                          )}
                        </div>

                        {/* Board Info */}
                        <div className="p-4">
                          <h3 className="mb-1 truncate">{board.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {board.pictograms.length} pictogram{board.pictograms.length !== 1 ? 's' : ''}
                          </p>

                          {/* Actions */}
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onViewBoard(board)}
                              className="flex-1"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShareBoard(board)}
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                            >
                              <QrCode className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditBoard(board)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setBoardToDelete(board)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-0 pt-2 sm:pt-0">
            <TaskTracker 
              accessToken={accessToken}
              onTasksChange={setTasks}
            />
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games" className="mt-0 pt-2 sm:pt-0">
            <LearnAndPlay accessToken={accessToken} />
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai" className="mt-0 pt-2 sm:pt-0">
            <div className="max-w-4xl mx-auto h-[calc(100vh-240px)] sm:h-[calc(100vh-280px)]">
              <AIAssistant
                accessToken={accessToken}
                language={language}
                onUseBoard={onEditBoard}
              />
            </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0 pt-2 sm:pt-0">
            <CaregiverOverview 
              userName={userName}
              language={language}
              boardCount={boards.length}
              pictogramCount={pictogramUsageCount}
              tasks={tasks}
              accessToken={accessToken}
              onViewTasks={() => {
                // Switch to tasks tab
                const tasksTab = document.querySelector('[value="tasks"]') as HTMLElement;
                tasksTab?.click();
              }}
              onManageBoards={() => {
                // Switch to boards tab
                const boardsTab = document.querySelector('[value="boards"]') as HTMLElement;
                boardsTab?.click();
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* QR Code Share Dialog */}
      <Dialog open={!!boardToShare} onOpenChange={() => setBoardToShare(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              {language === 'pt' ? 'Compartilhar Quadro' : 'Share Board'}
            </DialogTitle>
            <DialogDescription>
              {language === 'pt' 
                ? 'Escaneie o código QR para compartilhar este quadro com outros usuários.'
                : 'Scan the QR code to share this board with other users.'}
            </DialogDescription>
          </DialogHeader>
          
          {boardToShare && (
            <div className="space-y-4">
              {/* Board Info */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                  {boardToShare.title}
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {boardToShare.pictograms.length} pictogram{boardToShare.pictograms.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Pictogram Preview - Full Sequence */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-700 p-3">
                <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  {language === 'pt' ? 'Visualização do Quadro:' : 'Board Preview:'}
                </p>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {boardToShare.pictograms.map((pictogram, index) => (
                    <div 
                      key={index}
                      className="relative aspect-square bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-1 flex flex-col items-center justify-center"
                    >
                      <img
                        src={pictogram.imageUrl}
                        alt={pictogram.keyword}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=?';
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg px-1">
                        <p className="text-[8px] text-white text-center truncate">
                          {pictogram.keyword}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code */}
              {qrCodeUrl && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-700">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="w-64 h-64"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 w-full">
                    <Button
                      onClick={handleDownloadQR}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {language === 'pt' ? 'Baixar QR' : 'Download QR'}
                    </Button>
                    <Button
                      onClick={handleCopyShareData}
                      variant="outline"
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {language === 'pt' ? 'Copiar Dados' : 'Copy Data'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="font-semibold">
                  {language === 'pt' ? '💡 Como usar:' : '💡 How to use:'}
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    {language === 'pt' 
                      ? 'Escaneie o QR code com um leitor de QR'
                      : 'Scan the QR code with a QR reader'}
                  </li>
                  <li>
                    {language === 'pt' 
                      ? 'Os dados do quadro serão copiados'
                      : 'The board data will be copied'}
                  </li>
                  <li>
                    {language === 'pt' 
                      ? 'Importe em outro dispositivo Expressify'
                      : 'Import on another Expressify device'}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!boardToDelete} onOpenChange={() => setBoardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.dashboard.deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.dashboard.deleteConfirmDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.dashboard.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBoard}
              className="bg-red-600 hover:bg-red-700"
            >
              {t.dashboard.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <ArasaacFooter />
    </div>
  );
}
