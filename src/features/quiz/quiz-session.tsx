import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';

import type { Question } from '@/data/questions';

import { loadQuizHistory, saveQuizHistory } from './session-storage';

export type QuizHistoryEntry = {
  id: string;
  createdAt: string;
  completedAt?: string;
  selectedCategories: string[];
  questions: Question[];
  currentPosition: number;
};

type SessionState = {
  isHydrated: boolean;
  history: QuizHistoryEntry[];
  shouldPersist: boolean;
};

type SessionAction =
  | { type: 'hydrate'; history: QuizHistoryEntry[] }
  | { type: 'start'; session: QuizHistoryEntry }
  | { type: 'position'; sessionId: string; position: number }
  | { type: 'complete'; sessionId: string; completedAt: string };

function reducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'hydrate':
      return { isHydrated: true, history: action.history, shouldPersist: false };
    case 'start':
      return { ...state, history: [...state.history, action.session], shouldPersist: true };
    case 'position': {
      const index = state.history.findIndex(({ id }) => id === action.sessionId);
      if (index < 0 || action.position < 0 || action.position >= state.history[index].questions.length) {
        return state;
      }

      const history = [...state.history];
      history[index] = { ...history[index], currentPosition: action.position };
      return { ...state, history, shouldPersist: true };
    }
    case 'complete': {
      const index = state.history.findIndex(({ id }) => id === action.sessionId);
      if (index < 0) return state;

      const history = [...state.history];
      history[index] = { ...history[index], completedAt: action.completedAt };
      return { ...state, history, shouldPersist: true };
    }
  }
}

type QuizSessionContextValue = Pick<SessionState, 'isHydrated' | 'history'> & {
  session: QuizHistoryEntry | null;
  persistenceError: boolean;
  startSession: (categories: string[], questions: Question[]) => string;
  setPosition: (sessionId: string, position: number) => void;
  completeSession: (sessionId: string) => void;
};

const QuizSessionContext = createContext<QuizSessionContextValue | null>(null);

const initialState: SessionState = { isHydrated: false, history: [], shouldPersist: false };

function createSessionId(timestamp: number) {
  return timestamp.toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

export function QuizSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [persistenceError, setPersistenceError] = useState(false);
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());
  const hasLoadedHistory = useRef(false);

  useEffect(() => {
    let isMounted = true;

    loadQuizHistory()
      .then((history) => {
        if (isMounted) {
          hasLoadedHistory.current = true;
          dispatch({ type: 'hydrate', history });
        }
      })
      .catch(() => {
        if (isMounted) {
          setPersistenceError(true);
          dispatch({ type: 'hydrate', history: [] });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedHistory.current || !state.isHydrated || !state.shouldPersist) return;

    const pending = persistenceQueue.current
      .catch(() => {})
      .then(() => saveQuizHistory(state.history));
    persistenceQueue.current = pending;

    pending.then(
      () => setPersistenceError(false),
      () => setPersistenceError(true),
    );
  }, [state.history, state.isHydrated, state.shouldPersist]);

  const startSession = useCallback((categories: string[], questions: Question[]) => {
    const now = new Date();
    const session: QuizHistoryEntry = {
      id: createSessionId(now.getTime()),
      createdAt: now.toISOString(),
      selectedCategories: [...categories],
      questions,
      currentPosition: 0,
    };
    dispatch({ type: 'start', session });
    return session.id;
  }, []);

  const setPosition = useCallback((sessionId: string, position: number) => {
    dispatch({ type: 'position', sessionId, position });
  }, []);

  const completeSession = useCallback((sessionId: string) => {
    dispatch({ type: 'complete', sessionId, completedAt: new Date().toISOString() });
  }, []);

  const session = state.history[state.history.length - 1] ?? null;

  return (
    <QuizSessionContext.Provider
      value={{
        isHydrated: state.isHydrated,
        history: state.history,
        session,
        persistenceError,
        startSession,
        setPosition,
        completeSession,
      }}
    >
      {children}
    </QuizSessionContext.Provider>
  );
}

export function useQuizSession() {
  const context = useContext(QuizSessionContext);
  if (!context) throw new Error('useQuizSession must be used within QuizSessionProvider');
  return context;
}
