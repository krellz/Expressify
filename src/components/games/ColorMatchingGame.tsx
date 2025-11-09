import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Volume2, Trophy, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useSettings, getPictogramImageUrl } from '../../utils/settings-context';
import { useTranslation } from '../../utils/translations';
import { toast } from 'sonner@2.0.3';
import { api } from '../../utils/api';

interface ColorMatchingGameProps {
  onBack: () => void;
  accessToken?: string;
}

interface ColorOption {
  name: string;
  namePt: string;
  hex: string;
  pictogramId: number;
}

const colors: ColorOption[] = [
  { name: 'red', namePt: 'vermelho', hex: '#EF4444', pictogramId: 2425 },
  { name: 'blue', namePt: 'azul', hex: '#3B82F6', pictogramId: 2422 },
  { name: 'yellow', namePt: 'amarelo', hex: '#EAB308', pictogramId: 2421 },
  { name: 'green', namePt: 'verde', hex: '#22C55E', pictogramId: 2426 },
  { name: 'orange', namePt: 'laranja', hex: '#F97316', pictogramId: 33904 },
  { name: 'purple', namePt: 'roxo', hex: '#A855F7', pictogramId: 2429 },
];

export function ColorMatchingGame({ onBack, accessToken }: ColorMatchingGameProps) {
  const { language } = useSettings();
  const t = useTranslation(language);
  const [currentColor, setCurrentColor] = useState<ColorOption>(colors[0]);
  const [options, setOptions] = useState<ColorOption[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);

  useEffect(() => {
    startNewRound();
  }, []);

  const startNewRound = () => {
    // Pick a random color as the target
    const targetColor = colors[Math.floor(Math.random() * colors.length)];
    setCurrentColor(targetColor);

    // Create options (correct answer + 2 random wrong answers)
    const wrongColors = colors.filter(c => c.name !== targetColor.name);
    const shuffled = [...wrongColors].sort(() => Math.random() - 0.5);
    const wrongOptions = shuffled.slice(0, 2);
    
    // Shuffle all options
    const allOptions = [targetColor, ...wrongOptions].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
    setSelectedOption(null);
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      utterance.lang = language === 'pt' ? 'pt-PT' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleColorSelect = async (color: ColorOption) => {
    setSelectedOption(color.name);
    const colorName = language === 'pt' ? color.namePt : color.name;

    if (color.name === currentColor.name) {
      // Correct answer!
      const newScore = score + 1;
      setScore(newScore);
      setShowCelebration(true);
      speak(language === 'pt' ? `Muito bem! ${colorName}!` : `Great job! ${colorName}!`);
      toast.success(language === 'pt' ? 'Correto! 🎉' : 'Correct! 🎉');

      // Track the game play on the first correct answer (first time only)
      if (newScore === 1 && !hasTrackedPlay && accessToken) {
        console.log('Tracking Color Matching game play...');
        try {
          const result = await api.trackGamePlay(
            accessToken,
            'colors',
            language === 'pt' ? 'Cores' : 'Color Matching',
            newScore,
            round
          );
          console.log('Game play tracked successfully:', result);
          setHasTrackedPlay(true);

          // Track activity
          const gameName = language === 'pt' ? 'Combinação de Cores' : 'Color Matching';
          await api.trackActivity(
            accessToken,
            'game_finish',
            language === 'pt' 
              ? `Jogou o jogo "${gameName}" - Pontuação: ${newScore}`
              : `Played "${gameName}" game - Score: ${newScore}`,
            { gameId: 'colors', gameName, score: newScore, round }
          );
        } catch (error) {
          console.error('Failed to track game play:', error);
        }
      }

      // Move to next round after celebration
      setTimeout(() => {
        setShowCelebration(false);
        setRound(round + 1);
        startNewRound();
      }, 2000);
    } else {
      // Wrong answer
      speak(language === 'pt' ? 'Tenta novamente' : 'Try again');
      toast.error(language === 'pt' ? 'Tenta novamente' : 'Try again');
      
      // Reset selection after a moment
      setTimeout(() => {
        setSelectedOption(null);
      }, 1000);
    }
  };

  const speakColorName = () => {
    const colorName = language === 'pt' ? currentColor.namePt : currentColor.name;
    speak(colorName);
  };

  const targetColorName = language === 'pt' ? currentColor.namePt : currentColor.name;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-purple-200 dark:border-purple-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'pt' ? 'Voltar' : 'Back'}
        </Button>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-full">
            <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-lg text-purple-900 dark:text-purple-100">{score}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'pt' ? 'Ronda' : 'Round'} {round}
          </div>
        </div>
      </div>

      {/* Game Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500 to-pink-400 rounded-3xl p-6 text-white shadow-xl text-center"
      >
        <h2 className="text-2xl sm:text-3xl mb-2">
          {language === 'pt' ? 'Combinar Cores' : 'Color Matching'}
        </h2>
        <p className="text-sm sm:text-base text-purple-100">
          {language === 'pt' 
            ? 'Toca na cor correta!' 
            : 'Tap the correct color!'}
        </p>
      </motion.div>

      {/* Question: Show target color */}
      <motion.div
        key={round}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-[#2d2438] rounded-3xl p-8 shadow-xl border-4 border-purple-200 dark:border-purple-700"
      >
        <p className="text-center text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-6">
          {language === 'pt' ? 'Encontra a cor:' : 'Find the color:'}
        </p>

        <motion.button
          onClick={speakColorName}
          whileTap={{ scale: 0.95 }}
          className="w-full max-w-md mx-auto block"
        >
          <Card className="border-4 border-purple-300 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500 transition-all cursor-pointer">
            <div className="p-8 flex flex-col items-center gap-4">
              {/* Pictogram */}
              <div className="w-32 h-32 sm:w-40 sm:h-40 relative">
                <img
                  src={getPictogramImageUrl(currentColor.pictogramId)}
                  alt={targetColorName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=Color';
                  }}
                />
              </div>

              {/* Color name with audio icon */}
              <div className="flex items-center gap-3">
                <h3 className="text-3xl sm:text-4xl capitalize text-gray-900 dark:text-gray-100">
                  {targetColorName}
                </h3>
                <Volume2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </motion.button>
      </motion.div>

      {/* Answer Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {options.map((color, index) => {
          const isSelected = selectedOption === color.name;
          const isCorrect = color.name === currentColor.name;
          const showFeedback = isSelected;

          return (
            <motion.button
              key={color.name}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleColorSelect(color)}
              disabled={selectedOption !== null}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Card 
                className={`border-4 transition-all ${
                  showFeedback && isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : showFeedback && !isCorrect
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                }`}
              >
                <div className="p-6 sm:p-8 flex flex-col items-center gap-4">
                  {/* Color circle */}
                  <div 
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg"
                    style={{ backgroundColor: color.hex }}
                  />
                  
                  {/* Color name */}
                  <p className="text-xl sm:text-2xl capitalize text-gray-900 dark:text-gray-100">
                    {language === 'pt' ? color.namePt : color.name}
                  </p>
                </div>
              </Card>

              {/* Checkmark for correct answer */}
              {showFeedback && isCorrect && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-3 -right-3 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Star className="w-6 h-6 text-white fill-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-12 shadow-2xl">
              <Trophy className="w-24 h-24 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
