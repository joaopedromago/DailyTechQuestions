import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import type { Question } from '@/data/questions';

import { getQuestionCheckKey } from './question-check-utils';
import { loadCheckedQuestionKeys, saveCheckedQuestionKeys } from './question-check-storage';

type QuestionChecksState = {
  isHydrated: boolean;
  checkedQuestionKeys: string[];
  shouldPersist: boolean;
};

type QuestionChecksAction =
  { type: 'hydrate'; checkedQuestionKeys: string[] } | { type: 'toggle'; questionKey: string };

function reducer(state: QuestionChecksState, action: QuestionChecksAction): QuestionChecksState {
  switch (action.type) {
    case 'hydrate':
      return {
        isHydrated: true,
        checkedQuestionKeys: action.checkedQuestionKeys,
        shouldPersist: false,
      };
    case 'toggle': {
      const isChecked = state.checkedQuestionKeys.includes(action.questionKey);
      return {
        ...state,
        checkedQuestionKeys: isChecked
          ? state.checkedQuestionKeys.filter((key) => key !== action.questionKey)
          : [...state.checkedQuestionKeys, action.questionKey],
        shouldPersist: true,
      };
    }
  }
}

type QuestionChecksContextValue = {
  isHydrated: boolean;
  loadError: boolean;
  persistenceError: boolean;
  checkedQuestionKeySet: ReadonlySet<string>;
  isQuestionChecked: (question: Pick<Question, 'category' | 'question'>) => boolean;
  toggleQuestion: (question: Pick<Question, 'category' | 'question'>) => void;
};

const QuestionChecksContext = createContext<QuestionChecksContextValue | null>(null);
const initialState: QuestionChecksState = {
  isHydrated: false,
  checkedQuestionKeys: [],
  shouldPersist: false,
};

export function QuestionChecksProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loadError, setLoadError] = useState(false);
  const [persistenceError, setPersistenceError] = useState(false);
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());
  const hasLoadedChecks = useRef(false);

  useEffect(() => {
    let isMounted = true;

    loadCheckedQuestionKeys()
      .then((checkedQuestionKeys) => {
        if (isMounted) {
          hasLoadedChecks.current = true;
          dispatch({ type: 'hydrate', checkedQuestionKeys });
        }
      })
      .catch(() => {
        if (isMounted) {
          hasLoadedChecks.current = true;
          setLoadError(true);
          setPersistenceError(true);
          dispatch({ type: 'hydrate', checkedQuestionKeys: [] });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedChecks.current || !state.isHydrated || !state.shouldPersist || loadError) return;

    const checkedQuestionKeys = [...state.checkedQuestionKeys];
    const pending = persistenceQueue.current
      .catch(() => {})
      .then(() => saveCheckedQuestionKeys(checkedQuestionKeys));
    persistenceQueue.current = pending;

    pending.then(
      () => setPersistenceError(false),
      () => setPersistenceError(true),
    );
  }, [loadError, state.checkedQuestionKeys, state.isHydrated, state.shouldPersist]);

  const checkedQuestionKeySet = useMemo(
    () => new Set(state.checkedQuestionKeys),
    [state.checkedQuestionKeys],
  );
  const isQuestionChecked = useCallback(
    (question: Pick<Question, 'category' | 'question'>) =>
      checkedQuestionKeySet.has(getQuestionCheckKey(question)),
    [checkedQuestionKeySet],
  );
  const toggleQuestion = useCallback(
    (question: Pick<Question, 'category' | 'question'>) => {
      if (!state.isHydrated || loadError) return;
      dispatch({ type: 'toggle', questionKey: getQuestionCheckKey(question) });
    },
    [loadError, state.isHydrated],
  );

  const value = useMemo(
    () => ({
      isHydrated: state.isHydrated,
      loadError,
      persistenceError,
      checkedQuestionKeySet,
      isQuestionChecked,
      toggleQuestion,
    }),
    [
      checkedQuestionKeySet,
      isQuestionChecked,
      loadError,
      persistenceError,
      state.isHydrated,
      toggleQuestion,
    ],
  );

  return <QuestionChecksContext.Provider value={value}>{children}</QuestionChecksContext.Provider>;
}

export function useQuestionChecks() {
  const context = useContext(QuestionChecksContext);
  if (!context) throw new Error('useQuestionChecks must be used within QuestionChecksProvider');
  return context;
}
