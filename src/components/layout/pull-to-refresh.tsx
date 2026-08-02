"use client";

import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: React.ReactNode;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const pullDistanceRef = useRef(0);

  const PULL_THRESHOLD = 55; // Threshold in px

  const triggerRefresh = async () => {
    if (isRefreshing || isDone) return;
    setIsRefreshing(true);
    setIsDone(false);
    setPullDistance(48);

    try {
      await queryClient.invalidateQueries();
      setIsDone(true);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setIsDone(false);
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }, 800);
    }
  };

  const handleStart = (y: number) => {
    const container = containerRef.current;
    if (!container) return;
    if (container.scrollTop <= 0) {
      isDraggingRef.current = true;
      startYRef.current = y;
    } else {
      isDraggingRef.current = false;
    }
  };

  const handleMove = (y: number) => {
    if (!isDraggingRef.current || isRefreshing || isDone) return;
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      isDraggingRef.current = false;
      setPullDistance(0);
      pullDistanceRef.current = 0;
      return;
    }

    const diff = y - startYRef.current;
    if (diff > 0) {
      const distance = Math.min(diff * 0.45, 90);
      setPullDistance(distance);
      pullDistanceRef.current = distance;
    } else {
      setPullDistance(0);
      pullDistanceRef.current = 0;
    }
  };

  const handleEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (pullDistanceRef.current >= PULL_THRESHOLD && !isRefreshing && !isDone) {
      triggerRefresh();
    } else {
      setPullDistance(0);
      pullDistanceRef.current = 0;
    }
  };

  return (
    <main
      ref={containerRef}
      onTouchStart={(e) => handleStart(e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientY)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => {
        if (e.button === 0) handleStart(e.clientY);
      }}
      onMouseMove={(e) => {
        if (isDraggingRef.current) handleMove(e.clientY);
      }}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 lg:pb-6 relative"
    >
      {/* Indicator Pill */}
      <div
        className={cn(
          "w-full flex items-center justify-center overflow-hidden transition-all duration-200 ease-out",
          isRefreshing || isDone ? "h-12 opacity-100" : pullDistance > 0 ? "opacity-100" : "opacity-0 h-0"
        )}
        style={{
          height: isRefreshing || isDone ? "48px" : `${pullDistance}px`,
        }}
      >
        <button
          type="button"
          onClick={triggerRefresh}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card shadow-md border border-border text-xs font-semibold text-foreground mb-2 cursor-pointer hover:bg-muted transition-colors"
        >
          {isDone ? (
            <>
              <Check className="w-4 h-4 text-green-500 stroke-[3]" />
              <span className="text-green-600 dark:text-green-400">Data refreshed!</span>
            </>
          ) : isRefreshing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Refreshing data...</span>
            </>
          ) : (
            <>
              <ArrowDown
                className={cn(
                  "w-4 h-4 text-primary transition-transform duration-200",
                  pullDistance >= PULL_THRESHOLD && "rotate-180 text-green-500"
                )}
              />
              <span>
                {pullDistance >= PULL_THRESHOLD
                  ? "Release to refresh"
                  : "Pull down to refresh"}
              </span>
            </>
          )}
        </button>
      </div>

      <div className="max-w-7xl mx-auto">{children}</div>
    </main>
  );
}
