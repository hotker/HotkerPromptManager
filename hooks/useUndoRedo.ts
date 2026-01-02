import { useState, useCallback, useRef } from 'react';

interface UseUndoRedoOptions {
  maxHistory?: number;
}

interface UseUndoRedoReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

/**
 * 通用撤销/重做 Hook
 * @param initialState 初始状态
 * @param options 配置选项
 * @returns 带有撤销/重做能力的状态管理对象
 */
export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions = {}
): UseUndoRedoReturn<T> {
  const { maxHistory = 20 } = options;

  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // 用于跳过初始同步的标记
  const isInitialized = useRef(false);

  const setState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      setHistory((prev) => {
        const resolvedState =
          typeof newState === 'function'
            ? (newState as (prev: T) => T)(prev.present)
            : newState;

        // 如果状态没有变化，不添加到历史
        if (JSON.stringify(resolvedState) === JSON.stringify(prev.present)) {
          return prev;
        }

        const newPast = [...prev.past, prev.present];
        // 限制历史记录数量
        if (newPast.length > maxHistory) {
          newPast.shift();
        }

        return {
          past: newPast,
          present: resolvedState,
          future: [], // 新操作清空重做栈
        };
      });
    },
    [maxHistory]
  );

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = prev.past.slice(0, -1);
      const newPresent = prev.past[prev.past.length - 1];
      const newFuture = [prev.present, ...prev.future];

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const newFuture = prev.future.slice(1);
      const newPresent = prev.future[0];
      const newPast = [...prev.past, prev.present];

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory((prev) => ({
      past: [],
      present: prev.present,
      future: [],
    }));
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clearHistory,
  };
}

/**
 * 外部状态同步版本的撤销/重做 Hook
 * 用于与已有的 useState 集成
 */
export function useUndoRedoWithExternalState<T>(
  externalState: T,
  setExternalState: (state: T) => void,
  options: UseUndoRedoOptions = {}
): Omit<UseUndoRedoReturn<T>, 'state' | 'setState'> & { recordChange: (state: T) => void } {
  const { maxHistory = 20 } = options;

  const [history, setHistory] = useState<{ past: T[]; future: T[] }>({
    past: [],
    future: [],
  });

  const lastStateRef = useRef<T>(externalState);

  // 记录状态变化到历史
  const recordChange = useCallback(
    (newState: T) => {
      const oldState = lastStateRef.current;
      if (JSON.stringify(newState) === JSON.stringify(oldState)) {
        return;
      }

      setHistory((prev) => {
        const newPast = [...prev.past, oldState];
        if (newPast.length > maxHistory) {
          newPast.shift();
        }
        return {
          past: newPast,
          future: [],
        };
      });

      lastStateRef.current = newState;
    },
    [maxHistory]
  );

  const undo = useCallback(() => {
    if (history.past.length === 0) return;

    const newPast = history.past.slice(0, -1);
    const previousState = history.past[history.past.length - 1];
    const newFuture = [externalState, ...history.future];

    setHistory({
      past: newPast,
      future: newFuture,
    });

    lastStateRef.current = previousState;
    setExternalState(previousState);
  }, [history, externalState, setExternalState]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;

    const newFuture = history.future.slice(1);
    const nextState = history.future[0];
    const newPast = [...history.past, externalState];

    setHistory({
      past: newPast,
      future: newFuture,
    });

    lastStateRef.current = nextState;
    setExternalState(nextState);
  }, [history, externalState, setExternalState]);

  const clearHistory = useCallback(() => {
    setHistory({ past: [], future: [] });
    lastStateRef.current = externalState;
  }, [externalState]);

  return {
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clearHistory,
    recordChange,
  };
}
