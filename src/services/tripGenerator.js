/**
 * ============================================================================
 *  TRIP GENERATOR — calls the backend planner
 * ============================================================================
 *
 *  generateTrip(userInputs) sends the planning inputs to the backend
 *  (POST /api/trips/generate), where the planning engine builds the trip.
 *  The response has exactly the shape the pages already use:
 *
 *  {
 *    status: 'ok' | 'infeasible',
 *    trip: TRIP | null,
 *    budgetReport: { budget, mode, allowedMaximum, totalCost, minimumCost, shortfall,
 *                    overage, overagePercent, overLimit,
 *                    breakdown: { transportation, accommodation, food, activities, localTransport, miscellaneous } },
 *    adjustmentsMade: [string],
 *  }
 *
 *  The TRIP shape (itinerary, transport, stays, restaurants, budget, …) is
 *  documented in backend/app/services/planner/generator.py. The backend also
 *  adds trip.explanation (why places were chosen), which pages may ignore.
 *
 *  When the request itself fails, this function does NOT throw. It returns:
 *
 *  { status: 'error', errorType: 'validation' | 'network', message, trip: null,
 *    budgetReport: null, adjustmentsMade: [] }
 *
 *    validation – the backend rejected the inputs (HTTP 422); `message` says why
 *    network    – the server couldn't be reached, or failed (5xx)
 * ============================================================================
 */
import { ApiError, apiRequest } from './apiClient';

export const PLANNING_FAILED_MESSAGE = 'Something went wrong while planning your trip. Please try again.';

export async function generateTrip(userInputs) {
  try {
    return await apiRequest('/api/trips/generate', { method: 'POST', body: userInputs });
  } catch (error) {
    const isValidation = error instanceof ApiError && error.status === 422;
    return {
      status: 'error',
      errorType: isValidation ? 'validation' : 'network',
      message: isValidation ? error.details?.[0]?.message || error.message : PLANNING_FAILED_MESSAGE,
      trip: null,
      budgetReport: null,
      adjustmentsMade: [],
    };
  }
}
