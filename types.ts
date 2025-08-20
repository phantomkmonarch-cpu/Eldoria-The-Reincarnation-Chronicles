export interface StoryPart {
  type: 'narrator' | 'user' | 'system';
  content: string;
  timestamp: string;
}

export interface Character {
  name: string;
  description: string;
  status: 'Alive' | 'Defeated' | 'Unknown';
  relationship: 'Friendly' | 'Neutral' | 'Hostile' | 'Ally';
  intimacy: number; // Current intimacy level
  intimacyMax: number; // Max intimacy for this character
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
}

export interface GameContext {
  saveVersion: number;
  season: number;
  chapter: number;
  chapterObjective: string;
  defeatCondition: string;
  sanityStrikes: number;
  characters: Record<string, Character>;
  playerName: string;
}

export interface ChapterRule {
    objective: string;
    defeat: string;
}

export interface GameState {
  isLoggedIn: boolean;
  isLoading: boolean;
  isProcessingAction: boolean;
  isWaitingForGM?: boolean;
  error: string | null;
  storyParts: StoryPart[];
  gameContext: GameContext | null;
  currentView: 'loading' | 'login' | 'lobby' | 'game';
}

export interface SaveData {
  saveVersion: number;
  gameContext: GameContext;
  storyParts: StoryPart[];
}

export interface PendingAction {
    action: string;
    timestamp: number;
}

export interface EldoriaDatabase {
    players: Record<string, SaveData>;
    pendingActions: Record<string, PendingAction>;
}
