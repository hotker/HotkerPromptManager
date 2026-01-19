import { useState, useEffect, useCallback } from 'react';

/**
 * 响应式媒体查询 Hook
 * @param query - CSS 媒体查询字符串，例如 '(max-width: 767px)'
 * @returns 当前是否匹配该媒体查询
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // SSR 安全：服务端返回 false
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 使用新 API，兼容旧浏览器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}

// 预设断点常量
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * 移动端检测 Hook
 * @returns 当前是否为移动端视口 (< 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
}

/**
 * 平板端检测 Hook
 * @returns 当前是否为平板端视口 (768px - 1023px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`);
}

/**
 * 桌面端检测 Hook
 * @returns 当前是否为桌面端视口 (>= 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}

/**
 * 获取当前断点名称
 */
export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}
