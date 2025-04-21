import { sacrificeSchema } from '@/types';

/**
 * Represents the result of a sacrifice data query operation
 */
export interface SacrificeQueryResult {
    data: sacrificeSchema[] | undefined;
    success?: boolean;
    error?: Error | null;
    count?: number;
    message?: string;
} 