import { http, HttpResponse } from 'msw';
import { ConflictError, ValidationError } from '@/shared/domain/errors';
import { CheckoutRequestSchema, type CheckoutResponseDto, type OrderDto, type OrderListResponseDto } from '@/modules/order/infrastructure/schemas/order.schema';
import { toPaginatedResponse } from '@/shared/infrastructure/http/pagination';
import { isOrderStatus } from '@/modules/order/domain/value-objects/order-status';
import { mockDb } from '../db/mock-db';
import { chaosResponse, problem, simulateLatency } from '../support/simulation';

function currentUser(request: Request) {
  const header = request.headers.get('Authorization');
  return header?.startsWith('Bearer ')
    ? mockDb.findUserByAccessToken(header.slice(7).trim())
    : undefined;
}

function unauthorized() {
  return problem(401, { type: 'unauthorized', title: 'Unauthorized', detail: 'Your session has expired. Please sign in again.' });
}

export const orderHandlers = [
  http.post('*/api/v1/orders/checkout', async ({ request }) => {
    const chaos = chaosResponse(request);
    if (chaos) return chaos;
    await simulateLatency({ min: 450, max: 900 });
    const user = currentUser(request);
    if (!user) return unauthorized();

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return problem(400, { type: 'malformed-body', title: 'Invalid Request Body', detail: 'Request body must be valid JSON.' });
    }
    const payload = CheckoutRequestSchema.safeParse(raw);
    if (!payload.success) {
      const errors: Record<string, string> = {};
      for (const issue of payload.error.issues) {
        const key = String(issue.path[0] === 'billingInfo' ? issue.path[1] ?? 'billingInfo' : issue.path[0]);
        errors[key] ??= issue.message;
      }
      return problem(422, { type: 'validation', title: 'Validation Error', detail: 'Please check your billing details and cart.', errors });
    }

    try {
      const order = mockDb.createOrder({ ...payload.data, userId: user.id });
      return HttpResponse.json<CheckoutResponseDto>({ message: 'Order placed successfully', order }, { status: 201 });
    } catch (error) {
      if (error instanceof ValidationError) {
        return problem(422, { type: 'validation', title: 'Validation Error', detail: error.message, errors: { ...error.fieldErrors } });
      }
      if (error instanceof ConflictError) {
        return problem(409, { type: 'stock-conflict', title: 'Stock Conflict', detail: error.message, meta: { ...error.meta } });
      }
      return problem(500, { type: 'checkout-failed', title: 'Checkout Failed', detail: 'Your order could not be placed.' });
    }
  }),

  http.get('*/api/v1/orders', async ({ request }) => {
    const chaos = chaosResponse(request);
    if (chaos) return chaos;
    await simulateLatency();
    const user = currentUser(request);
    if (!user) return unauthorized();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const orders = mockDb.getOrdersPage({
      userId: user.id,
      status: isOrderStatus(status) ? status : undefined,
      query: url.searchParams.get('q') || undefined,
      page: url.searchParams.has('page') ? Number(url.searchParams.get('page')) : undefined,
      limit: url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : undefined,
    });
    return HttpResponse.json<OrderListResponseDto>(toPaginatedResponse(orders));
  }),

  http.get('*/api/v1/orders/:id', async ({ params, request }) => {
    const chaos = chaosResponse(request);
    if (chaos) return chaos;
    await simulateLatency();
    const user = currentUser(request);
    if (!user) return unauthorized();
    const order = mockDb.getOrderById(String(params.id), user.id);
    if (!order) return problem(404, { type: 'not-found', title: 'Order Not Found', detail: 'This order could not be found.' });
    return HttpResponse.json<OrderDto>(order);
  }),
];
