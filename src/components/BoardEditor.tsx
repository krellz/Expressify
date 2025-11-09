import { useState, useEffect } from 'react';
import { motion, Reorder } from 'motion/react';
import { ArrowLeft, Save, Search, X, GripVertical, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { api, Board, BoardPictogram, Pictogram } from '../utils/api';
import { toast } from 'sonner@2.0.3';
import { ScrollArea } from './ui/scroll-area';
import { useSettings, getArasaacApiUrl, getPictogramImageUrl } from '../utils/settings-context';
import { useTranslation } from '../utils/translations';
import { ArasaacFooter } from './ArasaacFooter';

// Categories with their search terms for ARASAAC
const getCategoriesWithSearchTerms = (language: 'en' | 'pt') => {
  const t = useTranslation(language);
  return [
    { id: 'food', label: t.categories.food, searchTerms: language === 'pt' ? ['comida', 'comer', 'beber', 'refeição'] : ['food', 'eat', 'drink', 'meal'] },
    { id: 'communication', label: t.categories.communication, searchTerms: language === 'pt' ? ['falar', 'dizer', 'ouvir'] : ['talk', 'speak', 'say', 'listen'] },
    { id: 'bathroom', label: t.categories.bathroom, searchTerms: language === 'pt' ? ['casa de banho', 'xixi', 'cocó'] : ['toilet', 'pee', 'poo', 'bathroom'] },
    { id: 'bath', label: t.categories.bath, searchTerms: language === 'pt' ? ['banho', 'duche', 'lavar'] : ['bath', 'shower', 'wash', 'clean'] },
    { id: 'teeth', label: t.categories.teeth, searchTerms: language === 'pt' ? ['escovar dentes', 'escova'] : ['brush teeth', 'toothbrush', 'dental'] },
    { id: 'emotions', label: t.categories.emotions, searchTerms: language === 'pt' ? ['feliz', 'triste', 'zangado', 'sentir'] : ['happy', 'sad', 'angry', 'feeling'] },
    { id: 'activities', label: t.categories.activities, searchTerms: language === 'pt' ? ['brincar', 'jogo', 'desporto'] : ['play', 'game', 'sport', 'activity'] },
    { id: 'clothes', label: t.categories.clothes, searchTerms: language === 'pt' ? ['roupa', 'vestir', 'camisa'] : ['clothes', 'dress', 'wear', 'shirt'] },
    { id: 'sleep', label: t.categories.sleep, searchTerms: language === 'pt' ? ['dormir', 'cama', 'cansado', 'descansar'] : ['sleep', 'bed', 'tired', 'rest'] },
    { id: 'school', label: t.categories.school, searchTerms: language === 'pt' ? ['escola', 'aprender', 'estudar', 'professor'] : ['school', 'learn', 'study', 'teacher'] },
  ];
};

interface BoardEditorProps {
  accessToken: string;
  board?: Board;
  onBack: () => void;
  onSave: () => void;
}

export function BoardEditor({ accessToken, board, onBack, onSave }: BoardEditorProps) {
  const [title, setTitle] = useState(board?.title || '');
  const [pictograms, setPictograms] = useState<BoardPictogram[]>(board?.pictograms || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Pictogram[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categorySuggestions, setCategorySuggestions] = useState<Pictogram[]>([]);
  const [isLoadingAIPictograms, setIsLoadingAIPictograms] = useState(false);
  
  const { language } = useSettings();
  const t = useTranslation(language);
  const CATEGORIES = getCategoriesWithSearchTerms(language);

  // Load pictograms for AI-generated boards
  useEffect(() => {
    const loadAIPictograms = async () => {
      // Check if this is an AI-generated temporary board
      if (board?.id.startsWith('temp-') && board.pictograms.length > 0) {
        const hasEmptyImages = board.pictograms.some(p => !p.imageUrl);
        
        if (hasEmptyImages) {
          setIsLoadingAIPictograms(true);
          const updatedPictograms: BoardPictogram[] = [];
          
          for (const picto of board.pictograms) {
            try {
              // Search for the pictogram by keyword
              const results = await api.searchPictograms(accessToken, picto.keyword, language);
              if (results && results.length > 0) {
                updatedPictograms.push({
                  id: results[0].id,
                  keyword: picto.keyword,
                  imageUrl: results[0].imageUrl,
                  position: picto.position,
                });
              } else {
                console.warn(`No pictogram found for "${picto.keyword}", keeping original`);
                // Keep the original if no results found
                updatedPictograms.push(picto);
              }
            } catch (error: any) {
              console.error(`Error loading pictogram for "${picto.keyword}":`, error?.message || error);
              // Keep the original on error
              updatedPictograms.push(picto);
            }
          }
          
          setPictograms(updatedPictograms);
          setIsLoadingAIPictograms(false);
        }
      }
    };
    
    loadAIPictograms();
  }, [board?.id]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        searchPictograms();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, language]);

  // Load category suggestions when a category is selected or language changes
  useEffect(() => {
    if (selectedCategory) {
      loadCategorySuggestions(selectedCategory);
    } else {
      setCategorySuggestions([]);
    }
  }, [selectedCategory, language]);

  const loadCategorySuggestions = async (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    setIsSearching(true);
    try {
      // Search using the first search term for this category
      const results = await api.searchPictograms(accessToken, category.searchTerms[0], language);
      setCategorySuggestions(results);
    } catch (error: any) {
      console.error('Error loading category suggestions:', error);
      toast.error(t.editor.failedToLoadSuggestions);
    } finally {
      setIsSearching(false);
    }
  };

  const searchPictograms = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await api.searchPictograms(accessToken, searchQuery.trim(), language);
      setSearchResults(results);
    } catch (error: any) {
      console.error('Error searching pictograms:', error);
      toast.error(t.editor.failedToSearchPictograms);
    } finally {
      setIsSearching(false);
    }
  };

  const addPictogram = (pictogram: Pictogram) => {
    const newPictogram: BoardPictogram = {
      id: pictogram.id,
      keyword: pictogram.keywords[0]?.keyword || 'Unknown',
      imageUrl: pictogram.imageUrl,
      position: pictograms.length,
    };

    setPictograms([...pictograms, newPictogram]);
    toast.success(t.toast.pictogramAdded);
    
    // Don't clear search/category when adding from suggestions
    if (searchQuery) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
      setSearchQuery(''); // Clear manual search when selecting category
      setSearchResults([]);
    }
  };

  const removePictogram = (index: number) => {
    const updated = pictograms.filter((_, i) => i !== index);
    // Update positions
    const reindexed = updated.map((p, i) => ({ ...p, position: i }));
    setPictograms(reindexed);
  };

  const handleReorder = (newOrder: BoardPictogram[]) => {
    // Update positions
    const reindexed = newOrder.map((p, i) => ({ ...p, position: i }));
    setPictograms(reindexed);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t.editor.enterBoardTitle);
      return;
    }

    setIsSaving(true);
    try {
      // Check if this is a temporary AI-generated board
      if (board && board.id.startsWith('temp-')) {
        // Create as new board (not update)
        await api.createBoard(accessToken, title, pictograms);
        toast.success(t.toast.boardCreated);

        // Track activity
        await api.trackActivity(
          accessToken,
          'board_create',
          language === 'pt' 
            ? `Criou o quadro "${title}"`
            : `Created board "${title}"`,
          { boardTitle: title, pictogramCount: pictograms.length }
        );
      } else if (board) {
        // Update existing board
        await api.updateBoard(accessToken, board.id, title, pictograms);
        toast.success(t.toast.boardUpdated);
      } else {
        // Create new board
        await api.createBoard(accessToken, title, pictograms);
        toast.success(t.toast.boardCreated);

        // Track activity
        await api.trackActivity(
          accessToken,
          'board_create',
          language === 'pt' 
            ? `Criou o quadro "${title}"`
            : `Created board "${title}"`,
          { boardTitle: title, pictogramCount: pictograms.length }
        );
      }
      onSave();
    } catch (error: any) {
      console.error('Error saving board:', error);
      toast.error(t.toast.failedToSave);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 dark:from-[#1a1625] dark:via-[#2d2438] dark:to-[#1a1625] flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-[#2d2438] border-b border-gray-200 dark:border-[#3d3348] sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.editor.back}
          </Button>
          <div className="flex-1 max-w-md">
            <Input
              placeholder={t.editor.boardTitlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-2 border-purple-200 focus:border-purple-400"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.editor.saving}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t.editor.save}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left: Board Canvas */}
          <div className="flex flex-col">
            <Label className="mb-3 text-gray-900 dark:text-gray-100">{t.editor.boardPreview} ({pictograms.length} {t.editor.pictograms})</Label>
            <Card className="flex-1 min-h-[500px] dark:bg-[#2d2438] dark:border-[#3d3348]">
              <CardContent className="p-4 h-full">
                {pictograms.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-1">{t.editor.noPictograms}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t.editor.addPictograms}
                      </p>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="h-full pr-4">
                    <Reorder.Group
                      axis="y"
                      values={pictograms}
                      onReorder={handleReorder}
                      className="space-y-2"
                    >
                      {pictograms.map((pic, index) => (
                        <Reorder.Item
                          key={pic.id + '-' + index}
                          value={pic}
                          className="bg-white dark:bg-[#3d3348]"
                        >
                          <motion.div
                            layout
                            className="flex items-center gap-3 p-3 border-2 border-gray-200 dark:border-[#4d4358] rounded-xl hover:border-purple-300 dark:hover:border-purple-600 transition-colors group cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            <img
                              src={pic.imageUrl}
                              alt={pic.keyword}
                              className="w-16 h-16 object-contain bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-gray-900 dark:text-gray-100">{pic.keyword}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removePictogram(index)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Pictogram Search */}
          <div className="flex flex-col">
            <Label className="mb-3 text-gray-900 dark:text-gray-100">{t.editor.searchPictograms}</Label>
            <Card className="flex-1 min-h-[500px] dark:bg-[#2d2438] dark:border-[#3d3348]">
              <CardContent className="p-4 flex flex-col h-full">
                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder={t.editor.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value) {
                        setSelectedCategory(null); // Clear category when manually searching
                      }
                    }}
                    className="pl-10"
                  />
                </div>

                {/* Category Filters */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t.editor.browseByCategory}</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((category) => (
                      <Badge
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'outline'}
                        className={`cursor-pointer transition-all hover:scale-105 ${
                          selectedCategory === category.id
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'hover:bg-purple-50 hover:border-purple-300'
                        }`}
                        onClick={() => handleCategoryClick(category.id)}
                      >
                        {category.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Search Results or Category Suggestions */}
                <ScrollArea className="flex-1">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    // Manual search results
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {t.editor.searchResultsFor} "{searchQuery}"
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {searchResults.map((pictogram) => (
                          <motion.button
                            key={pictogram.id}
                            onClick={() => addPictogram(pictogram)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 border-2 border-gray-200 dark:border-[#4d4358] rounded-xl hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group bg-white dark:bg-[#3d3348]"
                          >
                            <img
                              src={pictogram.imageUrl}
                              alt={pictogram.keywords[0]?.keyword}
                              className="w-full aspect-square object-contain mb-2"
                            />
                            <p className="text-xs truncate text-gray-700 dark:text-gray-200 group-hover:text-purple-900 dark:group-hover:text-purple-300">
                              {pictogram.keywords[0]?.keyword}
                            </p>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ) : categorySuggestions.length > 0 ? (
                    // Category suggestions
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {CATEGORIES.find(c => c.id === selectedCategory)?.label} {t.editor.suggestions}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {categorySuggestions.map((pictogram) => (
                          <motion.button
                            key={pictogram.id}
                            onClick={() => addPictogram(pictogram)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 border-2 border-gray-200 dark:border-[#4d4358] rounded-xl hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group bg-white dark:bg-[#3d3348]"
                          >
                            <img
                              src={pictogram.imageUrl}
                              alt={pictogram.keywords[0]?.keyword}
                              className="w-full aspect-square object-contain mb-2"
                            />
                            <p className="text-xs truncate text-gray-700 dark:text-gray-200 group-hover:text-purple-900 dark:group-hover:text-purple-300">
                              {pictogram.keywords[0]?.keyword}
                            </p>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ) : searchQuery.trim().length >= 2 ? (
                    <div className="flex items-center justify-center py-12 text-center">
                      <div>
                        <p className="text-gray-600 dark:text-gray-300 mb-1">{t.editor.noResultsFound}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.editor.tryDifferentSearch}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12 text-center">
                      <div>
                        <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-300 mb-2">{t.editor.searchOrChooseCategory}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                          {t.editor.searchInstructions}
                        </p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <ArasaacFooter />
    </div>
  );
}
