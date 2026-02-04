'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/components/providers/ToastProvider';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

// Type definitions from database schema
type DbFavorite = Database['public']['Tables']['favorites']['Row'];
type DbFavoriteInsert = Database['public']['Tables']['favorites']['Insert'];

// Helper to bypass 'never' inference for tables not yet in generated schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// Type for item type distinction
type FavoriteType = 'destination' | 'activity';

// Extended favorite type with additional display info
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

interface AddFavoriteVariables {
    item: Favorite;
    type: FavoriteType;
    userId: string;
    notes?: string;
    isBucketList?: boolean;
}

interface RemoveFavoriteVariables {
    id: string;
    type: FavoriteType;
    userId: string;
}

interface FavoriteContext {
    previousFavorites: DbFavorite[] | undefined;
}

/**
 * Mutation hook for adding to favorites with optimistic updates
 */
export function useAddFavoriteMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<DbFavorite, Error, AddFavoriteVariables, FavoriteContext>({
        mutationFn: async (variables: AddFavoriteVariables): Promise<DbFavorite> => {
            if (!supabase) {
                throw new Error('Database connection unavailable');
            }

            const favoriteData: DbFavoriteInsert = {
                user_id: variables.userId,
                item_type: variables.type,
                item_id: variables.item.id,
                notes: variables.notes || null,
                is_bucket_list: variables.isBucketList || false,
                visited_date: 'visitedDate' in variables.item ? variables.item.visitedDate || null : null,
            };

            const { data, error } = await db
                .from('favorites')
                .insert(favoriteData)
                .select()
                .single();

            if (error) {
                // Check for unique constraint violation
                if (error.code === '23505') {
                    throw new Error('This item is already in your favorites');
                }
                throw new Error(error.message || 'Failed to add to favorites');
            }

            if (!data) {
                throw new Error('No data returned from favorites');
            }

            return data;
        },

        onMutate: async (variables: AddFavoriteVariables): Promise<FavoriteContext> => {
            const queryKey = queryKeys.favorites(variables.userId);
            await queryClient.cancelQueries({ queryKey });

            const previousFavorites = queryClient.getQueryData<DbFavorite[]>(queryKey);

            // Create optimistic favorite entry
            const optimisticFavorite: DbFavorite = {
                id: `temp-${Date.now()}`,
                user_id: variables.userId,
                item_type: variables.type,
                item_id: variables.item.id,
                notes: variables.notes || null,
                is_bucket_list: variables.isBucketList || false,
                visited_date: 'visitedDate' in variables.item ? variables.item.visitedDate || null : null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            queryClient.setQueryData<DbFavorite[]>(queryKey, (old: DbFavorite[] | undefined = []) => [
                optimisticFavorite,
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

        onSuccess: (_data: DbFavorite, variables: AddFavoriteVariables): void => {
            toast.success('Added to favorites!', `${variables.item.name || 'Item'} is now in your favorites.`);
        },

        onSettled: (_data: DbFavorite | undefined, _error: Error | null, variables: AddFavoriteVariables | undefined): void => {
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
        mutationFn: async (variables: RemoveFavoriteVariables): Promise<void> => {
            if (!supabase) {
                throw new Error('Database connection unavailable');
            }

            // Delete by item_id and user_id (since 'id' in variables is the item's id, not favorite's id)
            const { error } = await db
                .from('favorites')
                .delete()
                .eq('item_id', variables.id)
                .eq('user_id', variables.userId)
                .eq('item_type', variables.type);

            if (error) {
                throw new Error(error.message || 'Failed to remove from favorites');
            }
        },

        onMutate: async (variables: RemoveFavoriteVariables): Promise<FavoriteContext> => {
            const queryKey = queryKeys.favorites(variables.userId);
            await queryClient.cancelQueries({ queryKey });

            const previousFavorites = queryClient.getQueryData<DbFavorite[]>(queryKey);

            queryClient.setQueryData<DbFavorite[]>(queryKey, (old: DbFavorite[] | undefined = []) =>
                old.filter((item: DbFavorite) => item.item_id !== variables.id)
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

/**
 * Mutation hook for updating favorite notes or bucket list status
 */
export function useUpdateFavoriteMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    interface UpdateFavoriteVariables {
        itemId: string;
        userId: string;
        type: FavoriteType;
        notes?: string;
        isBucketList?: boolean;
        visitedDate?: string;
    }

    return useMutation<DbFavorite, Error, UpdateFavoriteVariables, FavoriteContext>({
        mutationFn: async (variables: UpdateFavoriteVariables): Promise<DbFavorite> => {
            if (!supabase) {
                throw new Error('Database connection unavailable');
            }

            const updates: Partial<DbFavorite> = {};
            if (variables.notes !== undefined) updates.notes = variables.notes;
            if (variables.isBucketList !== undefined) updates.is_bucket_list = variables.isBucketList;
            if (variables.visitedDate !== undefined) updates.visited_date = variables.visitedDate;

            const { data, error } = await db
                .from('favorites')
                .update(updates)
                .eq('item_id', variables.itemId)
                .eq('user_id', variables.userId)
                .eq('item_type', variables.type)
                .select()
                .single();

            if (error) {
                throw new Error(error.message || 'Failed to update favorite');
            }

            if (!data) {
                throw new Error('No data returned from update');
            }

            return data;
        },

        onMutate: async (variables: UpdateFavoriteVariables): Promise<FavoriteContext> => {
            const queryKey = queryKeys.favorites(variables.userId);
            await queryClient.cancelQueries({ queryKey });

            const previousFavorites = queryClient.getQueryData<DbFavorite[]>(queryKey);

            queryClient.setQueryData<DbFavorite[]>(queryKey, (old: DbFavorite[] | undefined = []) =>
                old.map((fav: DbFavorite) => {
                    if (fav.item_id === variables.itemId && fav.item_type === variables.type) {
                        return {
                            ...fav,
                            notes: variables.notes !== undefined ? variables.notes : fav.notes,
                            is_bucket_list: variables.isBucketList !== undefined ? variables.isBucketList : fav.is_bucket_list,
                            visited_date: variables.visitedDate !== undefined ? variables.visitedDate : fav.visited_date,
                        };
                    }
                    return fav;
                })
            );

            return { previousFavorites };
        },

        onError: (error: Error, variables: UpdateFavoriteVariables, context: FavoriteContext | undefined): void => {
            toast.error('Failed to update', error.message || 'Please try again.');
            if (context?.previousFavorites) {
                queryClient.setQueryData(queryKeys.favorites(variables.userId), context.previousFavorites);
            }
        },

        onSuccess: (): void => {
            toast.success('Favorite updated');
        },

        onSettled: (_data: DbFavorite | undefined, _error: Error | null, variables: UpdateFavoriteVariables | undefined): void => {
            if (variables) {
                queryClient.invalidateQueries({ queryKey: queryKeys.favorites(variables.userId) });
            }
        },
    });
}
