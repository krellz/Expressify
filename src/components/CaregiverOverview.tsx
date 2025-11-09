import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  MessageSquare, 
  CheckCircle2, 
  Gamepad2, 
  Calendar,
  Clock,
  Share2,
  Lightbulb,
  ChevronRight,
  Puzzle,
  Volume2,
  Zap,
  Download
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useTranslation, Language } from '../utils/translations';
import { RoutineTask, api, GameStats, Activity } from '../utils/api';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface CaregiverOverviewProps {
  userName: string;
  language: Language;
  boardCount: number;
  pictogramCount: number;
  tasks: RoutineTask[];
  accessToken: string;
  onViewTasks?: () => void;
  onManageBoards?: () => void;
}

// Sample data - in a real app, this would come from the API
const generateWeeklyData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, index) => ({
    day,
    expressions: Math.floor(Math.random() * 30) + 40,
    sessions: Math.floor(Math.random() * 5) + 3,
  }));
};

export function CaregiverOverview({ userName, language, boardCount, pictogramCount, tasks, accessToken, onViewTasks, onManageBoards }: CaregiverOverviewProps) {
  const t = useTranslation(language);
  const [weeklyData, setWeeklyData] = useState(generateWeeklyData());
  const [streakDays, setStreakDays] = useState(5);
  const [gameStats, setGameStats] = useState<{ daily: GameStats[], weekly: GameStats[] }>({ daily: [], weekly: [] });
  const [statsView, setStatsView] = useState<'daily' | 'weekly'>('daily');
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  useEffect(() => {
    // In a real app, fetch actual data here
    setWeeklyData(generateWeeklyData());
    
    // Fetch game statistics
    const fetchGameStats = async () => {
      try {
        setIsLoadingStats(true);
        const stats = await api.getGameStats(accessToken);
        setGameStats(stats);
      } catch (error) {
        console.error('Failed to fetch game stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    // Fetch activities
    const fetchActivities = async () => {
      try {
        setIsLoadingActivities(true);
        const fetchedActivities = await api.getActivities(accessToken);
        setActivities(fetchedActivities);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchGameStats();
    fetchActivities();
  }, [accessToken]);

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const todayProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate total games played today
  const totalGamesPlayed = gameStats.daily.reduce((sum, game) => sum + game.totalPlays, 0);

  // Export PDF function
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Helper function to check if we need a new page
      const checkNewPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };

      // Title
      doc.setFontSize(22);
      doc.setTextColor(126, 58, 242); // Purple color
      doc.text('Expressify Dashboard Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const currentDate = new Date().toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(currentDate, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;

      // User info
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`${language === 'pt' ? 'Utilizador' : 'User'}: ${userName}`, 20, yPosition);
      yPosition += 10;

      // KPI Summary Section
      checkNewPage(40);
      doc.setFontSize(16);
      doc.setTextColor(126, 58, 242);
      doc.text(language === 'pt' ? 'Resumo de Métricas' : 'Metrics Summary', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Draw KPI boxes
      const kpiData = [
        { label: language === 'pt' ? 'Quadros Criados' : 'Boards Created', value: boardCount.toString() },
        { label: language === 'pt' ? 'Pictogramas Usados' : 'Pictograms Used', value: pictogramCount.toString() },
        { label: language === 'pt' ? 'Tarefas de Hoje' : "Today's Tasks", value: totalTasks > 0 ? `${completedTasks} / ${totalTasks}` : '0' },
        { label: language === 'pt' ? 'Jogos Jogados (Hoje)' : 'Games Played (Today)', value: totalGamesPlayed.toString() }
      ];

      kpiData.forEach((kpi, index) => {
        checkNewPage(15);
        doc.setDrawColor(200, 200, 200);
        doc.rect(20, yPosition, 80, 12);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(kpi.label, 22, yPosition + 5);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(kpi.value, 22, yPosition + 10);
        yPosition += 14;
      });

      yPosition += 5;

      // Game Statistics Section
      if (gameStats.daily.length > 0 || gameStats.weekly.length > 0) {
        checkNewPage(40);
        doc.setFontSize(16);
        doc.setTextColor(126, 58, 242);
        doc.text(language === 'pt' ? 'Estatísticas de Jogos' : 'Game Statistics', 20, yPosition);
        yPosition += 8;

        // Daily stats
        if (gameStats.daily.length > 0) {
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.text(language === 'pt' ? 'Hoje:' : 'Today:', 20, yPosition);
          yPosition += 6;

          doc.setFontSize(9);
          gameStats.daily.forEach(game => {
            checkNewPage(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`• ${game.gameName}:`, 25, yPosition);
            doc.setTextColor(0, 0, 0);
            const statsText = language === 'pt' 
              ? `${game.totalPlays} ${game.totalPlays === 1 ? 'jogo' : 'jogos'} - Média: ${game.averageScore.toFixed(1)} - Melhor: ${game.highestScore}`
              : `${game.totalPlays} ${game.totalPlays === 1 ? 'play' : 'plays'} - Avg: ${game.averageScore.toFixed(1)} - Best: ${game.highestScore}`;
            doc.text(statsText, 60, yPosition);
            yPosition += 6;
          });
          yPosition += 3;
        }

        // Weekly stats
        if (gameStats.weekly.length > 0) {
          checkNewPage(20);
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.text(language === 'pt' ? 'Esta Semana:' : 'This Week:', 20, yPosition);
          yPosition += 6;

          doc.setFontSize(9);
          gameStats.weekly.forEach(game => {
            checkNewPage(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`• ${game.gameName}:`, 25, yPosition);
            doc.setTextColor(0, 0, 0);
            const statsText = language === 'pt'
              ? `${game.totalPlays} ${game.totalPlays === 1 ? 'jogo' : 'jogos'} - Média: ${game.averageScore.toFixed(1)} - Melhor: ${game.highestScore}`
              : `${game.totalPlays} ${game.totalPlays === 1 ? 'play' : 'plays'} - Avg: ${game.averageScore.toFixed(1)} - Best: ${game.highestScore}`;
            doc.text(statsText, 60, yPosition);
            yPosition += 6;
          });
          yPosition += 5;
        }
      }

      // Tasks Section
      if (tasks.length > 0) {
        checkNewPage(40);
        doc.setFontSize(16);
        doc.setTextColor(126, 58, 242);
        doc.text(language === 'pt' ? 'Tarefas de Rotina' : 'Routine Tasks', 20, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(
          `${language === 'pt' ? 'Progresso' : 'Progress'}: ${completedTasks}/${totalTasks} (${todayProgress.toFixed(0)}%)`,
          20,
          yPosition
        );
        yPosition += 8;

        doc.setFontSize(9);
        tasks.forEach((task, index) => {
          checkNewPage(8);
          const status = task.completed ? '✓' : '○';
          doc.setTextColor(task.completed ? 0 : 100, task.completed ? 150 : 100, task.completed ? 0 : 100);
          doc.text(`${status} ${task.title}`, 25, yPosition);
          yPosition += 6;
        });
        yPosition += 5;
      }

      // Recent Activities Section
      if (activities.length > 0) {
        checkNewPage(40);
        doc.setFontSize(16);
        doc.setTextColor(126, 58, 242);
        doc.text(language === 'pt' ? 'Atividades Recentes' : 'Recent Activities', 20, yPosition);
        yPosition += 8;

        doc.setFontSize(9);
        const recentActivities = activities.slice(0, 15);
        
        recentActivities.forEach((activity) => {
          checkNewPage(10);
          
          // Get translated description
          const getTranslatedDescription = () => {
            if (language !== 'pt') {
              return activity.description;
            }

            const meta = activity.metadata || {};
            switch (activity.type) {
              case 'game_finish': {
                const gameName = meta.gameName || '';
                const score = meta.score || 0;
                return `Jogou o jogo "${gameName}" - Pontuação: ${score}`;
              }
              case 'task_complete': {
                const taskTitle = meta.taskTitle || '';
                return `Concluiu a tarefa "${taskTitle}"`;
              }
              case 'task_create': {
                const taskTitle = meta.taskTitle || '';
                return `Criou a tarefa "${taskTitle}"`;
              }
              case 'board_create': {
                const boardTitle = meta.boardTitle || '';
                return `Criou o quadro "${boardTitle}"`;
              }
              case 'board_use': {
                const boardTitle = meta.boardTitle || '';
                const keyword = meta.keyword || '';
                return `Usou "${keyword}" no quadro ${boardTitle}`;
              }
              case 'pictogram_use': {
                const keyword = meta.keyword || '';
                return `Usou o pictograma "${keyword}"`;
              }
              default:
                return activity.description;
            }
          };

          const description = getTranslatedDescription();
          const timestamp = new Date(activity.timestamp);
          const timeStr = timestamp.toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          doc.setTextColor(0, 0, 0);
          doc.text(`• ${description}`, 25, yPosition);
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(8);
          doc.text(timeStr, 25, yPosition + 4);
          doc.setFontSize(9);
          yPosition += 10;
        });
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `${language === 'pt' ? 'Gerado por' : 'Generated by'} Expressify - ${language === 'pt' ? 'Página' : 'Page'} ${i}/${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      const fileName = `Expressify_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast.success(
        language === 'pt' 
          ? 'Relatório exportado com sucesso!' 
          : 'Report exported successfully!'
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(
        language === 'pt'
          ? 'Erro ao exportar relatório'
          : 'Error exporting report'
      );
    }
  };

  const kpiCards = [
    {
      id: 1,
      icon: Puzzle,
      title: language === 'pt' ? 'Quadros Criados' : 'Boards Created',
      metric: boardCount.toString(),
      subtext: language === 'pt' ? 'total de quadros' : 'total boards',
      color: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 2,
      icon: MessageSquare,
      title: language === 'pt' ? 'Pictogramas Usados' : 'Pictograms Used',
      metric: pictogramCount.toString(),
      subtext: language === 'pt' ? 'total de usos' : 'total uses',
      color: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 3,
      icon: CheckCircle2,
      title: language === 'pt' ? 'Tarefas de Hoje' : 'Today\'s Tasks',
      metric: totalTasks > 0 ? `${completedTasks} / ${totalTasks}` : '0',
      subtext: language === 'pt' ? 'tarefas concluídas' : 'tasks completed',
      color: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      id: 4,
      icon: Gamepad2,
      title: language === 'pt' ? 'Jogos Jogados' : 'Games Played',
      metric: isLoadingStats ? '...' : totalGamesPlayed.toString(),
      subtext: language === 'pt' ? 'hoje' : 'today',
      color: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  const learningProgress = [
    { category: language === 'pt' ? 'Cores' : 'Colors', progress: 75, color: 'bg-purple-600' },
    { category: language === 'pt' ? 'Animais' : 'Animals', progress: 50, color: 'bg-blue-600' },
    { category: language === 'pt' ? 'Emoções' : 'Emotions', progress: 85, color: 'bg-green-600' },
    { category: language === 'pt' ? 'Comida' : 'Food', progress: 60, color: 'bg-orange-600' },
  ];

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-6">
      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4 sm:mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-purple-900 dark:text-white mb-1">
              {language === 'pt' ? 'Bem-vindo de volta' : 'Welcome back'}, {userName} 👋
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'pt' ? 'Aqui está um resumo do progresso de hoje' : "Here's a summary of today's progress"}
            </p>
          </div>
          <Button
            onClick={exportToPDF}
            variant="outline"
            className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            {language === 'pt' ? 'Exportar PDF' : 'Export PDF'}
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className={`p-2 sm:p-3 ${card.color} rounded-lg w-fit`}>
                    <card.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {card.title}
                    </p>
                    <p className="text-xl sm:text-2xl text-gray-900 dark:text-white mb-1">
                      {card.metric}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {card.subtext}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Weekly Engagement Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-gray-900 dark:text-white mb-1">
                  {language === 'pt' ? 'Envolvimento Semanal' : 'Weekly Engagement'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'pt' ? 'Atividade dos últimos 7 dias' : 'Activity over the last 7 days'}
                </p>
              </div>
              <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-0">
                <Zap className="w-3 h-3 mr-1" />
                {language === 'pt' ? `${streakDays} dias` : `${streakDays} days`}
              </Badge>
            </div>
            
            <div className="h-48 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorExpressions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#6B7280" 
                    className="text-xs sm:text-sm"
                  />
                  <YAxis 
                    stroke="#6B7280" 
                    className="text-xs sm:text-sm"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expressions" 
                    stroke="#7C3AED" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorExpressions)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-700 dark:text-green-300">
                {language === 'pt' 
                  ? `Você está em uma sequência de ${streakDays} dias de comunicação!` 
                  : `You're on a ${streakDays}-day communication streak!`}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Tasks Snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="h-full">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white">
                    {language === 'pt' ? 'Tarefas de Hoje' : "Today's Tasks"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {totalTasks > 0 
                      ? (language === 'pt' ? `${completedTasks} de ${totalTasks} tarefas concluídas` : `${completedTasks} of ${totalTasks} tasks done`)
                      : (language === 'pt' ? 'Nenhuma tarefa criada' : 'No tasks created')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {language === 'pt' ? 'Progresso' : 'Progress'}
                    </span>
                    <span className="text-sm text-purple-600 dark:text-purple-400">
                      {Math.round(todayProgress)}%
                    </span>
                  </div>
                  <Progress value={isNaN(todayProgress) ? 0 : todayProgress} className="h-2" />
                </div>

                {totalTasks > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tasks.filter(t => !t.completed).length > 0 
                        ? (language === 'pt' ? `${tasks.filter(t => !t.completed).length} restantes:` : `${tasks.filter(t => !t.completed).length} remaining:`)
                        : (language === 'pt' ? 'Todas concluídas! 🎉' : 'All done! 🎉')}
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {tasks.filter(t => !t.completed).slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                          <span className="truncate">{task.title}</span>
                        </div>
                      ))}
                      {tasks.filter(t => !t.completed).length > 3 && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 pl-4">
                          {language === 'pt' ? `+${tasks.filter(t => !t.completed).length - 3} mais...` : `+${tasks.filter(t => !t.completed).length - 3} more...`}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {language === 'pt' ? 'Clique abaixo para adicionar tarefas' : 'Click below to add tasks'}
                    </p>
                  </div>
                )}

                <Button 
                  onClick={onViewTasks}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-4"
                >
                  {totalTasks > 0 
                    ? (language === 'pt' ? 'Ver Todas as Tarefas' : 'View All Tasks')
                    : (language === 'pt' ? 'Adicionar Tarefas' : 'Add Tasks')}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Learning & Play Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <Card className="h-full">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Gamepad2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white">
                    {language === 'pt' ? 'Progresso de Aprendizagem' : 'Learning Progress'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'pt' ? 'Categorias de jogos' : 'Game categories'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* View Toggle */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={statsView === 'daily' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatsView('daily')}
                    className={statsView === 'daily' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    {language === 'pt' ? 'Hoje' : 'Daily'}
                  </Button>
                  <Button
                    variant={statsView === 'weekly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatsView('weekly')}
                    className={statsView === 'weekly' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    {language === 'pt' ? 'Semanal' : 'Weekly'}
                  </Button>
                </div>

                {isLoadingStats ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'pt' ? 'A carregar...' : 'Loading...'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Game Stats */}
                    {(statsView === 'daily' ? gameStats.daily : gameStats.weekly).length > 0 ? (
                      <>
                        {(statsView === 'daily' ? gameStats.daily : gameStats.weekly).map((game, index) => (
                          <div key={game.gameId} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {language === 'pt' 
                                  ? (game.gameName === 'Color Matching' || game.gameName === 'Cores' 
                                      ? 'Combinação de Cores' 
                                      : game.gameName === 'Number Matching' || game.gameName === 'Números'
                                      ? 'Combinação de Números'
                                      : game.gameName)
                                  : (game.gameName === 'Combinação de Cores' || game.gameName === 'Cores'
                                      ? 'Color Matching'
                                      : game.gameName === 'Combinação de Números' || game.gameName === 'Números'
                                      ? 'Number Matching'
                                      : game.gameName)
                                }
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {game.totalPlays} {language === 'pt' ? 'jogadas' : 'plays'}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((game.totalPlays / 10) * 100, 100)}%` }}
                                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                              />
                            </div>
                          </div>
                        ))}
                        
                        {/* Most Played Game */}
                        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            {language === 'pt' ? 'Jogo mais jogado: ' : 'Most played game: '}
                            <span>
                              {(() => {
                                const topGame = (statsView === 'daily' ? gameStats.daily : gameStats.weekly)
                                  .sort((a, b) => b.totalPlays - a.totalPlays)[0]?.gameName;
                                
                                if (!topGame) return language === 'pt' ? 'Nenhum' : 'None';
                                
                                if (language === 'pt') {
                                  if (topGame === 'Color Matching' || topGame === 'Cores') return 'Combinação de Cores';
                                  if (topGame === 'Number Matching' || topGame === 'Números') return 'Combinação de Números';
                                  return topGame;
                                } else {
                                  if (topGame === 'Combinação de Cores' || topGame === 'Cores') return 'Color Matching';
                                  if (topGame === 'Combinação de Números' || topGame === 'Números') return 'Number Matching';
                                  return topGame;
                                }
                              })()}
                            </span>
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {language === 'pt' 
                            ? 'Sem dados de jogos. Jogue alguns jogos na aba "Games"!' 
                            : 'No game data yet. Play some games in the "Games" tab!'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-gray-900 dark:text-white mb-4">
              {language === 'pt' ? 'Atividade Recente' : 'Recent Activity'}
            </h3>
            
            <div className="space-y-3">
              {isLoadingActivities ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {language === 'pt' ? 'A carregar...' : 'Loading...'}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {language === 'pt' 
                    ? 'Nenhuma atividade ainda. Comece a usar o Expressify!' 
                    : 'No activities yet. Start using Expressify!'}
                </div>
              ) : (
                activities.slice(0, 10).map((activity, index) => {
                  // Map activity types to icons and colors
                  const getActivityIcon = (type: string) => {
                    switch (type) {
                      case 'pictogram_use':
                      case 'board_use':
                        return Volume2;
                      case 'task_complete':
                      case 'task_create':
                        return CheckCircle2;
                      case 'game_finish':
                        return Gamepad2;
                      case 'board_create':
                        return Puzzle;
                      default:
                        return MessageSquare;
                    }
                  };

                  const getActivityColor = (type: string) => {
                    switch (type) {
                      case 'pictogram_use':
                      case 'board_use':
                        return 'text-blue-600 dark:text-blue-400';
                      case 'task_complete':
                      case 'task_create':
                        return 'text-green-600 dark:text-green-400';
                      case 'game_finish':
                        return 'text-purple-600 dark:text-purple-400';
                      case 'board_create':
                        return 'text-indigo-600 dark:text-indigo-400';
                      default:
                        return 'text-orange-600 dark:text-orange-400';
                    }
                  };

                  const getActivityBgColor = (type: string) => {
                    switch (type) {
                      case 'pictogram_use':
                      case 'board_use':
                        return 'bg-blue-100 dark:bg-blue-900/30';
                      case 'task_complete':
                      case 'task_create':
                        return 'bg-green-100 dark:bg-green-900/30';
                      case 'game_finish':
                        return 'bg-purple-100 dark:bg-purple-900/30';
                      case 'board_create':
                        return 'bg-indigo-100 dark:bg-indigo-900/30';
                      default:
                        return 'bg-orange-100 dark:bg-orange-900/30';
                    }
                  };

                  const getTimeAgo = (timestamp: string) => {
                    const now = new Date().getTime();
                    const activityTime = new Date(timestamp).getTime();
                    const diffMinutes = Math.floor((now - activityTime) / (1000 * 60));

                    if (diffMinutes < 1) {
                      return language === 'pt' ? 'agora mesmo' : 'just now';
                    } else if (diffMinutes < 60) {
                      return language === 'pt' 
                        ? `${diffMinutes} min atrás` 
                        : `${diffMinutes} min ago`;
                    } else if (diffMinutes < 1440) {
                      const hours = Math.floor(diffMinutes / 60);
                      return language === 'pt'
                        ? `${hours} ${hours === 1 ? 'hora' : 'horas'} atrás`
                        : `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
                    } else {
                      const days = Math.floor(diffMinutes / 1440);
                      return language === 'pt'
                        ? `${days} ${days === 1 ? 'dia' : 'dias'} atrás`
                        : `${days} ${days === 1 ? 'day' : 'days'} ago`;
                    }
                  };

                  // Translate activity description based on type and metadata
                  const getTranslatedDescription = () => {
                    if (language !== 'pt') {
                      return activity.description;
                    }

                    const meta = activity.metadata || {};

                    switch (activity.type) {
                      case 'game_finish': {
                        const gameName = meta.gameName || '';
                        const score = meta.score || 0;
                        return `Jogou o jogo "${gameName}" - Pontuação: ${score}`;
                      }
                      case 'task_complete': {
                        const taskTitle = meta.taskTitle || '';
                        return `Concluiu a tarefa "${taskTitle}"`;
                      }
                      case 'task_create': {
                        const taskTitle = meta.taskTitle || '';
                        return `Criou a tarefa "${taskTitle}"`;
                      }
                      case 'board_create': {
                        const boardTitle = meta.boardTitle || '';
                        return `Criou o quadro "${boardTitle}"`;
                      }
                      case 'board_use': {
                        const boardTitle = meta.boardTitle || '';
                        const keyword = meta.keyword || '';
                        return `Usou "${keyword}" no quadro ${boardTitle}`;
                      }
                      case 'pictogram_use': {
                        const keyword = meta.keyword || '';
                        return `Usou o pictograma "${keyword}"`;
                      }
                      default:
                        return activity.description;
                    }
                  };

                  const ActivityIcon = getActivityIcon(activity.type);

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.45 + index * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className={`p-2 ${getActivityBgColor(activity.type)} rounded-lg flex-shrink-0`}>
                        <ActivityIcon className={`w-4 h-4 ${getActivityColor(activity.type)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {getTranslatedDescription()}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {getTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Board Sharing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="h-full">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                  <Share2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white">
                    {language === 'pt' ? 'Partilha de Quadros' : 'Board Sharing'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'pt' ? 'Colaboração' : 'Collaboration'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                  <p className="text-2xl text-gray-900 dark:text-white mb-1">2</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'pt' ? 'quadros partilhados esta semana' : 'boards shared this week'}
                  </p>
                </div>

                <Button 
                  onClick={onManageBoards}
                  variant="outline"
                  className="w-full border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                >
                  {language === 'pt' ? 'Gerir Quadros Partilhados' : 'Manage Shared Boards'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Call to Action / Reminders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.55 }}
        >
          <Card className="h-full border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/10 dark:to-card">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Lightbulb className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white">
                    {language === 'pt' ? 'Lembretes' : 'Reminders'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'pt' ? 'Sugestões úteis' : 'Helpful suggestions'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                  <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {language === 'pt' 
                      ? 'A rotina de amanhã começa às 8:00 AM' 
                      : "Tomorrow's routine starts at 8:00 AM"}
                  </p>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                  <Puzzle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {language === 'pt' 
                      ? 'Considere adicionar um novo quadro para "Atividades Após a Escola"' 
                      : 'Consider adding a new board for "After School Activities"'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
