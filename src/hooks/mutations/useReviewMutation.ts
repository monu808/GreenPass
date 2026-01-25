'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/components/providers/ToastProvider';
import { generateOptimisticId } from '@/lib/optimisticUpdates';

// Type definitions for reviews
interface Review {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    destination: string;
    rating: number;
    title: string;
    content: string;
    date: string;
    helpful: number;
    photos: string[];
    verified: boolean;
    tags: string[];
    tripType: string;
    likes: number;
    isLiked: boolean;
}

interface SubmitReviewVariables {
    destination: string;
    rating: number;
    title: string;
    content: string;
    photos?: string[];
    tags?: string[];
    tripType: string;
    userId: string;
    userName: string;
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
    currentlyLiked: boolean;
}

/**
 * Mutation hook for submitting reviews with optimistic updates
 */
export function useSubmitReviewMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<Review, Error, SubmitReviewVariables, ReviewMutationContext>({
        mutationFn: async (variables: SubmitReviewVariables): Promise<Review> => {
            // TODO: Replace with actual database call when reviews table exists
            await new Promise(resolve => setTimeout(resolve, 1000));

            const newReview: Review = {
                id: `review-${Date.now()}`,
                userId: variables.userId,
                userName: variables.userName,
                userAvatar: '/api/placeholder/40/40',
                destination: variables.destination,
                rating: variables.rating,
                title: variables.title,
                content: variables.content,
                date: new Date().toISOString().split('T')[0],
                helpful: 0,
                photos: variables.photos || [],
                verified: true,
                tags: variables.tags || [],
                tripType: variables.tripType,
                likes: 0,
                isLiked: false,
            };

            return newReview;
        },

        onMutate: async (variables: SubmitReviewVariables): Promise<ReviewMutationContext> => {
            const pendingToastId = toast.pending('Submitting review...', 'Your review is being processed.');

            await queryClient.cancelQueries({ queryKey: queryKeys.reviews });

            const previousReviews = queryClient.getQueryData<Review[]>(queryKeys.reviews);
            const optimisticId = generateOptimisticId();

            const optimisticReview: Review & { _isPending: boolean } = {
                id: optimisticId,
                userId: variables.userId,
                userName: variables.userName,
                userAvatar: '/api/placeholder/40/40',
                destination: variables.destination,
                rating: variables.rating,
                title: variables.title,
                content: variables.content,
                date: new Date().toISOString().split('T')[0],
                helpful: 0,
                photos: variables.photos || [],
                verified: false,
                tags: variables.tags || [],
                tripType: variables.tripType,
                likes: 0,
                isLiked: false,
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

    return useMutation<void, Error, LikeReviewVariables, LikeMutationContext>({
        mutationFn: async (_variables: LikeReviewVariables): Promise<void> => {
            // TODO: Replace with actual database call
            await new Promise(resolve => setTimeout(resolve, 200));
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
                        }
                        : review
                )
            );

            return { previousReviews };
        },

        onError: (_error: Error, _variables: LikeReviewVariables, context: LikeMutationContext | undefined): void => {
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

    return useMutation<void, Error, string, LikeMutationContext>({
        mutationFn: async (_reviewId: string): Promise<void> => {
            // TODO: Replace with actual database call
            await new Promise(resolve => setTimeout(resolve, 200));
        },

        onMutate: async (reviewId: string): Promise<LikeMutationContext> => {
            await queryClient.cancelQueries({ queryKey: queryKeys.reviews });

            const previousReviews = queryClient.getQueryData<Review[]>(queryKeys.reviews);

            queryClient.setQueryData<Review[]>(queryKeys.reviews, (old: Review[] | undefined = []) =>
                old.map((review: Review) =>
                    review.id === reviewId
                        ? { ...review, helpful: review.helpful + 1 }
                        : review
                )
            );

            return { previousReviews };
        },

        onError: (_error: Error, _variables: string, context: LikeMutationContext | undefined): void => {
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
