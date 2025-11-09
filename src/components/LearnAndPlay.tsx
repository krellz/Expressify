import { useState } from 'react';
import { motion } from 'motion/react';
import { Palette, Hash, Type, Circle, Dog, MessageSquare } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useSettings } from '../utils/settings-context';
import { useTranslation } from '../utils/translations';
import { ColorMatchingGame } from './games/ColorMatchingGame';
import { NumberMatchingGame } from './games/NumberMatchingGame';

interface LearnAndPlayProps {
  accessToken: string;
}

interface GameCard {
  id: string;
  icon: React.ReactNode;
  titleKey: string;
  bgColor: string;
  hoverColor: string;
  available: boolean;
}

export function LearnAndPlay({ accessToken }: LearnAndPlayProps) {
  const { language } = useSettings();
  const t = useTranslation(language);
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const games: GameCard[] = [
    {
      id: 'colors',
      icon: <Palette className="w-12 h-12 sm:w-16 sm:h-16" />,
      titleKey: 'colors',
      bgColor: 'bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30',
      hoverColor: 'hover:from-pink-200 hover:to-pink-300 dark:hover:from-pink-900/50 dark:hover:to-pink-800/50',
      available: true,
    },
    {
      id: 'numbers',
      icon: <Hash className="w-12 h-12 sm:w-16 sm:h-16" />,
      titleKey: 'numbers',
      bgColor: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30',
      hoverColor: 'hover:from-blue-200 hover:to-blue-300 dark:hover:from-blue-900/50 dark:hover:to-blue-800/50',
      available: true,
    },
    {
      id: 'letters',
      icon: <Type className="w-12 h-12 sm:w-16 sm:h-16" />,
      titleKey: 'letters',
      bgColor: 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30',
      hoverColor: 'hover:from-green-200 hover:to-green-300 dark:hover:from-green-900/50 dark:hover:to-green-800/50',
      available: false,
    },
    {
      id: 'shapes',
      icon: <Circle className="w-12 h-12 sm:w-16 sm:h-16" />,
      titleKey: 'shapes',
      bgColor: 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30',
      hoverColor: 'hover:from-yellow-200 hover:to-yellow-300 dark:hover:from-yellow-900/50 dark:hover:to-yellow-800/50',
      available: false,
    },
    {
      id: 'animals',
      icon: <Dog className="w-12 h-12 sm:w-16 sm:h-16" />,
      titleKey: 'animals',
      bgColor: 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30',
      hoverColor: 'hover:from-orange-200 hover:to-orange-300 dark:hover:from-orange-900/50 dark:hover:to-orange-800/50',
      available: false,
    },
    {
      id: 'phrases',
      icon: <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16" />,
      titleKey: 'phraseBuilder',
      bgColor: 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30',
      hoverColor: 'hover:from-purple-200 hover:to-purple-300 dark:hover:from-purple-900/50 dark:hover:to-purple-800/50',
      available: false,
    },
  ];

  const handleGameClick = (gameId: string, available: boolean) => {
    if (available) {
      setActiveGame(gameId);
    }
  };

  const handleBackToMenu = () => {
    setActiveGame(null);
  };

  // Show active game if one is selected
  if (activeGame === 'colors') {
    return <ColorMatchingGame onBack={handleBackToMenu} accessToken={accessToken} />;
  }

  if (activeGame === 'numbers') {
    return <NumberMatchingGame onBack={handleBackToMenu} accessToken={accessToken} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500 to-orange-400 rounded-3xl p-6 text-white shadow-xl"
      >
        <h2 className="text-2xl sm:text-3xl mb-2">{t.games.title}</h2>
        <p className="text-sm sm:text-base text-purple-100">
          {t.games.subtitle}
        </p>
      </motion.div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`${game.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'} border-2 border-purple-200 dark:border-purple-700 transition-all duration-300 ${game.bgColor} ${game.available ? game.hoverColor : ''}`}
              onClick={() => handleGameClick(game.id, game.available)}
            >
              <CardContent className="p-6 sm:p-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center justify-center text-center space-y-4"
                >
                  {/* Icon */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-700">
                    <div className="text-purple-600 dark:text-purple-400">
                      {game.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
                    {t.games[game.titleKey as keyof typeof t.games]}
                  </h3>

                  {/* Available or Coming Soon Badge */}
                  {game.available ? (
                    <div className="px-4 py-1 bg-green-500/20 dark:bg-green-500/30 rounded-full border-2 border-green-500">
                      <span className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                        {language === 'pt' ? 'Jogar' : 'Play Now'}
                      </span>
                    </div>
                  ) : (
                    <div className="px-4 py-1 bg-white/50 dark:bg-gray-800/50 rounded-full">
                      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {language === 'pt' ? 'Em breve' : 'Coming Soon'}
                      </span>
                    </div>
                  )}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-[#2d2438] rounded-3xl p-6 shadow-xl border-2 border-purple-200 dark:border-purple-700"
      >
        <h3 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-3">
          {language === 'pt' ? 'Como Jogar' : 'How to Play'}
        </h3>
        <ul className="space-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span>
              {language === 'pt' 
                ? 'Toque em qualquer jogo para começar a aprender' 
                : 'Tap any game to start learning'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span>
              {language === 'pt' 
                ? 'Todos os jogos usam pictogramas ARASAAC para comunicação visual' 
                : 'All games use ARASAAC pictograms for visual communication'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span>
              {language === 'pt' 
                ? 'Ouça e repita para melhorar a comunicação' 
                : 'Listen and repeat to improve communication'}
            </span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
