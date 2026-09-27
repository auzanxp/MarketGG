import { Container } from './container';
import { TOKENS } from './tokens';
import { FetchHttpClient } from '../http/fetch-http-client';
import { type IHttpClient } from '../http/http-client.interface';
import { CookieSessionStore, InMemorySessionStore } from '../storage/cookie-session-store';
import { type ISessionStore } from '../storage/session-store.interface';

import { HttpAuthRepository } from '@/modules/identity/infrastructure/repositories/http-auth.repository';
import { type IAuthRepository } from '@/modules/identity/domain/repositories/auth-repository.interface';
import { LoginUseCase } from '@/modules/identity/application/use-cases/login.usecase';
import { LogoutUseCase } from '@/modules/identity/application/use-cases/logout.usecase';
import { GetCurrentUserUseCase } from '@/modules/identity/application/use-cases/get-current-user.usecase';

import { HttpProductRepository } from '@/modules/catalog/infrastructure/repositories/http-product.repository';
import { LocalMockProductRepository } from '@/modules/catalog/infrastructure/repositories/local-mock-product.repository';
import { type IProductRepository } from '@/modules/catalog/domain/repositories/product-repository.interface';
import { GetProductsUseCase } from '@/modules/catalog/application/use-cases/get-products.usecase';
import { GetProductDetailUseCase } from '@/modules/catalog/application/use-cases/get-product-detail.usecase';
import { GetCategoriesUseCase } from '@/modules/catalog/application/use-cases/get-categories.usecase';
import { GetPublishersUseCase } from '@/modules/catalog/application/use-cases/get-publishers.usecase';

import { HttpDashboardRepository } from '@/modules/dashboard/infrastructure/repositories/http-dashboard.repository';
import { LocalMockDashboardRepository } from '@/modules/dashboard/infrastructure/repositories/local-mock-dashboard.repository';
import { type IDashboardRepository } from '@/modules/dashboard/domain/repositories/dashboard-repository.interface';
import { GetDashboardSummaryUseCase } from '@/modules/dashboard/application/use-cases/get-dashboard-summary.usecase';
import { HttpOrderRepository } from '@/modules/order/infrastructure/repositories/http-order.repository';
import { type IOrderRepository } from '@/modules/order/domain/repositories/order-repository.interface';
import { CheckoutUseCase } from '@/modules/order/application/use-cases/checkout.usecase';
import { GetOrdersUseCase } from '@/modules/order/application/use-cases/get-orders.usecase';
import { GetOrderDetailUseCase } from '@/modules/order/application/use-cases/get-order-detail.usecase';

export function createContainer(): Container {
  const container = new Container();

  container.register(TOKENS.SessionStore, () => {
    if (typeof document === 'undefined') {
      return new InMemorySessionStore();
    }
    return new CookieSessionStore();
  });

  container.register(TOKENS.HttpClient, (c) => {
    const sessionStore = c.resolve<ISessionStore>(TOKENS.SessionStore);

    return new FetchHttpClient({
      getAccessToken: () => sessionStore.getAccessToken(),
      onUnauthorized: () => sessionStore.clear(),
    });
  });

  container.register(TOKENS.AuthRepository, (c) => {
    return new HttpAuthRepository(
      c.resolve<IHttpClient>(TOKENS.HttpClient),
      c.resolve<ISessionStore>(TOKENS.SessionStore)
    );
  });

  container.register(TOKENS.LoginUseCase, (c) => {
    return new LoginUseCase(c.resolve<IAuthRepository>(TOKENS.AuthRepository));
  });

  container.register(TOKENS.LogoutUseCase, (c) => {
    return new LogoutUseCase(c.resolve<IAuthRepository>(TOKENS.AuthRepository));
  });

  container.register(TOKENS.GetCurrentUserUseCase, (c) => {
    return new GetCurrentUserUseCase(c.resolve<IAuthRepository>(TOKENS.AuthRepository));
  });

  container.register(TOKENS.ProductRepository, (c) => {
    if (typeof window === 'undefined' && process.env.NEXT_PUBLIC_ENABLE_MSW !== 'false') {
      return new LocalMockProductRepository();
    }
    return new HttpProductRepository(c.resolve<IHttpClient>(TOKENS.HttpClient));
  });

  container.register(TOKENS.GetProductsUseCase, (c) => {
    return new GetProductsUseCase(c.resolve<IProductRepository>(TOKENS.ProductRepository));
  });

  container.register(TOKENS.GetProductDetailUseCase, (c) => {
    return new GetProductDetailUseCase(c.resolve<IProductRepository>(TOKENS.ProductRepository));
  });

  container.register(TOKENS.GetCategoriesUseCase, (c) => {
    return new GetCategoriesUseCase(c.resolve<IProductRepository>(TOKENS.ProductRepository));
  });

  container.register(TOKENS.GetPublishersUseCase, (c) => {
    return new GetPublishersUseCase(c.resolve<IProductRepository>(TOKENS.ProductRepository));
  });

  container.register(TOKENS.DashboardRepository, (c) => {
    if (typeof window === 'undefined' && process.env.NEXT_PUBLIC_ENABLE_MSW !== 'false') {
      return new LocalMockDashboardRepository();
    }
    return new HttpDashboardRepository(c.resolve<IHttpClient>(TOKENS.HttpClient));
  });

  container.register(TOKENS.GetDashboardSummaryUseCase, (c) => {
    return new GetDashboardSummaryUseCase(
      c.resolve<IDashboardRepository>(TOKENS.DashboardRepository)
    );
  });

  container.register(TOKENS.OrderRepository, (c) => new HttpOrderRepository(c.resolve<IHttpClient>(TOKENS.HttpClient)));
  container.register(TOKENS.CheckoutUseCase, (c) => new CheckoutUseCase(c.resolve<IOrderRepository>(TOKENS.OrderRepository)));
  container.register(TOKENS.GetOrdersUseCase, (c) => new GetOrdersUseCase(c.resolve<IOrderRepository>(TOKENS.OrderRepository)));
  container.register(TOKENS.GetOrderDetailUseCase, (c) => new GetOrderDetailUseCase(c.resolve<IOrderRepository>(TOKENS.OrderRepository)));

  return container;
}

let defaultContainer: Container | null = null;

export function getContainer(): Container {
  if (!defaultContainer) {
    defaultContainer = createContainer();
  }
  return defaultContainer;
}

export function resetContainer(): void {
  defaultContainer = null;
}
