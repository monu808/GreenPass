'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/components/providers/ToastProvider';

// Type definitions for favorites
interface FavoriteDestination {
    id: string;
    name: string;
    location: string;
    image: string;
    rating: number;
    visitedDate?: string;
    notes?: string;
    isBucketList: boolean;
}

interface FavoriteActivity {
    id: string;
    name: string;
    destination: string;
    type: string;
    duration: string;
    difficulty: string;
    notes?: string;
}

type Favorite = FavoriteDestination | FavoriteActivity;
type FavoriteType = 'destination' | 'activity';

interface AddFavoriteVariables {
    item: Favorite;
    type: FavoriteType;
    userId: string;
}

interface RemoveFavoriteVariables {
    id: string;
    type: FavoriteType;
    userId: string;
}

interface FavoriteContext {
    previousFavorites: Favorite[] | undefined;
}

/**
 * Mutation hook for adding to favorites with optimistic updates
 */
export function useAddFavoriteMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<Favorite, Error, AddFavoriteVariables, FavoriteContext>({
        mutationFn: async (variables: AddFavoriteVariables): Promise<Favorite> => {
            // TODO: Replace with actual database call when favorites table exists
            await new Promise(resolve => setTimeout(resolve, 500));
            return variables.item;
        },

        onMutate: async (variables: AddFavoriteVariables): Promise<FavoriteContext> => {
            const queryKey = queryKeys.favorites(variables.userId);
            await queryClient.cancelQueries({ queryKey });

            const previousFavorites = queryClient.getQueryData<Favorite[]>(queryKey);

            queryClient.setQueryData<Favorite[]>(queryKey, (old: Favorite[] | undefined = []) => [
                variables.item, // Add without _isPending for type safety - pending state tracked by mutation
                ...old,
            ]);

            return { previousFavorites };
        },

        onError: (error: Error, variables: AddFavoriteVariables, context: FavoriteContext | undefined): void => {
            toast.error('Failed to add favorite', error.message || 'Please try again.');

            if (context?.previousFavorites) {
                queryClient.setQueryData(queryKeys.favorites(variables.userId), context.previousFavorites);
            }
        },

        onSuccess: (_data: Favorite, variables: AddFavoriteVariables): void => {
            toast.success('Added to favorites!', `${variables.item.name || 'Item'} is now in your favorites.`);
        },

        onSettled: (_data: Favorite | undefined, _error: Error | null, variables: AddFavoriteVariables | undefined): void => {
            if (variables) {
                queryClient.invalidateQueries({ queryKey: queryKeys.favorites(variables.userId) });
            }
        },
    });
}

/**
 * Mutation hook for removing from favorites with optimistic updates
 */
export function useRemoveFavoriteMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<void, Error, RemoveFavoriteVariables, FavoriteContext>({
        mutationFn: async (_variables: RemoveFavoriteVariables): Promise<void> => {
            // TODO: Replace with actual database call when favorites table exists
            await new Promise(resolve => setTimeout(resolve, 300));
        },

        onMutate: async (variables: RemoveFavoriteVariables): Promise<FavoriteContext> => {
            const queryKey = queryKeys.favorites(variables.userId);
            await queryClient.cancelQueries({ queryKey });

            const previousFavorites = queryClient.getQueryData<Favorite[]>(queryKey);

            queryClient.setQueryData<Favorite[]>(queryKey, (old: Favorite[] | undefined = []) =>
                old.filter((item: Favorite) => item.id !== variables.id)
            );

            return { previousFavorites };
        },

        onError: (error: Error, variables: RemoveFavoriteVariables, context: FavoriteContext | undefined): void => {
            toast.error('Failed to remove', error.message || 'Please try again.');

            if (context?.previousFavorites) {
                queryClient.setQueryData(queryKeys.favorites(variables.userId), context.previousFavorites);
            }
        },

        onSuccess: (): void => {
            toast.success('Removed from favorites');
        },

        onSettled: (_data: void | undefined, _error: Error | null, variables: RemoveFavoriteVariables | undefined): void => {
            if (variables) {
                queryClient.invalidateQueries({ queryKey: queryKeys.favorites(variables.userId) });
            }
        },
    });
}

/**
 * Mutation hook for toggling favorites
 */
export function useToggleFavoriteMutation() {
    const addMutation = useAddFavoriteMutation();
    const removeMutation = useRemoveFavoriteMutation();

    return {
        ...addMutation,
        toggle: (item: Favorite, type: FavoriteType, userId: string, isCurrentlyFavorite: boolean) => {
            if (isCurrentlyFavorite) {
                return removeMutation.mutate({ id: item.id, type, userId });
            } else {
                return addMutation.mutate({ item, type, userId });
            }
        },
        isPending: addMutation.isPending || removeMutation.isPending,
    };
}
