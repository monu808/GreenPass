'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * Operation status for tracking mutation states
 */
export type OperationStatus = 'idle' | 'pending' | 'success' | 'error';

/**
 * Optimistic context returned from onMutate for rollback support
 */
export interface OptimisticContext<T> {
    previousData: T | undefined;
    optimisticId?: string;
}

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'info' | 'pending';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

/**
 * Generate a temporary ID for optimistic updates
 */
export function generateOptimisticId(): string {
    return `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper to create optimistic mutation handlers
 */
export function createOptimisticHandlers<TData, TVariables, TContext extends OptimisticContext<TData>>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    options: {
        optimisticUpdate: (previousData: TData | undefined, variables: TVariables) => TData;
        onSuccessMessage?: string;
        onErrorMessage?: string;
    }
) {
    return {
        onMutate: async (variables: TVariables): Promise<TContext> => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey });

            // Snapshot the previous value
            const previousData = queryClient.getQueryData<TData>(queryKey);

            // Optimistically update to the new value
            queryClient.setQueryData<TData>(queryKey, (old: TData | undefined) =>
                options.optimisticUpdate(old, variables)
            );

            // Return a context object with the snapshotted value
            return { previousData } as TContext;
        },

        onError: (_err: Error, _variables: TVariables, context: TContext | undefined) => {
            // Rollback on error
            if (context?.previousData !== undefined) {
                queryClient.setQueryData(queryKey, context.previousData);
            }
        },

        onSettled: () => {
            // Always refetch after error or success
            queryClient.invalidateQueries({ queryKey });
        },
    };
}

/**
 * Delayed promise for simulating network latency in dev (useful for testing)
 */
export function withDelay<T>(promise: Promise<T>, delayMs: number = 0): Promise<T> {
    if (delayMs <= 0 || process.env.NODE_ENV === 'production') {
        return promise;
    }
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            promise.then(resolve, reject);
        }, delayMs);
    });
}

/**
 * Create a pending item placeholder for optimistic lists
 */
export function createPendingItem<T extends Record<string, unknown>>(
    baseItem: T,
    optimisticId: string
): T & { _isPending: boolean; _optimisticId: string } {
    return {
        ...baseItem,
        id: optimisticId,
        _isPending: true,
        _optimisticId: optimisticId,
    };
}

/**
 * Replace a pending item with the real item after successful mutation
 */
export function replacePendingItem<T extends { id: string }>(
    items: T[],
    optimisticId: string,
    realItem: T
): T[] {
    return items.map((item) =>
        item.id === optimisticId ? realItem : item
    );
}

/**
 * Remove a pending item on error
 */
export function removePendingItem<T extends { id: string }>(
    items: T[],
    optimisticId: string
): T[] {
    return items.filter((item) => item.id !== optimisticId);
}
