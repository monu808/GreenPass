'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/components/providers/ToastProvider';
import { generateOptimisticId } from '@/lib/optimisticUpdates';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

// Type definitions from database schema
type DbReview = Database['public']['Tables']['reviews']['Row'];
type DbReviewInsert = Database['public']['Tables']['reviews']['Insert'];

// Helper to bypass 'never' inference for tables not yet in generated schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// Extended review type with user interaction status
interface Review extends DbReview {
    isLiked: boolean;
    helpful: number;
    likes: number;
    date: string;
    destination: string;
    verified: boolean;
}

interface SubmitReviewVariables {
    destination: string;
    destinationId: string;
    rating: number;
    title: string;
    content: string;
    photos?: string[];
    tags?: string[];
    tripType: 'solo' | 'couple' | 'family' | 'friends' | 'business';
    userId: string;
    userName: string;
    userAvatar?: string;
}

interface ReviewMutationContext {
    previousReviews: Review[] | undefined;
    optimisticId: string;
    pendingToastId: string;
}

interface LikeMutationContext {
    previousReviews: Review[] | undefined;
}

interface LikeReviewVariables {
    reviewId: string;
    userId: string;
    currentlyLiked: boolean;
}

interface MarkHelpfulVariables {
    reviewId: string;
    userId: string;
}

/**
 * Mutation hook for submitting reviews with optimistic updates
 */
export function useSubmitReviewMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<Review, Error, SubmitReviewVariables, ReviewMutationContext>({
        mutationFn: async (variables: SubmitReviewVariables): Promise<Review> => {
            if (!supabase) {
                throw new Error('Database connection unavailable');
            }

            const reviewData: DbReviewInsert = {
                user_id: variables.userId,
                destination_id: variables.destinationId,
                rating: variables.rating,
                title: variables.title,
                content: variables.content,
                photos: variables.photos || [],
                tags: variables.tags || [],
                trip_type: variables.tripType,
                user_name: variables.userName,
                user_avatar: variables.userAvatar || null,
            };

            const { data, error } = await db
                .from('reviews')
                .insert(reviewData)
                .select()
                .single();

            if (error) {
                throw new Error(error.message || 'Failed to submit review');
            }

            if (!data) {
                throw new Error('No data returned from review submission');
            }

            // Transform to Review type with additional fields
            return {
                ...data,
                isLiked: false,
                helpful: data.helpful_count,
                likes: data.likes_count,
                date: data.created_at.split('T')[0],
                destination: variables.destination,
                verified: data.is_verified,
            };
        },

        onMutate: async (variables: SubmitReviewVariables): Promise<ReviewMutationContext> => {
            const pendingToastId = toast.pending('Submitting review...', 'Your review is being processed.');

            await queryClient.cancelQueries({ queryKey: queryKeys.reviews });

            const previousReviews = queryClient.getQueryData<Review[]>(queryKeys.reviews);
            const optimisticId = generateOptimisticId();

            const optimisticReview: Review & { _isPending: boolean } = {
                id: optimisticId,
                user_id: variables.userId,
                destination_id: variables.destinationId,
                user_name: variables.userName,
                user_avatar: variables.userAvatar || null,
                destination: variables.destination,
                rating: variables.rating,
                title: variables.title,
                content: variables.content,
                date: new Date().toISOString().split('T')[0],
                helpful: 0,
                helpful_count: 0,
                photos: variables.photos || [],
                verified: false,
                is_verified: false,
                tags: variables.tags || [],
                trip_type: variables.tripType,
                likes: 0,
                likes_count: 0,
                isLiked: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                _isPending: true,
            };

            queryClient.setQueryData<Review[]>(queryKeys.reviews, (old: Review[] | undefined = []) => [
                optimisticReview,
                ...old,
            ]);

            return { previousReviews, optimisticId, pendingToastId };
        },

        onError: (error: Error, _variables: SubmitReviewVariables, context: ReviewMutationContext | undefined): void => {
            if (context?.pendingToastId) {
                toast.dismissToast(context.pendingToastId);
            }
            toast.error('Review submission failed', error.message || 'Please try again.');

            if (context?.previousReviews) {
                queryClient.setQueryData(queryKeys.reviews, context.previousReviews);
            } else if (context?.optimisticId) {
                queryClient.setQueryData<Review[]>(queryKeys.reviews, (old: Review[] | undefined = []) =>
                    old.filter((r: Review) => r.id !== context.optimisticId)
                );
            }
        },

        onSuccess: (data: Review, _variables: SubmitReviewVariables, context: ReviewMutationContext): void => {
            if (context?.pendingToastId) {
                toast.dismissToast(context.pendingToastId);
            }
            toast.success('Review submitted!', 'Thank you for sharing your experience.');

            if (context?.optimisticId) {
                queryClient.setQueryData<Review[]>(queryKeys.reviews, (old: Review[] | undefined = []) =>
                    old.map((r: Review) => r.id === context.optimisticId ? data : r)
                );
            }
        },

        onSettled: (): void => {
            queryClient.invalidateQueries({ queryKey: queryKeys.reviews });
        },
    });
}

