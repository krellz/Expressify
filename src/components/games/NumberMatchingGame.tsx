import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Volume2, Trophy, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useSettings, getPictogramImageUrl } from '../../utils/settings-context';
import { useTranslation } from '../../utils/translations';
import { toast } from 'sonner@2.0.3';
import { api } from '../../utils/api';

interface NumberMatchingGameProps {
  onBack: () => void;
  accessToken?: string;
}

interface NumberOption {
  value: number;
  pictogramId: number;
}

// ARASAAC pictogram IDs for numbers 1-10
const numbers: NumberOption[] = [
  { value: 1, pictogramId: 8793 },
  { value: 2, pictogramId: 8794 },
  { value: 3, pictogramId: 8795 },
  { value: 4, pictogramId: 8796 },
  { value: 5, pictogramId: 8797 },
  { value: 6, pictogramId: 8798 },
  { value: 7, pictogramId: 8799 },
  { value: 8, pictogramId: 8800 },
  { value: 9, pictogramId: 8801 },
  { value: 10, pictogramId: 8802 },
];

export function NumberMatchingGame({ onBack, accessToken }: NumberMatchingGameProps) {
  const { language } = useSettings();
  const t = useTranslation(language);
  const [currentNumber, setCurrentNumber] = useState<NumberOption>(numbers[0]);
  const [options, setOptions] = useState<NumberOption[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);

  useEffect(() => {
    startNewRound();
  }, []);

  const startNewRound = () => {
    // Pick a random number between 1-10 as target
    const availableNumbers = numbers.slice(0, Math.min(10, 5 + round)); // Gradually increase difficulty
    const targetNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    setCurrentNumber(targetNumber);

    // Create options (correct answer + 2 random wrong answers)
    const wrongNumbers = availableNumbers.filter(n => n.value !== targetNumber.value);
    const shuffled = [...wrongNumbers].sort(() => Math.random() - 0.5);
    const wrongOptions = shuffled.slice(0, 2);
    
    // Shuffle all options
    const allOptions = [targetNumber, ...wrongOptions].sort(() => Math.random() - 0.5);
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

  const handleNumberSelect = async (number: NumberOption) => {
    setSelectedOption(number.value);

    if (number.value === currentNumber.value) {
      // Correct answer!
      const newScore = score + 1;
      setScore(newScore);
      setShowCelebration(true);
      speak(language === 'pt' ? `Muito bem! ${number.value}!` : `Great job! ${number.value}!`);
      toast.success(language === 'pt' ? 'Correto! 🎉' : 'Correct! 🎉');

      // Track the game play on the first correct answer (first time only)
      if (newScore === 1 && !hasTrackedPlay && accessToken) {
        console.log('Tracking Number Matching game play...');
        try {
          const result = await api.trackGamePlay(
            accessToken,
            'numbers',
            language === 'pt' ? 'Números' : 'Number Matching',
            newScore,
            round
          );
          console.log('Game play tracked successfully:', result);
          setHasTrackedPlay(true);

          // Track activity
          const gameName = language === 'pt' ? 'Combinação de Números' : 'Number Matching';
          await api.trackActivity(
            accessToken,
            'game_finish',
            language === 'pt' 
              ? `Jogou o jogo "${gameName}" - Pontuação: ${newScore}`
              : `Played "${gameName}" game - Score: ${newScore}`,
            { gameId: 'numbers', gameName, score: newScore, round }
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

  const speakNumber = () => {
    speak(currentNumber.value.toString());
  };

  // Generate dots for visual counting
  const generateDots = (count: number) => {
    return Array.from({ length: count }, (_, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: i * 0.05 }}
        className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-md"
      />
    ));
  };

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
        className="bg-gradient-to-br from-blue-500 to-purple-400 rounded-3xl p-6 text-white shadow-xl text-center"
      >
        <h2 className="text-2xl sm:text-3xl mb-2">
          {language === 'pt' ? 'Combinar Números' : 'Number Matching'}
        </h2>
        <p className="text-sm sm:text-base text-blue-100">
          {language === 'pt' 
            ? 'Conta e toca no número correto!' 
            : 'Count and tap the correct number!'}
        </p>
      </motion.div>

      {/* Question: Show target number with dots */}
      <motion.div
        key={round}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-[#2d2438] rounded-3xl p-8 shadow-xl border-4 border-blue-200 dark:border-blue-700"
      >
        <p className="text-center text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-6">
          {language === 'pt' ? 'Quantos pontos vês?' : 'How many dots do you see?'}
        </p>

        <motion.button
          onClick={speakNumber}
          whileTap={{ scale: 0.95 }}
          className="w-full max-w-md mx-auto block"
        >
          <Card className="border-4 border-blue-300 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer">
            <div className="p-8 flex flex-col items-center gap-6">
              {/* Visual dots for counting */}
              <div className="grid gap-3" style={{
                gridTemplateColumns: `repeat(${Math.min(currentNumber.value, 5)}, 1fr)`,
                maxWidth: '300px'
              }}>
                {generateDots(currentNumber.value)}
              </div>

              {/* Audio icon */}
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Volume2 className="w-6 h-6" />
                <span className="text-sm">
                  {language === 'pt' ? 'Toca para ouvir' : 'Tap to hear'}
                </span>
              </div>
            </div>
          </Card>
        </motion.button>
      </motion.div>

      {/* Answer Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {options.map((number, index) => {
          const isSelected = selectedOption === number.value;
          const isCorrect = number.value === currentNumber.value;
          const showFeedback = isSelected;

          return (
            <motion.button
              key={number.value}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleNumberSelect(number)}
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
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <div className="p-6 sm:p-8 flex flex-col items-center gap-4">
                  {/* Pictogram */}
                  <div className="w-24 h-24 sm:w-32 sm:h-32 relative">
                    <img
                      src={getPictogramImageUrl(number.pictogramId)}
                      alt={number.value.toString()}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=' + number.value;
                      }}
                    />
                  </div>
                  
                  {/* Number */}
                  <p className="text-4xl sm:text-5xl text-gray-900 dark:text-gray-100">
                    {number.value}
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
            <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-12 shadow-2xl">
              <Trophy className="w-24 h-24 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
