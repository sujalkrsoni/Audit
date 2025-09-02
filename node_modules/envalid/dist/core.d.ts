import type { CleanOptions, SpecsOutput, Spec } from './types';
export declare const testOnlySymbol: unique symbol;
export declare function formatSpecDescription<T>(spec: Spec<T>): string;
/**
 * Perform the central validation/sanitization logic on the full environment object
 */
export declare function getSanitizedEnv<S>(environment: unknown, specs: S, options?: CleanOptions<SpecsOutput<S>>): SpecsOutput<S>;
