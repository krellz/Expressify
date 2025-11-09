import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-8ddbeee3`;

export interface User {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    userType: 'caregiver' | 'child';
  };
}

export interface Pictogram {
  id: number;
  keywords: Array<{ keyword: string }>;
  imageUrl: string;
  tags?: string[];
}

export interface BoardPictogram {
  id: number;
  keyword: string;
  imageUrl: string;
  position: number;
}

export interface Board {
  id: string;
  title: string;
  pictograms: BoardPictogram[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineTask {
  id: string;
  title: string;
  pictogramId: number | null;
  pictogramKeyword: string;
  pictogramImageUrl: string;
  completed: boolean;
  userId: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface GamePlay {
  id: string;
  gameId: string;
  gameName: string;
  score: number;
  round: number;
  userId: string;
  playedAt: string;
}

export interface GameStats {
  gameId: string;
  gameName: string;
  totalPlays: number;
  averageScore: number;
  highestScore: number;
  lastPlayedAt?: string;
}

export interface GameStatsResponse {
  daily: GameStats[];
  weekly: GameStats[];
}

export interface Activity {
  id: string;
  type: 'pictogram_use' | 'task_complete' | 'task_create' | 'game_finish' | 'board_create' | 'board_use';
  description: string;
  metadata: Record<string, any>;
  userId: string;
  timestamp: string;
}

export const api = {
  async signup(email: string, password: string, name: string, userType: 'caregiver' | 'child') {
    const response = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ email, password, name, userType })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    return data;
  },

  async getBoards(accessToken: string): Promise<Board[]> {
    const response = await fetch(`${API_BASE}/boards`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch boards');
    }

    return data.boards;
  },

  async createBoard(accessToken: string, title: string, pictograms: BoardPictogram[] = []): Promise<Board> {
    const response = await fetch(`${API_BASE}/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ title, pictograms })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create board');
    }

    return data.board;
  },

  async updateBoard(accessToken: string, boardId: string, title?: string, pictograms?: BoardPictogram[]): Promise<Board> {
    const response = await fetch(`${API_BASE}/boards/${boardId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ title, pictograms })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update board');
    }

    return data.board;
  },

  async deleteBoard(accessToken: string, boardId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/boards/${boardId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete board');
    }
  },

  async searchPictograms(accessToken: string, query: string, language: string = 'en'): Promise<Pictogram[]> {
    try {
      const response = await fetch(
        `${API_BASE}/pictograms/search?q=${encodeURIComponent(query)}&lang=${language}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();
      
      // Even if the response is not ok, check if we have pictograms in the response
      if (data.pictograms && Array.isArray(data.pictograms)) {
        return data.pictograms;
      }
      
      if (!response.ok) {
        console.error(`Pictogram search failed for "${query}":`, data.error, data.details);
        throw new Error(data.error || 'Failed to search pictograms');
      }

      return data.pictograms || [];
    } catch (error: any) {
      console.error(`Error searching pictograms for "${query}":`, error.message);
      // Return empty array instead of throwing to allow app to continue
      return [];
    }
  },

  async chatWithAI(accessToken: string, message: string, language: string = 'en'): Promise<{ message: string; board?: { title: string; keywords: string[] } }> {
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ message, language })
    });

    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.error || 'Failed to chat with AI';
      const details = data.details ? ` - ${data.details}` : '';
      console.error('AI Chat API error:', response.status, errorMsg, details);
      throw new Error(`${errorMsg}${details}`);
    }

    return data;
  },

  async trackPictogramUsage(accessToken: string): Promise<number> {
    const response = await fetch(`${API_BASE}/pictograms/track`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to track pictogram usage');
    }

    return data.count;
  },

  async getPictogramUsageCount(accessToken: string): Promise<number> {
    const response = await fetch(`${API_BASE}/pictograms/usage`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get pictogram usage count');
    }

    return data.count;
  },

  // Tasks
  async getTasks(accessToken: string, language: string = 'en'): Promise<RoutineTask[]> {
    const response = await fetch(`${API_BASE}/tasks?lang=${language}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch tasks');
    }

    return data.tasks;
  },

  async createTask(
    accessToken: string,
    title: string,
    language: string = 'en',
    pictogramId?: number | null,
    pictogramKeyword?: string,
    pictogramImageUrl?: string
  ): Promise<RoutineTask> {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ title, language, pictogramId, pictogramKeyword, pictogramImageUrl })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create task');
    }

    return data.task;
  },

  async updateTask(
    accessToken: string,
    taskId: string,
    language: string,
    updates: { title?: string; completed?: boolean; order?: number }
  ): Promise<RoutineTask> {
    const response = await fetch(`${API_BASE}/tasks/${taskId}?lang=${language}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update task');
    }

    return data.task;
  },

  async deleteTask(accessToken: string, taskId: string, language: string): Promise<void> {
    const response = await fetch(`${API_BASE}/tasks/${taskId}?lang=${language}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete task');
    }
  },

  // Games
  async trackGamePlay(
    accessToken: string, 
    gameId: string, 
    gameName: string, 
    score: number, 
    round: number
  ): Promise<GamePlay> {
    console.log('Sending game play tracking request:', { gameId, gameName, score, round });
    
    const response = await fetch(`${API_BASE}/games/play`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ gameId, gameName, score, round })
    });

    const data = await response.json();
    console.log('Game play tracking response:', data);
    
    if (!response.ok) {
      console.error('Game play tracking failed:', data.error);
      throw new Error(data.error || 'Failed to track game play');
    }

    return data.gamePlay;
  },

  async getGameStats(accessToken: string): Promise<GameStatsResponse> {
    console.log('Fetching game stats...');
    
    const response = await fetch(`${API_BASE}/games/stats`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    console.log('Game stats response:', data);
    
    if (!response.ok) {
      console.error('Failed to fetch game stats:', data.error);
      throw new Error(data.error || 'Failed to fetch game stats');
    }

    return data;
  },

  // Activities
  async trackActivity(
    accessToken: string,
    type: 'pictogram_use' | 'task_complete' | 'task_create' | 'game_finish' | 'board_create' | 'board_use',
    description: string,
    metadata?: Record<string, any>
  ): Promise<Activity> {
    console.log('Tracking activity:', { type, description, metadata });
    
    const response = await fetch(`${API_BASE}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ type, description, metadata })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Activity tracking failed:', data.error);
      throw new Error(data.error || 'Failed to track activity');
    }

    return data.activity;
  },

  async getActivities(accessToken: string): Promise<Activity[]> {
    console.log('Fetching activities...');
    
    const response = await fetch(`${API_BASE}/activities`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Failed to fetch activities:', data.error);
      throw new Error(data.error || 'Failed to fetch activities');
    }

    return data.activities;
  }
};
