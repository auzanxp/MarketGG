export type Factory<T> = (container: Container) => T;

export class Container {
  private readonly instances = new Map<symbol, unknown>();
  private readonly factories = new Map<symbol, Factory<unknown>>();

  public register<T>(token: symbol, factory: Factory<T>): this {
    this.factories.set(token, factory as Factory<unknown>);
    return this;
  }

  public registerInstance<T>(token: symbol, instance: T): this {
    this.instances.set(token, instance);
    return this;
  }

  public resolve<T>(token: symbol): T {
    if (this.instances.has(token)) {
      return this.instances.get(token) as T;
    }

    const factory = this.factories.get(token);
    if (!factory) {
      const tokenName = token.description || token.toString();
      throw new Error(`[DI Container] Service not registered for token: ${tokenName}`);
    }

    const instance = factory(this);
    this.instances.set(token, instance);
    return instance as T;
  }

  public has(token: symbol): boolean {
    return this.instances.has(token) || this.factories.has(token);
  }

  public clear(): void {
    this.instances.clear();
    this.factories.clear();
  }
}
