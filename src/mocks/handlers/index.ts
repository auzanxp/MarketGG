import { authHandlers } from './auth.handler';
import { catalogHandlers } from './catalog.handler';
import { dashboardHandlers } from './dashboard.handler';
import { orderHandlers } from './order.handler';

export const handlers = [
  ...authHandlers,
  ...dashboardHandlers,
  ...catalogHandlers,
  ...orderHandlers,
];
