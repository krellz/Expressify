import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Health check
app.get('/make-server-8ddbeee3/health', (c) => {
  return c.json({ status: 'ok' });
});

// Sign up endpoint
app.post('/make-server-8ddbeee3/signup', async (c) => {
  try {
    const { email, password, name, userType } = await c.req.json();

    if (!email || !password || !name || !userType) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, userType },
      email_confirm: true // Automatically confirm since email server is not configured
    });

    if (error) {
      console.log('Error creating user during signup:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log('Server error during signup:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get all boards for a user
app.get('/make-server-8ddbeee3/boards', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const boards = await kv.getByPrefix(`board:${user.id}:`);
    
    // getByPrefix returns an array of values (board objects with id already included)
    return c.json({ boards: boards || [] });
  } catch (error) {
    console.log('Error fetching boards:', error);
    return c.json({ error: 'Failed to fetch boards' }, 500);
  }
});

// Create a new board
app.post('/make-server-8ddbeee3/boards', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, pictograms } = await c.req.json();

    if (!title) {
      return c.json({ error: 'Board title is required' }, 400);
    }

    const boardId = crypto.randomUUID();
    const boardData = {
      id: boardId, // Store the ID in the board data
      title,
      pictograms: pictograms || [],
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`board:${user.id}:${boardId}`, boardData);

    return c.json({ board: boardData });
  } catch (error) {
    console.log('Error creating board:', error);
    return c.json({ error: 'Failed to create board' }, 500);
  }
});

// Update a board
app.put('/make-server-8ddbeee3/boards/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const boardId = c.req.param('id');
    const { title, pictograms } = await c.req.json();

    const existingBoard = await kv.get(`board:${user.id}:${boardId}`);
    
    if (!existingBoard) {
      return c.json({ error: 'Board not found' }, 404);
    }

    const updatedBoard = {
      ...existingBoard,
      id: boardId, // Ensure ID is always present
      title: title !== undefined ? title : existingBoard.title,
      pictograms: pictograms !== undefined ? pictograms : existingBoard.pictograms,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`board:${user.id}:${boardId}`, updatedBoard);

    return c.json({ board: updatedBoard });
  } catch (error) {
    console.log('Error updating board:', error);
    return c.json({ error: 'Failed to update board' }, 500);
  }
});

// Delete a board
app.delete('/make-server-8ddbeee3/boards/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const boardId = c.req.param('id');
    await kv.del(`board:${user.id}:${boardId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting board:', error);
    return c.json({ error: 'Failed to delete board' }, 500);
  }
});

// Search ARASAAC pictograms
app.get('/make-server-8ddbeee3/pictograms/search', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const query = c.req.query('q');
    let language = c.req.query('lang') || 'en'; // Default to English
    
    if (!query) {
      return c.json({ pictograms: [] });
    }

    // Normalize Portuguese language code - ARASAAC uses 'pt' for Portuguese
    if (language === 'pt-PT' || language === 'pt-BR') {
      language = 'pt';
    }

    // Function to attempt search with retry logic
    const searchWithRetry = async (searchLang: string, retryCount = 0): Promise<any> => {
      const maxRetries = 2;
      
      try {
        console.log(`Searching ARASAAC for "${query}" in language "${searchLang}" (attempt ${retryCount + 1})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(
          `https://api.arasaac.org/v1/pictograms/${searchLang}/search/${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          console.log(`ARASAAC API returned status ${response.status}: ${response.statusText}`);
          
          // If language-specific search fails, try English as fallback
          if (searchLang !== 'en' && response.status === 404) {
            console.log('Attempting fallback to English search...');
            return await searchWithRetry('en', 0);
          }
          
          // Retry on server errors
          if (response.status >= 500 && retryCount < maxRetries) {
            console.log(`Retrying search (attempt ${retryCount + 2})...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            return await searchWithRetry(searchLang, retryCount + 1);
          }
          
          throw new Error(`ARASAAC API error: ${response.status} ${response.statusText}`);
        }

        const pictograms = await response.json();
        console.log(`Found ${pictograms.length} pictograms for "${query}"`);
        
        return pictograms;
      } catch (error: any) {
        console.error(`Error searching ARASAAC (attempt ${retryCount + 1}):`, error.message);
        
        // Retry on network errors
        if (retryCount < maxRetries && (error.name === 'AbortError' || error.name === 'TypeError')) {
          console.log(`Retrying search due to network error (attempt ${retryCount + 2})...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return await searchWithRetry(searchLang, retryCount + 1);
        }
        
        throw error;
      }
    };

    const pictograms = await searchWithRetry(language);

    // Transform the data to include full image URLs
    const transformedPictograms = (pictograms || []).slice(0, 30).map((p: any) => ({
      id: p._id,
      keywords: p.keywords,
      imageUrl: `https://api.arasaac.org/v1/pictograms/${p._id}`,
      tags: p.tags || []
    }));

    return c.json({ pictograms: transformedPictograms });
  } catch (error: any) {
    console.error('Error searching pictograms:', error.message || error);
    return c.json({ 
      error: 'Failed to search pictograms', 
      details: error.message || 'Unknown error',
      pictograms: [] // Return empty array as fallback
    }, 500);
  }
});

