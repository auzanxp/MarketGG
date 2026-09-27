export const TOKENS = {
  SessionStore: Symbol.for('SessionStore'),
  HttpClient: Symbol.for('HttpClient'),

  AuthRepository: Symbol.for('AuthRepository'),
  LoginUseCase: Symbol.for('LoginUseCase'),
  LogoutUseCase: Symbol.for('LogoutUseCase'),
  GetCurrentUserUseCase: Symbol.for('GetCurrentUserUseCase'),

  ProductRepository: Symbol.for('ProductRepository'),
  GetProductsUseCase: Symbol.for('GetProductsUseCase'),
  GetProductDetailUseCase: Symbol.for('GetProductDetailUseCase'),
  GetCategoriesUseCase: Symbol.for('GetCategoriesUseCase'),
  GetPublishersUseCase: Symbol.for('GetPublishersUseCase'),

  DashboardRepository: Symbol.for('DashboardRepository'),
  GetDashboardSummaryUseCase: Symbol.for('GetDashboardSummaryUseCase'),

  OrderRepository: Symbol.for('OrderRepository'),
  CheckoutUseCase: Symbol.for('CheckoutUseCase'),
  GetOrdersUseCase: Symbol.for('GetOrdersUseCase'),
  GetOrderDetailUseCase: Symbol.for('GetOrderDetailUseCase'),
} as const;
