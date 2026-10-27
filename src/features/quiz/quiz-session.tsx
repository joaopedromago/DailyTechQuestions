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

import { clearQuizSession, loadQuizSession, saveQuizSession } from './session-storage';

export type QuizSession = {
  selectedCategories: string[];
  questions: Question[];
  currentPosition: number;
};

type SessionState = {
  isHydrated: boolean;
  session: QuizSession | null;
  shouldPersist: boolean;
};

type SessionAction =
  | { type: 'hydrate'; session: QuizSession | null }
  | { type: 'start'; session: QuizSession }
  | { type: 'position'; position: number }
  | { type: 'complete' };

function reducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'hydrate':
      return { isHydrated: true, session: action.session, shouldPersist: false };
    case 'start':
      return { ...state, session: action.session, shouldPersist: true };
    case 'position':
      if (!state.session || action.position < 0 || action.position >= state.session.questions.length) {
        return state;
      }
      return {
        ...state,
        session: { ...state.session, currentPosition: action.position },
        shouldPersist: true,
      };
    case 'complete':
      return { ...state, session: null, shouldPersist: true };
  }
}

type QuizSessionContextValue = Pick<SessionState, 'isHydrated' | 'session'> & {
  persistenceError: boolean;
  startSession: (categories: string[], questions: Question[]) => void;
  setPosition: (position: number) => void;
  completeSession: () => void;
};

const QuizSessionContext = createContext<QuizSessionContextValue | null>(null);

const initialState: SessionState = { isHydrated: false, session: null, shouldPersist: false };

export function QuizSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [persistenceError, setPersistenceError] = useState(false);
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let isMounted = true;

    loadQuizSession()
      .then((session) => {
        if (isMounted) dispatch({ type: 'hydrate', session });
      })
      .catch(() => {
        if (isMounted) {
          setPersistenceError(true);
          dispatch({ type: 'hydrate', session: null });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.isHydrated || !state.shouldPersist) return;

    const operation = state.session
      ? () => saveQuizSession(state.session as QuizSession)
      : clearQuizSession;
    const pending = persistenceQueue.current.catch(() => {}).then(operation);
    persistenceQueue.current = pending;

    pending.then(
      () => setPersistenceError(false),
      () => setPersistenceError(true),
    );
  }, [state.isHydrated, state.session, state.shouldPersist]);

  const startSession = useCallback((categories: string[], questions: Question[]) => {
    dispatch({
      type: 'start',
      session: { selectedCategories: [...categories], questions, currentPosition: 0 },
    });
  }, []);

  const setPosition = useCallback((position: number) => {
    dispatch({ type: 'position', position });
  }, []);

  const completeSession = useCallback(() => {
    dispatch({ type: 'complete' });
  }, []);

  return (
    <QuizSessionContext.Provider
      value={{
        isHydrated: state.isHydrated,
        session: state.session,
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