// Track pictogram usage
app.post('/make-server-8ddbeee3/pictograms/track', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get current count
    const currentCount = await kv.get(`pictogram-usage:${user.id}`) || 0;
    
    // Increment count
    const newCount = currentCount + 1;
    await kv.set(`pictogram-usage:${user.id}`, newCount);

    return c.json({ count: newCount });
  } catch (error) {
    console.log('Error tracking pictogram usage:', error);
    return c.json({ error: 'Failed to track pictogram usage' }, 500);
  }
});

// Get pictogram usage count
app.get('/make-server-8ddbeee3/pictograms/usage', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const count = await kv.get(`pictogram-usage:${user.id}`) || 0;

    return c.json({ count });
  } catch (error) {
    console.log('Error getting pictogram usage:', error);
    return c.json({ error: 'Failed to get pictogram usage' }, 500);
  }
});

// Get all tasks for a user filtered by language
app.get('/make-server-8ddbeee3/tasks', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const language = c.req.query('lang') || 'en';
    const tasks = await kv.getByPrefix(`task:${user.id}:${language}:`);
    
    // Sort by order
    const sortedTasks = (tasks || []).sort((a: any, b: any) => a.order - b.order);
    
    return c.json({ tasks: sortedTasks });
  } catch (error) {
    console.log('Error fetching tasks:', error);
    return c.json({ error: 'Failed to fetch tasks' }, 500);
  }
});

// Create a new task
app.post('/make-server-8ddbeee3/tasks', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, pictogramId, pictogramKeyword, pictogramImageUrl, language } = await c.req.json();

    if (!title) {
      return c.json({ error: 'Task title is required' }, 400);
    }

    const taskLanguage = language || 'en';

    // Get current tasks for this language to determine order
    const existingTasks = await kv.getByPrefix(`task:${user.id}:${taskLanguage}:`);
    const nextOrder = existingTasks ? existingTasks.length : 0;

    const taskId = crypto.randomUUID();
    const taskData = {
      id: taskId,
      title,
      pictogramId: pictogramId || null,
      pictogramKeyword: pictogramKeyword || '',
      pictogramImageUrl: pictogramImageUrl || '',
      completed: false,
      userId: user.id,
      language: taskLanguage,
      order: nextOrder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`task:${user.id}:${taskLanguage}:${taskId}`, taskData);

    return c.json({ task: taskData });
  } catch (error) {
    console.log('Error creating task:', error);
    return c.json({ error: 'Failed to create task' }, 500);
  }
});

// Update a task
app.put('/make-server-8ddbeee3/tasks/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('id');
    const updates = await c.req.json();

    // Get language from query parameter to find the correct task
    const language = c.req.query('lang') || 'en';
    const existingTask = await kv.get(`task:${user.id}:${language}:${taskId}`);
    
    if (!existingTask) {
      return c.json({ error: 'Task not found' }, 404);
    }

    const updatedTask = {
      ...existingTask,
      ...updates,
      id: taskId,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`task:${user.id}:${language}:${taskId}`, updatedTask);

    return c.json({ task: updatedTask });
  } catch (error) {
    console.log('Error updating task:', error);
    return c.json({ error: 'Failed to update task' }, 500);
  }
});

