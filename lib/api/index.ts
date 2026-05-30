// lib/api/index.ts

import { MockProvider } from './mockProvider';
import { SubscriptionProvider } from './provider';

// Initialize the MockProvider for now.
// Later, this can be instantiated conditionally based on database settings or environment variables.
export const provider: SubscriptionProvider = new MockProvider();
