import { fetch, Request, Response, Headers } from 'undici';
import { TextEncoder, TextDecoder } from 'util';
import { MessageChannel, MessagePort } from 'worker_threads';

// Polyfill for Node environment missing these globals
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

if (typeof global.MessageChannel === 'undefined') {
  global.MessageChannel = MessageChannel as any;
}
if (typeof global.MessagePort === 'undefined') {
  global.MessagePort = MessagePort as any;
}

// Polyfill fetch, Request, Response, Headers for MSW 2.0+
if (typeof global.fetch === 'undefined') {
  global.fetch = fetch as any;
  global.Request = Request as any;
  global.Response = Response as any;
  global.Headers = Headers as any;
}

import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());