// Delete a task
app.delete('/make-server-8ddbeee3/tasks/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('id');
    const language = c.req.query('lang') || 'en';
    await kv.del(`task:${user.id}:${language}:${taskId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting task:', error);
    return c.json({ error: 'Failed to delete task' }, 500);
  }
});

// AI Chat endpoint using DeepSeek API
app.post('/make-server-8ddbeee3/ai/chat', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { message, language } = await c.req.json();
    
    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // OpenRouter API key (uses DeepSeek model via OpenRouter)
    const apiKey = Deno.env.get('OPENROUTER_API_KEY') || "YOUR-API-KEY";

    // System prompt for the AI assistant
    const systemPrompt = language === 'pt' 
      ? `És um assistente útil especializado em Comunicação Aumentativa e Alternativa (CAA) para crianças com Autismo e ADHD. Ajudas cuidadores e terapeutas a criar quadros de comunicação usando pictogramas ARASAAC.

Quando um utilizador pede um quadro de comunicação:
1. Identifica a rotina ou situação (ex: banho, escovar dentes, hora de dormir, refeições, etc.)
2. Cria uma lista de 6-12 passos claros e simples
3. Formata a resposta EXATAMENTE assim:

BOARD: [Título do Quadro]
STEPS:
- [palavra-chave1]
- [palavra-chave2]
- [palavra-chave3]
etc.

Exemplo:
BOARD: Rotina do Banho
STEPS:
- banho
- água
- sabonete
- champô
- lavar
- toalha
- secar
- vestir

Usa palavras simples e concretas que tenham pictogramas disponíveis no ARASAAC. Responde em português.`
      : `You are a helpful assistant specialized in Augmentative and Alternative Communication (AAC) for children with Autism and ADHD. You help caregivers and therapists create communication boards using ARASAAC pictograms.

When a user requests a communication board:
1. Identify the routine or situation (e.g., bath, brushing teeth, bedtime, mealtime, etc.)
2. Create a list of 6-12 clear, simple steps
3. Format the response EXACTLY like this:

BOARD: [Board Title]
STEPS:
- [keyword1]
- [keyword2]
- [keyword3]
etc.

Example:
BOARD: Bath Routine
STEPS:
- bath
- water
- soap
- shampoo
- wash
- towel
- dry
- clothes

Use simple, concrete words that have available pictograms in ARASAAC. Respond in English.`;

    // Call OpenRouter API (using DeepSeek model)
    const aiResponse = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://expressify.app',
          'X-Title': 'Expressify AAC App',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        })
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.log('OpenRouter API error response:', aiResponse.status, errorText);
      return c.json({ 
        error: `AI service error: ${aiResponse.status}`,
        details: errorText.substring(0, 200)
      }, 500);
    }

    const aiData = await aiResponse.json();
    console.log('OpenRouter API response:', JSON.stringify(aiData).substring(0, 500));
    
    const assistantMessage = aiData.choices?.[0]?.message?.content || 'No response';

    // Parse board if present in response
    let board = null;
    if (assistantMessage.includes('BOARD:') && assistantMessage.includes('STEPS:')) {
      const boardMatch = assistantMessage.match(/BOARD:\s*(.+?)(?:\n|$)/);
      const stepsMatch = assistantMessage.match(/STEPS:\s*([\s\S]+?)(?:\n\n|$)/);
      
      if (boardMatch && stepsMatch) {
        const title = boardMatch[1].trim();
        const stepsText = stepsMatch[1];
        const keywords = stepsText
          .split('\n')
          .map(line => line.replace(/^-\s*/, '').trim())
          .filter(k => k.length > 0);
        
        board = {
          title,
          keywords
        };
      }
    }

    return c.json({ 
      message: assistantMessage,
      board
    });
  } catch (error) {
    console.log('Error in AI chat:', error);
    console.log('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return c.json({ 
      error: 'Failed to process AI request',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Track game play
app.post('/make-server-8ddbeee3/games/play', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      console.log('Game tracking error: Unauthorized user');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { gameId, gameName, score, round } = await c.req.json();
    console.log('Tracking game play:', { gameId, gameName, score, round, userId: user.id });

    if (!gameId || !gameName) {
      console.log('Game tracking error: Missing gameId or gameName');
      return c.json({ error: 'Game ID and name are required' }, 400);
    }

    const playId = crypto.randomUUID();
    const gamePlayData = {
      id: playId,
      gameId,
      gameName,
      score: score || 0,
      round: round || 1,
      userId: user.id,
      playedAt: new Date().toISOString()
    };

    // Store the game play with timestamp-based key for easy sorting
    const key = `gameplay:${user.id}:${new Date().getTime()}:${playId}`;
    await kv.set(key, gamePlayData);
    console.log('Game play stored successfully with key:', key);

    return c.json({ gamePlay: gamePlayData });
  } catch (error) {
    console.log('Error tracking game play:', error);
    console.log('Error details:', error instanceof Error ? error.message : String(error));
    return c.json({ error: 'Failed to track game play' }, 500);
  }
});

// Get game statistics (daily and weekly)
app.get('/make-server-8ddbeee3/games/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      console.log('Game stats error: Unauthorized user');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all game plays for the user
    const allPlays = await kv.getByPrefix(`gameplay:${user.id}:`) || [];
    console.log(`Fetched ${allPlays.length} total game plays for user ${user.id}`);
    
    // Calculate daily stats (last 24 hours)
    const oneDayAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
    const dailyPlays = allPlays.filter((play: any) => 
      new Date(play.playedAt).getTime() > oneDayAgo
    );
    console.log(`Daily plays (last 24h): ${dailyPlays.length}`);

    // Calculate weekly stats (last 7 days)
    const oneWeekAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
    const weeklyPlays = allPlays.filter((play: any) => 
      new Date(play.playedAt).getTime() > oneWeekAgo
    );
    console.log(`Weekly plays (last 7 days): ${weeklyPlays.length}`);

    // Helper function to aggregate stats by game
    const aggregateStats = (plays: any[]) => {
      const gameMap = new Map();
      
      plays.forEach((play: any) => {
        if (!gameMap.has(play.gameId)) {
          gameMap.set(play.gameId, {
            gameId: play.gameId,
            gameName: play.gameName,
            totalPlays: 0,
            totalScore: 0,
            highestScore: 0,
            lastPlayedAt: play.playedAt
          });
        }
        
        const stats = gameMap.get(play.gameId);
        stats.totalPlays++;
        stats.totalScore += play.score || 0;
        stats.highestScore = Math.max(stats.highestScore, play.score || 0);
        
        // Update last played if this is more recent
        if (new Date(play.playedAt) > new Date(stats.lastPlayedAt)) {
          stats.lastPlayedAt = play.playedAt;
        }
      });

      return Array.from(gameMap.values()).map(stats => ({
        gameId: stats.gameId,
        gameName: stats.gameName,
        totalPlays: stats.totalPlays,
        averageScore: stats.totalPlays > 0 ? Math.round(stats.totalScore / stats.totalPlays) : 0,
        highestScore: stats.highestScore,
        lastPlayedAt: stats.lastPlayedAt
      }));
    };

    const dailyStats = aggregateStats(dailyPlays);
    const weeklyStats = aggregateStats(weeklyPlays);

    return c.json({ 
      daily: dailyStats,
      weekly: weeklyStats
    });
  } catch (error) {
    console.log('Error fetching game stats:', error);
    return c.json({ error: 'Failed to fetch game stats' }, 500);
  }
});

// Track activity
app.post('/make-server-8ddbeee3/activities', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      console.log('Activity tracking error: Unauthorized user');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { type, description, metadata } = await c.req.json();
    console.log('Tracking activity:', { type, description, metadata, userId: user.id });

    if (!type || !description) {
      console.log('Activity tracking error: Missing type or description');
      return c.json({ error: 'Type and description are required' }, 400);
    }

    const activityId = crypto.randomUUID();
    const activityData = {
      id: activityId,
      type,
      description,
      metadata: metadata || {},
      userId: user.id,
      timestamp: new Date().toISOString()
    };

    // Store activity with timestamp-based key for easy sorting
    const key = `activity:${user.id}:${new Date().getTime()}:${activityId}`;
    await kv.set(key, activityData);
    console.log('Activity stored successfully with key:', key);

    return c.json({ activity: activityData });
  } catch (error) {
    console.log('Error tracking activity:', error);
    console.log('Error details:', error instanceof Error ? error.message : String(error));
    return c.json({ error: 'Failed to track activity' }, 500);
  }
});

// Get recent activities (last 50)
app.get('/make-server-8ddbeee3/activities', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      console.log('Activity fetch error: Unauthorized user');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all activities for the user
    const allActivities = await kv.getByPrefix(`activity:${user.id}:`) || [];
    console.log(`Fetched ${allActivities.length} total activities for user ${user.id}`);
    
    // Sort by timestamp descending (most recent first) and take top 50
    const sortedActivities = allActivities
      .sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 50);

    return c.json({ activities: sortedActivities });
  } catch (error) {
    console.log('Error fetching activities:', error);
    return c.json({ error: 'Failed to fetch activities' }, 500);
  }
});

Deno.serve(app.fetch);