/**
 * Mutation hook for liking reviews with optimistic toggle
 */
export function useLikeReviewMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<void, Error, LikeReviewVariables, LikeMutationContext>({
        mutationFn: async (variables: LikeReviewVariables): Promise<void> => {
            if (!supabase) {
                throw new Error('Database connection unavailable');
            }

            if (variables.currentlyLiked) {
                // Remove like
                const { error } = await db
                    .from('review_likes')
                    .delete()
                    .eq('review_id', variables.reviewId)
                    .eq('user_id', variables.userId);

                if (error) {
                    throw new Error(error.message || 'Failed to unlike review');
                }
            } else {
                // Add like
                const { error } = await db
                    .from('review_likes')
                    .insert({
                        review_id: variables.reviewId,
                        user_id: variables.userId,
                    });

                if (error) {
                    throw new Error(error.message || 'Failed to like review');
                }
            }
        },

        onMutate: async (variables: LikeReviewVariables): Promise<LikeMutationContext> => {
            await queryClient.cancelQueries({ queryKey: queryKeys.reviews });

            const previousReviews = queryClient.getQueryData<Review[]>(queryKeys.reviews);

            queryClient.setQueryData<Review[]>(queryKeys.reviews, (old: Review[] | undefined = []) =>
                old.map((review: Review) =>
                    review.id === variables.reviewId
                        ? {
                            ...review,
                            isLiked: !variables.currentlyLiked,
                            likes: variables.currentlyLiked ? review.likes - 1 : review.likes + 1,
                            likes_count: variables.currentlyLiked ? review.likes_count - 1 : review.likes_count + 1,
                        }
                        : review
                )
            );

            return { previousReviews };
        },

        onError: (_error: Error, _variables: LikeReviewVariables, context: LikeMutationContext | undefined): void => {
            toast.error('Failed to update like', 'Please try again.');
            if (context?.previousReviews) {
                queryClient.setQueryData(queryKeys.reviews, context.previousReviews);
            }
        },

        onSettled: (): void => {
            queryClient.invalidateQueries({ queryKey: queryKeys.reviews });
        },
    });
}

/**
 * Mutation hook for marking reviews as helpful
 */
export function useMarkHelpfulMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<void, Error, MarkHelpfulVariables, LikeMutationContext>({
        mutationFn: async (variables: MarkHelpfulVariables): Promise<void> => {
            if (!supabase) {
                throw new Error('Database connection unavailable');
            }

            // Insert helpful vote (triggers count update via database trigger)
            const { error } = await db
                .from('review_helpful')
                .insert({
                    review_id: variables.reviewId,
                    user_id: variables.userId,
                });

            if (error) {
                // Check if it's a unique constraint violation (already marked as helpful)
                if (error.code === '23505') {
                    throw new Error('You have already marked this review as helpful');
                }
                throw new Error(error.message || 'Failed to mark as helpful');
            }
        },

        onMutate: async (variables: MarkHelpfulVariables): Promise<LikeMutationContext> => {
            await queryClient.cancelQueries({ queryKey: queryKeys.reviews });

            const previousReviews = queryClient.getQueryData<Review[]>(queryKeys.reviews);

            queryClient.setQueryData<Review[]>(queryKeys.reviews, (old: Review[] | undefined = []) =>
                old.map((review: Review) =>
                    review.id === variables.reviewId
                        ? {
                            ...review,
                            helpful: review.helpful + 1,
                            helpful_count: review.helpful_count + 1,
                        }
                        : review
                )
            );

            return { previousReviews };
        },

        onError: (error: Error, _variables: MarkHelpfulVariables, context: LikeMutationContext | undefined): void => {
            toast.error('Failed to mark as helpful', error.message || 'Please try again.');
            if (context?.previousReviews) {
                queryClient.setQueryData(queryKeys.reviews, context.previousReviews);
            }
        },

        onSuccess: (): void => {
            toast.info('Marked as helpful', 'Thanks for your feedback!');
        },

        onSettled: (): void => {
            queryClient.invalidateQueries({ queryKey: queryKeys.reviews });
        },
    });
}
