import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, CheckCircle2, Circle, Edit2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
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
import { api, RoutineTask } from '../utils/api';
import { toast } from 'sonner@2.0.3';
import { useSettings } from '../utils/settings-context';
import { useTranslation } from '../utils/translations';

interface TaskTrackerProps {
  accessToken: string;
  onTasksChange?: (tasks: RoutineTask[]) => void;
}

export function TaskTracker({ accessToken, onTasksChange }: TaskTrackerProps) {
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<RoutineTask | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<RoutineTask | null>(null);
  
  // Form state
  const [taskName, setTaskName] = useState('');

  const { language } = useSettings();
  const t = useTranslation(language);

  useEffect(() => {
    loadTasks();
  }, [language]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const fetchedTasks = await api.getTasks(accessToken, language);
      setTasks(fetchedTasks);
      onTasksChange?.(fetchedTasks);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      toast.error(t.toast.failedToLoadTasks);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!taskName.trim()) {
      toast.error(language === 'pt' ? 'Por favor, insira um nome para a tarefa' : 'Please enter a task name');
      return;
    }

    try {
      const newTask = await api.createTask(
        accessToken,
        taskName,
        language
      );

      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      onTasksChange?.(updatedTasks);
      toast.success(t.toast.taskAdded);

      // Track activity
      await api.trackActivity(
        accessToken,
        'task_create',
        language === 'pt' 
          ? `Criou a tarefa "${taskName}"`
          : `Created task "${taskName}"`,
        { taskId: newTask.id, taskTitle: taskName }
      );
      
      // Reset form
      setTaskName('');
      setShowAddDialog(false);
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast.error(t.toast.failedToSaveTask);
    }
  };

  const handleEditTask = async () => {
    if (!taskToEdit || !taskName.trim()) {
      toast.error(language === 'pt' ? 'Por favor, insira um nome para a tarefa' : 'Please enter a task name');
      return;
    }

    try {
      const updatedTask = await api.updateTask(accessToken, taskToEdit.id, language, {
        title: taskName
      });

      const updatedTasks = tasks.map(t => t.id === taskToEdit.id ? updatedTask : t);
      setTasks(updatedTasks);
      onTasksChange?.(updatedTasks);
      toast.success(language === 'pt' ? 'Tarefa atualizada com sucesso!' : 'Task updated successfully!');
      
      // Reset form
      setTaskName('');
      setTaskToEdit(null);
      setShowEditDialog(false);
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(t.toast.failedToSaveTask);
    }
  };

  const handleToggleTask = async (task: RoutineTask) => {
    const newCompletedState = !task.completed;
    
    try {
      const updatedTask = await api.updateTask(accessToken, task.id, language, {
        completed: newCompletedState
      });

      const updatedTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
      setTasks(updatedTasks);
      onTasksChange?.(updatedTasks);
      
      if (newCompletedState) {
        toast.success(t.tasks.taskCompleted);
        // Play completion sound
        playCompletionSound();

        // Track activity
        await api.trackActivity(
          accessToken,
          'task_complete',
          language === 'pt' 
            ? `Concluiu a tarefa "${task.title}"`
            : `Completed task "${task.title}"`,
          { taskId: task.id, taskTitle: task.title }
        );
      } else {
        toast.info(t.tasks.taskUncompleted);
      }
    } catch (error: any) {
      console.error('Error toggling task:', error);
      toast.error(t.toast.failedToSaveTask);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await api.deleteTask(accessToken, taskToDelete.id, language);
      const updatedTasks = tasks.filter(t => t.id !== taskToDelete.id);
      setTasks(updatedTasks);
      onTasksChange?.(updatedTasks);
      toast.success(t.toast.taskDeleted);
      setTaskToDelete(null);
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error(t.toast.failedToDeleteTask);
    }
  };

  const openEditDialog = (task: RoutineTask) => {
    setTaskToEdit(task);
    setTaskName(task.title);
    setShowEditDialog(true);
  };

  const playCompletionSound = () => {
    // Play a celebratory sound using speech synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(language === 'pt' ? 'Muito bem!' : 'Great job!');
      utterance.rate = 1.0;
      utterance.pitch = 1.2;
      utterance.lang = language === 'pt' ? 'pt-PT' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{language === 'pt' ? 'A carregar tarefas...' : 'Loading tasks...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500 to-orange-400 rounded-3xl p-6 text-white shadow-xl"
      >
        <h2 className="text-2xl sm:text-3xl mb-2">{t.tasks.title}</h2>
        <p className="text-sm sm:text-base text-purple-100 mb-4">
          {completedCount} / {totalCount} {t.tasks.tasksCompleted}
        </p>
        <Progress 
          value={isNaN(progressPercentage) ? 0 : progressPercentage} 
          className="h-3 bg-white/30"
        />
      </motion.div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl text-gray-900 dark:text-gray-100 mb-2">{t.tasks.noTasks}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t.tasks.noTasksDesc}</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`border-2 transition-all ${
                  task.completed 
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700' 
                    : 'border-purple-200 hover:border-purple-300 dark:border-purple-700'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg sm:text-xl font-medium ${
                          task.completed 
                            ? 'text-green-900 dark:text-green-100 line-through' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {task.title}
                        </h3>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(task)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>

                        {/* Completion Toggle */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleToggleTask(task)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            task.completed
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            <Circle className="w-6 h-6" />
                          )}
                        </motion.button>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTaskToDelete(task)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Task Button - Below Task List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={() => {
            setTaskName('');
            setShowAddDialog(true);
          }}
          size="lg"
          className="w-full bg-gradient-to-r from-purple-500 to-orange-400 hover:from-purple-600 hover:to-orange-500 shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t.tasks.addTask}
        </Button>
      </motion.div>

      {/* Add Task Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.tasks.addTask}</DialogTitle>
            <DialogDescription>
              {language === 'pt' 
                ? 'Adicione uma nova tarefa à sua lista diária' 
                : 'Add a new task to your daily list'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Task Name */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t.tasks.taskName}
              </label>
              <Input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder={t.tasks.taskNamePlaceholder}
                className="w-full"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTask();
                  }
                }}
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t.dashboard.cancel}
            </Button>
            <Button
              onClick={handleAddTask}
              disabled={!taskName.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {t.tasks.addTask}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'pt' ? 'Editar Tarefa' : 'Edit Task'}</DialogTitle>
            <DialogDescription>
              {language === 'pt' 
                ? 'Altere o nome da tarefa' 
                : 'Change the task name'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Task Name */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t.tasks.taskName}
              </label>
              <Input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder={t.tasks.taskNamePlaceholder}
                className="w-full"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleEditTask();
                  }
                }}
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t.dashboard.cancel}
            </Button>
            <Button
              onClick={handleEditTask}
              disabled={!taskName.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {language === 'pt' ? 'Salvar' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.tasks.deleteTask}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.tasks.deleteTaskConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.dashboard.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700"
            >
              {t.dashboard.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
