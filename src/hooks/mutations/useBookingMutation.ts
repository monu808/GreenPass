'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getDbService } from '@/lib/databaseService';
import { Database } from '@/types/database';
import { queryKeys } from '@/lib/queryClient';
import { generateOptimisticId } from '@/lib/optimisticUpdates';
import { useToast } from '@/components/providers/ToastProvider';
import { Tourist } from '@/types';

type TouristInsert = Database['public']['Tables']['tourists']['Insert'];
type TouristRow = Database['public']['Tables']['tourists']['Row'];

interface BookingMutationContext {
    previousTourists: Tourist[] | undefined;
    optimisticId: string;
    pendingToastId: string;
}

export interface UseBookingMutationOptions {
    onSuccess?: (data: TouristRow) => void;
    onError?: (error: Error) => void;
}

// Helper to create a pending tourist for optimistic update
function createPendingTourist(variables: TouristInsert, optimisticId: string): Tourist & { _isPending: boolean } {
    return {
        id: optimisticId,
        name: variables.name,
        email: variables.email,
        phone: variables.phone,
        idProof: variables.id_proof,
        nationality: variables.nationality,
        groupSize: variables.group_size,
        destination: variables.destination_id,
        checkInDate: new Date(variables.check_in_date),
        checkOutDate: new Date(variables.check_out_date),
        status: 'pending',
        emergencyContact: {
            name: variables.emergency_contact_name,
            phone: variables.emergency_contact_phone,
            relationship: variables.emergency_contact_relationship,
        },
        registrationDate: new Date(),
        carbonFootprint: variables.carbon_footprint ?? undefined,
        _isPending: true,
    };
}

export function useBookingMutation(options?: UseBookingMutationOptions) {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<TouristRow, Error, TouristInsert, BookingMutationContext>({
        mutationFn: async (bookingData: TouristInsert): Promise<TouristRow> => {
            const dbService = getDbService();
            const result = await dbService.addTourist(bookingData);
            if (!result) {
                throw new Error('Booking rejected by server');
            }
            return result;
        },

        onMutate: async (variables: TouristInsert): Promise<BookingMutationContext> => {
            // Show pending toast
            const pendingToastId = toast.pending('Submitting booking...', 'Please wait while we process your request.');

            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.tourists });

            // Snapshot the previous value
            const previousTourists = queryClient.getQueryData<Tourist[]>(queryKeys.tourists);

            // Generate optimistic ID
            const optimisticId = generateOptimisticId();

            // Create optimistic tourist entry
            const pendingTourist = createPendingTourist(variables, optimisticId);

            // Add pending item to cache
            queryClient.setQueryData<Tourist[]>(queryKeys.tourists, (old: Tourist[] | undefined = []) => [
                pendingTourist,
                ...old,
            ]);

            return { previousTourists, optimisticId, pendingToastId };
        },

        onError: (error: Error, _variables: TouristInsert, context: BookingMutationContext | undefined): void => {
            // Dismiss pending toast
            if (context?.pendingToastId) {
                toast.dismissToast(context.pendingToastId);
            }

            // Show error toast
            toast.error('Booking failed', error.message || 'Please try again.');

            // Rollback on error
            if (context?.previousTourists !== undefined) {
                queryClient.setQueryData(queryKeys.tourists, context.previousTourists);
            } else if (context?.optimisticId) {
                // Remove only the optimistic item
                queryClient.setQueryData<Tourist[]>(queryKeys.tourists, (old: Tourist[] | undefined = []) =>
                    old.filter((t: Tourist) => t.id !== context.optimisticId)
                );
            }

            options?.onError?.(error);
        },

        onSuccess: (data: TouristRow, _variables: TouristInsert, context: BookingMutationContext): void => {
            // Dismiss pending toast
            if (context?.pendingToastId) {
                toast.dismissToast(context.pendingToastId);
            }

            // Show success toast
            toast.success('Booking submitted!', 'Your booking is pending approval.');

            // Replace the optimistic item with the real one
            if (context?.optimisticId) {
                queryClient.setQueryData<Tourist[]>(queryKeys.tourists, (old: Tourist[] | undefined = []) => {
                    // Transform DB row to Tourist type
                    const dbService = getDbService();
                    const realTourist = dbService.transformDbTouristToTourist(data);
                    return old.map((t: Tourist) => t.id === context.optimisticId ? realTourist : t);
                });
            }

            options?.onSuccess?.(data);
        },

        onSettled: (): void => {
            // Always refetch after error or success to ensure sync with server
            queryClient.invalidateQueries({ queryKey: queryKeys.tourists });
            // Also invalidate destinations as occupancy may have changed
            queryClient.invalidateQueries({ queryKey: queryKeys.destinations });
        },
    });
}
