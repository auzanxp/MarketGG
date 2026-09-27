import { http, HttpResponse } from 'msw';
import { type DashboardSummaryResponseDto } from '@/modules/dashboard/infrastructure/schemas/dashboard.schema';
import { mockDb } from '../db/mock-db';
import { chaosResponse, problem, simulateLatency } from '../support/simulation';

const SUMMARY_LATENCY = { min: 300, max: 700 };

function currentUser(request: Request) {
  const header = request.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return undefined;
  }
  return mockDb.findUserByAccessToken(header.slice('Bearer '.length).trim());
}

export const dashboardHandlers = [
  http.get('*/api/v1/dashboard/summary', async ({ request }) => {
    const chaos = chaosResponse(request);
    if (chaos) {
      return chaos;
    }
    await simulateLatency(SUMMARY_LATENCY);

    const user = currentUser(request);
    if (!user) {
      return problem(401, {
        type: 'unauthorized',
        title: 'Unauthorized',
        detail: 'Your session has expired. Please sign in again.',
      });
    }

    return HttpResponse.json<DashboardSummaryResponseDto>(mockDb.getDashboardSummary(user.id));
  }),
];
