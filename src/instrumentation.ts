export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const isMswEnabled = process.env.NEXT_PUBLIC_ENABLE_MSW !== 'false';
    if (isMswEnabled) {
      const { server } = await import('@/mocks/server');
      server.listen({ onUnhandledRequest: 'bypass' });
      console.info('[MSW] Node.js Server Interceptor started for SSR.');
    }
  }
}
