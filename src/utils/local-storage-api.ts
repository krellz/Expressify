import { Board, BoardPictogram, RoutineTask, GamePlay, GameStatsResponse, Activity, Pictogram } from './api';

export const GUEST_TOKEN = 'GUEST_LOCAL_USER';

const STORAGE_KEYS = {
  boards: 'expressify-guest-boards',
  tasks: 'expressify-guest-tasks',
  games: 'expressify-guest-games',
  activities: 'expressify-guest-activities',
  pictogramUsage: 'expressify-guest-pictogram-usage',
  guestMode: 'expressify-guest-mode',
};

export function isGuestMode(): boolean {
  return localStorage.getItem(STORAGE_KEYS.guestMode) === 'true';
}

export function setGuestMode(value: boolean): void {
  if (value) {
    localStorage.setItem(STORAGE_KEYS.guestMode, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.guestMode);
  }
}

function generateId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const localApi = {
  async getBoards(): Promise<Board[]> {
    return getFromStorage<Board[]>(STORAGE_KEYS.boards, []);
  },

  async createBoard(title: string, pictograms: BoardPictogram[] = []): Promise<Board> {
    const boards = getFromStorage<Board[]>(STORAGE_KEYS.boards, []);
    const now = new Date().toISOString();
    const newBoard: Board = {
      id: generateId(),
      title,
      pictograms,
      userId: 'guest',
      createdAt: now,
      updatedAt: now,
    };
    boards.push(newBoard);
    saveToStorage(STORAGE_KEYS.boards, boards);
    return newBoard;
  },

  async updateBoard(boardId: string, title?: string, pictograms?: BoardPictogram[]): Promise<Board> {
    const boards = getFromStorage<Board[]>(STORAGE_KEYS.boards, []);
    const index = boards.findIndex(b => b.id === boardId);
    if (index === -1) throw new Error('Board not found');
    boards[index] = {
      ...boards[index],
      ...(title !== undefined ? { title } : {}),
      ...(pictograms !== undefined ? { pictograms } : {}),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.boards, boards);
    return boards[index];
  },

  async deleteBoard(boardId: string): Promise<void> {
    const boards = getFromStorage<Board[]>(STORAGE_KEYS.boards, []);
    saveToStorage(STORAGE_KEYS.boards, boards.filter(b => b.id !== boardId));
  },

  async searchPictograms(query: string, language: string = 'en'): Promise<Pictogram[]> {
    try {
      const url = `https://api.arasaac.org/v1/pictograms/${language}/search/${encodeURIComponent(query)}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      if (!Array.isArray(data)) return [];
      return data.map((p: any) => ({
        id: p._id,
        keywords: p.keywords,
        imageUrl: `https://static.arasaac.org/pictograms/${p._id}/${p._id}_500.png`,
      }));
    } catch {
      return [];
    }
  },

  async chatWithAI(_message: string, language: string = 'en'): Promise<{ message: string }> {
    const msg = language === 'pt'
      ? 'O assistente de IA está disponível apenas com uma conta registada. Por favor, inicie sessão para utilizar esta funcionalidade.'
      : 'The AI assistant is only available with a registered account. Please sign in to use this feature.';
    return { message: msg };
  },

  async trackPictogramUsage(): Promise<number> {
    const count = getFromStorage<number>(STORAGE_KEYS.pictogramUsage, 0) + 1;
    saveToStorage(STORAGE_KEYS.pictogramUsage, count);
    return count;
  },

  async getPictogramUsageCount(): Promise<number> {
    return getFromStorage<number>(STORAGE_KEYS.pictogramUsage, 0);
  },

  async getTasks(language: string = 'en'): Promise<RoutineTask[]> {
    const tasks = getFromStorage<RoutineTask[]>(STORAGE_KEYS.tasks, []);
    return tasks.filter(t => t.language === language);
  },

  async createTask(
    title: string,
    language: string = 'en',
    pictogramId?: number | null,
    pictogramKeyword?: string,
    pictogramImageUrl?: string
  ): Promise<RoutineTask> {
    const tasks = getFromStorage<RoutineTask[]>(STORAGE_KEYS.tasks, []);
    const now = new Date().toISOString();
    const newTask: RoutineTask = {
      id: generateId(),
      title,
      pictogramId: pictogramId ?? null,
      pictogramKeyword: pictogramKeyword ?? '',
      pictogramImageUrl: pictogramImageUrl ?? '',
      completed: false,
      userId: 'guest',
      language,
      createdAt: now,
      updatedAt: now,
      order: tasks.length,
    };
    tasks.push(newTask);
    saveToStorage(STORAGE_KEYS.tasks, tasks);
    return newTask;
  },

  async updateTask(
    taskId: string,
    _language: string,
    updates: { title?: string; completed?: boolean; order?: number }
  ): Promise<RoutineTask> {
    const tasks = getFromStorage<RoutineTask[]>(STORAGE_KEYS.tasks, []);
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) throw new Error('Task not found');
    tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.tasks, tasks);
    return tasks[index];
  },

  async deleteTask(taskId: string): Promise<void> {
    const tasks = getFromStorage<RoutineTask[]>(STORAGE_KEYS.tasks, []);
    saveToStorage(STORAGE_KEYS.tasks, tasks.filter(t => t.id !== taskId));
  },

  async trackGamePlay(
    gameId: string,
    gameName: string,
    score: number,
    round: number
  ): Promise<GamePlay> {
    const games = getFromStorage<GamePlay[]>(STORAGE_KEYS.games, []);
    const newPlay: GamePlay = {
      id: generateId(),
      gameId,
      gameName,
      score,
      round,
      userId: 'guest',
      playedAt: new Date().toISOString(),
    };
    games.push(newPlay);
    saveToStorage(STORAGE_KEYS.games, games);
    return newPlay;
  },

  async getGameStats(): Promise<GameStatsResponse> {
    const games = getFromStorage<GamePlay[]>(STORAGE_KEYS.games, []);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;

    const computeStats = (plays: GamePlay[]) => {
      const byGame = new Map<string, GamePlay[]>();
      plays.forEach(p => {
        const list = byGame.get(p.gameId) ?? [];
        list.push(p);
        byGame.set(p.gameId, list);
      });
      return Array.from(byGame.entries()).map(([gameId, gamePlays]) => ({
        gameId,
        gameName: gamePlays[0].gameName,
        totalPlays: gamePlays.length,
        averageScore: gamePlays.reduce((s, p) => s + p.score, 0) / gamePlays.length,
        highestScore: Math.max(...gamePlays.map(p => p.score)),
        lastPlayedAt: gamePlays[gamePlays.length - 1].playedAt,
      }));
    };

    const daily = computeStats(games.filter(g => new Date(g.playedAt).getTime() >= todayStart));
    const weekly = computeStats(games.filter(g => new Date(g.playedAt).getTime() >= weekStart));

    return { daily, weekly };
  },

  async trackActivity(
    type: Activity['type'],
    description: string,
    metadata?: Record<string, any>
  ): Promise<Activity> {
    const activities = getFromStorage<Activity[]>(STORAGE_KEYS.activities, []);
    const newActivity: Activity = {
      id: generateId(),
      type,
      description,
      metadata: metadata ?? {},
      userId: 'guest',
      timestamp: new Date().toISOString(),
    };
    activities.push(newActivity);
    saveToStorage(STORAGE_KEYS.activities, activities.slice(-100));
    return newActivity;
  },

  async getActivities(): Promise<Activity[]> {
    const activities = getFromStorage<Activity[]>(STORAGE_KEYS.activities, []);
    return activities.slice().reverse();
  },
};
