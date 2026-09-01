/**
 * Feature-gate middleware entry points. The full implementation lives in
 * `services/featureService.ts`; this file just re-exports the middleware
 * factory in a path that's easier to import from route files.
 */
export { checkFeature, featureService } from '../services/featureService';
export type { GateableFeature } from '../services/featureService';