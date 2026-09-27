import { describe, it, expect } from 'vitest';
import { Container } from '../container';

describe('DI Container', () => {
  it('should register and resolve singleton instances', () => {
    const container = new Container();
    const token = Symbol('TestService');

    let counter = 0;
    container.register(token, () => {
      counter++;
      return { id: counter };
    });

    const instance1 = container.resolve<{ id: number }>(token);
    const instance2 = container.resolve<{ id: number }>(token);

    expect(instance1.id).toBe(1);
    expect(instance2.id).toBe(1);
    expect(instance1).toBe(instance2);
    expect(counter).toBe(1);
  });

  it('should throw clear error when resolving unregistered token', () => {
    const container = new Container();
    const unregisteredToken = Symbol('Unregistered');

    expect(() => container.resolve(unregisteredToken)).toThrow(
      /Service not registered for token: Unregistered/
    );
  });

  it('should resolve dependencies hierarchically', () => {
    const container = new Container();
    const loggerToken = Symbol('Logger');
    const serviceToken = Symbol('Service');

    container.register(loggerToken, () => ({ log: () => 'logged' }));
    container.register(serviceToken, (c) => {
      const logger = c.resolve<{ log: () => string }>(loggerToken);
      return { execute: () => logger.log() };
    });

    const service = container.resolve<{ execute: () => string }>(serviceToken);
    expect(service.execute()).toBe('logged');
  });
});
