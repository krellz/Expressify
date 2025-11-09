import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Volume2, Play, X, Pause, ArrowRight, Hash } from 'lucide-react';
import { Button } from './ui/button';
import { Board } from '../utils/api';
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from './ui/toggle-group';
import { useSettings } from '../utils/settings-context';
import { ArasaacFooter } from './ArasaacFooter';
import { useTranslation } from '../utils/translations';

interface ChildCommunicationModeProps {
  board: Board;
  onBack: () => void;
}

export function ChildCommunicationMode({ board, onBack }: ChildCommunicationModeProps) {
  const [selectedPictogram, setSelectedPictogram] = useState<number | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [visualMode, setVisualMode] = useState<'arrows' | 'numbers'>('arrows'); // Default to arrows
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { language } = useSettings();
  const t = useTranslation(language);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePictogramTap = (keyword: string, index: number) => {
    // Don't allow manual taps during sequence
    if (isPlayingSequence) return;

    setSelectedPictogram(index);

    // Text-to-speech with language support
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(keyword);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      // Set language for TTS: 'en-US' for English, 'pt-PT' for Portuguese
      utterance.lang = language === 'pt' ? 'pt-PT' : 'en-US';
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    }

    // Reset selection after animation
    setTimeout(() => {
      setSelectedPictogram(null);
    }, 500);
  };

  const playSequence = async () => {
    if (board.pictograms.length === 0) return;

    setIsPlayingSequence(true);
    setIsPaused(false);
    setCurrentSequenceIndex(0);
  };

  const pauseSequence = () => {
    setIsPaused(true);
    window.speechSynthesis.cancel();
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }
  };

  const resumeSequence = () => {
    setIsPaused(false);
  };

  const stopSequence = () => {
    setIsPlayingSequence(false);
    setCurrentSequenceIndex(null);
    setIsPaused(false);
    window.speechSynthesis.cancel();
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }
  };

  // Handle sequence progression
  useEffect(() => {
    if (!isPlayingSequence || currentSequenceIndex === null || isPaused) return;

    const pictogram = board.pictograms[currentSequenceIndex];
    
    // Speak the current pictogram with language support
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(pictogram.keyword);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      // Set language for TTS: 'en-US' for English, 'pt-PT' for Portuguese
      utterance.lang = language === 'pt' ? 'pt-PT' : 'en-US';
      
      utterance.onend = () => {
        // Wait a bit before moving to the next pictogram
        sequenceTimeoutRef.current = setTimeout(() => {
          const nextIndex = currentSequenceIndex + 1;
          if (nextIndex < board.pictograms.length) {
            setCurrentSequenceIndex(nextIndex);
          } else {
            // Sequence complete
            stopSequence();
          }
        }, 800); // Pause between pictograms
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [currentSequenceIndex, isPlayingSequence, isPaused, board.pictograms]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-orange-100 dark:from-[#1a1625] dark:via-[#2d2438] dark:to-[#1a1625] flex flex-col">
      {/* Minimal Header */}
      <div className="bg-white/80 dark:bg-[#2d2438]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#3d3348] sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg text-[rgb(153,161,175)] truncate flex-1 text-center">{board.title}</h2>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Visual Mode Toggle */}
            {board.pictograms.length > 0 && !isPlayingSequence && (
              <ToggleGroup 
                type="single" 
                value={visualMode} 
                onValueChange={(value) => {
                  if (value) setVisualMode(value as 'arrows' | 'numbers');
                }}
                className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1"
              >
                <ToggleGroupItem 
                  value="arrows" 
                  aria-label="Show arrows"
                  className="data-[state=on]:bg-white dark:data-[state=on]:bg-gray-600 data-[state=on]:shadow-sm text-gray-700 dark:text-gray-300 data-[state=on]:text-gray-900 dark:data-[state=on]:text-white"
                  size="sm"
                >
                  <ArrowRight className="w-4 h-4" />
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="numbers" 
                  aria-label="Show numbers"
                  className="data-[state=on]:bg-white dark:data-[state=on]:bg-gray-600 data-[state=on]:shadow-sm text-gray-700 dark:text-gray-300 data-[state=on]:text-gray-900 dark:data-[state=on]:text-white"
                  size="sm"
                >
                  <Hash className="w-4 h-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            )}

            {/* Play Sequence Button */}
            {board.pictograms.length > 0 && !isPlayingSequence && (
              <Button
                onClick={playSequence}
                className="bg-gradient-to-r from-purple-500 to-orange-400 hover:from-purple-600 hover:to-orange-500"
                size="sm"
              >
                <Play className="w-4 h-4 mr-1" />
                {t.child.play}
              </Button>
            )}
            
            {isPlayingSequence && (
              <div className="flex gap-2">
                {!isPaused ? (
                  <Button
                    onClick={pauseSequence}
                    variant="outline"
                    size="sm"
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    {t.child.pause}
                  </Button>
                ) : (
                  <Button
                    onClick={resumeSequence}
                    className="bg-purple-500 hover:bg-purple-600"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    {t.child.play}
                  </Button>
                )}
                <Button
                  onClick={stopSequence}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  {t.child.stop}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sequence View Modal */}
      <AnimatePresence>
        {isPlayingSequence && currentSequenceIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                stopSequence();
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-2xl w-full"
            >
              {/* Sequence Card */}
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Progress Bar */}
                <div className="h-2 bg-gray-200">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-orange-400"
                    initial={{ width: '0%' }}
                    animate={{
                      width: `${((currentSequenceIndex + 1) / board.pictograms.length) * 100}%`
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Current Pictogram Display */}
                <div className="p-8 sm:p-12">
                  <div className="text-center mb-6">
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                      {t.child.step} {currentSequenceIndex + 1} {t.child.of} {board.pictograms.length}
                    </p>
                    {isPaused && (
                      <p className="text-sm text-orange-600 dark:text-orange-400">⏸ Paused</p>
                    )}
                  </div>

                  <motion.div
                    key={currentSequenceIndex}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-purple-50 to-orange-50 dark:from-purple-900/20 dark:to-orange-900/20 rounded-2xl p-8 sm:p-12 border-4 border-purple-300 dark:border-purple-600"
                  >
                    <img
                      src={board.pictograms[currentSequenceIndex].imageUrl}
                      alt={board.pictograms[currentSequenceIndex].keyword}
                      className="w-full max-w-md mx-auto aspect-square object-contain mb-6"
                    />
                    <h3 className="text-center text-3xl sm:text-4xl text-black dark:text-gray-100">
                      {board.pictograms[currentSequenceIndex].keyword}
                    </h3>
                  </motion.div>

                  {/* Sequence Preview */}
                  <div className="mt-8">
                    <p className="text-sm text-[rgb(153,161,175)] dark:text-gray-400 mb-3 text-center">{t.child.sequence}</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {board.pictograms.map((pic, idx) => (
                        <div
                          key={idx}
                          className={`w-12 h-12 rounded-lg border-2 p-1 transition-all ${
                            idx === currentSequenceIndex
                              ? 'border-purple-600 dark:border-purple-500 bg-purple-100 dark:bg-purple-900/30 scale-110 shadow-lg'
                              : idx < currentSequenceIndex
                              ? 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20 opacity-60'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 opacity-40'
                          }`}
                        >
                          <img
                            src={pic.imageUrl}
                            alt={pic.keyword}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Communication Board */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {board.pictograms.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl text-gray-600 mb-2">This board is empty</p>
              <p className="text-gray-500">Add pictograms to get started</p>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {/* Grid with arrows */}
            <div className="relative">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {board.pictograms.map((pictogram, index) => {
                  const isLastInRow = (index + 1) % 4 === 0 || index === board.pictograms.length - 1;
                  const isLastItem = index === board.pictograms.length - 1;
                  
                  return (
                    <div key={index} className="relative">
                      <motion.button
                        onClick={() => handlePictogramTap(pictogram.keyword, index)}
                        disabled={isPlayingSequence}
                        className={`relative aspect-square rounded-2xl sm:rounded-3xl border-4 transition-all duration-200 w-full ${
                          selectedPictogram === index
                            ? 'border-purple-600 bg-purple-100 shadow-xl scale-95'
                            : isPlayingSequence
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                            : 'border-white bg-white hover:border-purple-300 hover:shadow-lg active:scale-95'
                        }`}
                        whileTap={isPlayingSequence ? {} : { scale: 0.92 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        {/* Sequence Indicator (Number or Start badge) */}
                        {visualMode === 'numbers' ? (
                          <div className="absolute top-2 left-2 w-7 h-7 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs z-10 shadow-md">
                            {index + 1}
                          </div>
                        ) : index === 0 ? (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white rounded-full flex items-center justify-center text-xs z-10 shadow-md">
                            Start
                          </div>
                        ) : null}

                        {/* Pictogram Image */}
                        <div className="absolute inset-0 p-3 sm:p-4 flex flex-col items-center justify-center">
                          <img
                            src={pictogram.imageUrl}
                            alt={pictogram.keyword}
                            className="w-full h-full object-contain mb-2"
                          />
                        </div>

                        {/* Label */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 to-transparent rounded-b-2xl sm:rounded-b-3xl p-2 sm:p-3">
                          <p className="text-center text-sm sm:text-base text-gray-900 truncate px-1">
                            {pictogram.keyword}
                          </p>
                        </div>

                        {/* Audio Indicator */}
                        {selectedPictogram === index && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center"
                          >
                            <Volume2 className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </motion.button>

                      {/* Arrow to next pictogram */}
                      {visualMode === 'arrows' && !isLastItem && !isPlayingSequence && (
                        <>
                          {/* Horizontal arrow (not last in row, on desktop) */}
                          {!isLastInRow && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.02 + 0.1 }}
                              className="hidden md:block absolute top-1/2 -right-[0.75rem] -translate-y-1/2 z-20"
                            >
                              <div className="flex items-center">
                                <ArrowRight className="w-6 h-6 text-purple-500 drop-shadow-md" strokeWidth={3} />
                              </div>
                            </motion.div>
                          )}

                          {/* Vertical arrow for mobile (2 columns) */}
                          {((index + 1) % 2 === 0 || isLastInRow) && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02 + 0.1 }}
                              className="md:hidden absolute -bottom-[0.75rem] left-1/2 -translate-x-1/2 z-20"
                            >
                              <div className="flex flex-col items-center">
                                <svg 
                                  width="24" 
                                  height="24" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  className="text-purple-500 drop-shadow-md"
                                >
                                  <path 
                                    d="M12 5L12 19M12 19L5 12M12 19L19 12" 
                                    stroke="currentColor" 
                                    strokeWidth="3" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            </motion.div>
                          )}

                          {/* Vertical arrow for tablet (3 columns) */}
                          {((index + 1) % 3 === 0 || isLastInRow) && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02 + 0.1 }}
                              className="hidden sm:block md:hidden absolute -bottom-[0.75rem] left-1/2 -translate-x-1/2 z-20"
                            >
                              <div className="flex flex-col items-center">
                                <svg 
                                  width="24" 
                                  height="24" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  className="text-purple-500 drop-shadow-md"
                                >
                                  <path 
                                    d="M12 5L12 19M12 19L5 12M12 19L19 12" 
                                    stroke="currentColor" 
                                    strokeWidth="3" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            </motion.div>
                          )}

                          {/* Vertical arrow for desktop (4 columns) - at end of row */}
                          {isLastInRow && !isLastItem && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02 + 0.1 }}
                              className="hidden md:block absolute -bottom-[0.75rem] left-1/2 -translate-x-1/2 z-20"
                            >
                              <div className="flex flex-col items-center">
                                <svg 
                                  width="24" 
                                  height="24" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  className="text-purple-500 drop-shadow-md"
                                >
                                  <path 
                                    d="M12 5L12 19M12 19L5 12M12 19L19 12" 
                                    stroke="currentColor" 
                                    strokeWidth="3" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            </motion.div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instruction Footer */}
      <div className="bg-white/80 dark:bg-[#2d2438]/80 backdrop-blur-sm border-t border-gray-200 dark:border-[#3d3348] p-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
            <Volume2 className="w-4 h-4" />
            {isPlayingSequence 
              ? 'Sequence playing...' 
              : visualMode === 'arrows' 
              ? 'Follow the arrows! Tap any pictogram to hear its name or click Play to see the full sequence'
              : 'Follow the numbers! Tap any pictogram to hear its name or click Play to see the full sequence'
            }
          </p>
        </div>
      </div>

      {/* ARASAAC Footer */}
      <ArasaacFooter />
    </div>
  );
}
