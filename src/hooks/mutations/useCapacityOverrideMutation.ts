'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPolicyEngine } from '@/lib/ecologicalPolicyEngine';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/components/providers/ToastProvider';
import { DynamicCapacityResult, Destination } from '@/types';

interface CapacityOverride {
    destinationId: string;
    multiplier: number;
    reason: string;
    expiresAt: Date;
    active: boolean;
}

interface SetOverrideContext {
    previousResults: Record<string, DynamicCapacityResult> | undefined;
    pendingToastId: string;
}

interface ClearOverrideContext {
    previousResults: Record<string, DynamicCapacityResult> | undefined;
    pendingToastId: string;
}

export interface UseCapacityOverrideMutationOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

/**
 * Mutation hook for setting capacity overrides with optimistic updates
 */
export function useSetCapacityOverrideMutation(options?: UseCapacityOverrideMutationOptions) {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<void, Error, CapacityOverride, SetOverrideContext>({
        mutationFn: async (override: CapacityOverride): Promise<void> => {
            const policyEngine = getPolicyEngine();
            policyEngine.setCapacityOverride(override);
        },

        onMutate: async (variables: CapacityOverride): Promise<SetOverrideContext> => {
            const pendingToastId = toast.pending('Applying override...', `Setting capacity to ${Math.round(variables.multiplier * 100)}%`);

            await queryClient.cancelQueries({ queryKey: queryKeys.capacityResults });

            const previousResults = queryClient.getQueryData<Record<string, DynamicCapacityResult>>(queryKeys.capacityResults);

            // Optimistically update the capacity results
            if (previousResults && previousResults[variables.destinationId]) {
                const updatedResults = { ...previousResults };
                const existingResult = updatedResults[variables.destinationId];

                const destinations = queryClient.getQueryData<Destination[]>(queryKeys.destinations);
                const destination = destinations?.find((d: Destination) => d.id === variables.destinationId);

                if (destination) {
                    updatedResults[variables.destinationId] = {
                        ...existingResult,
                        adjustedCapacity: Math.floor(destination.maxCapacity * variables.multiplier),
                        availableSpots: Math.max(0, Math.floor(destination.maxCapacity * variables.multiplier) - destination.currentOccupancy),
                        activeFactors: [...existingResult.activeFactors, 'Admin Override'],
                        activeFactorFlags: {
                            ...existingResult.activeFactorFlags,
                            override: true,
                        },
                        factors: {
                            ...existingResult.factors,
                            combinedMultiplier: variables.multiplier,
                        },
                    };
                }

                queryClient.setQueryData(queryKeys.capacityResults, updatedResults);
            }

            return { previousResults, pendingToastId };
        },

        onError: (error: Error, _variables: CapacityOverride, context: SetOverrideContext | undefined): void => {
            if (context?.pendingToastId) {
                toast.dismissToast(context.pendingToastId);
            }
            toast.error('Override failed', error.message || 'Could not apply capacity override.');

            if (context?.previousResults) {
                queryClient.setQueryData(queryKeys.capacityResults, context.previousResults);
            }

            options?.onError?.(error);
        },

        onSuccess: (_data: void, _variables: CapacityOverride, context: SetOverrideContext): void => {
            if (context?.pendingToastId) {
                toast.dismissToast(context.pendingToastId);
            }
            toast.success('Override applied', 'Capacity override is now active.');
            options?.onSuccess?.();
        },

        onSettled: (): void => {
            queryClient.invalidateQueries({ queryKey: queryKeys.capacityResults });
            queryClient.invalidateQueries({ queryKey: queryKeys.destinations });
        },
    });
}

/**
 * Mutation hook for clearing capacity overrides with optimistic updates
 */
export function useClearCapacityOverrideMutation(options?: UseCapacityOverrideMutationOptions) {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<void, Error, string, ClearOverrideContext>({
        mutationFn: async (destinationId: string): Promise<void> => {
            const policyEngine = getPolicyEngine();
            policyEngine.clearCapacityOverride(destinationId);
        },

        onMutate: async (destinationId: string): Promise<ClearOverrideContext> => {
            const pendingToastId = toast.pending('Clearing override...', 'Restoring default capacity rules.');

            await queryClient.cancelQueries({ queryKey: queryKeys.capacityResults });

            const previousResults = queryClient.getQueryData<Record<string, DynamicCapacityResult>>(queryKeys.capacityResults);

            if (previousResults && previousResults[destinationId]) {
                const updatedResults = { ...previousResults };
                const existingResult = updatedResults[destinationId];

                updatedResults[destinationId] = {
                    ...existingResult,
                    activeFactors: existingResult.activeFactors.filter((f: string) => f !== 'Admin Override'),
                    activeFactorFlags: {
                        ...existingResult.activeFactorFlags,
                        override: false,
                    },
                };

                queryClient.setQueryData(queryKeys.capacityResults, updatedResults);
            }

            return { previousResults, pendingToastId };
        },

        onError: (error: Error, _variables: string, context: ClearOverrideContext | undefined): void => {
            if (context?.pendingToastId) {
                toast.dismissToast(context.pendingToastId);
            }
            toast.error('Failed to clear override', error.message || 'Please try again.');

            if (context?.previousResults) {
                queryClient.setQueryData(queryKeys.capacityResults, context.previousResults);
            }

            options?.onError?.(error);
        },

        onSuccess: (_data: void, _variables: string, context: ClearOverrideContext): void => {
            if (context?.pendingToastId) {
                toast.dismissToast(context.pendingToastId);
            }
            toast.success('Override cleared', 'Default capacity rules restored.');
            options?.onSuccess?.();
        },

        onSettled: (): void => {
            queryClient.invalidateQueries({ queryKey: queryKeys.capacityResults });
            queryClient.invalidateQueries({ queryKey: queryKeys.destinations });
        },
    });
}
