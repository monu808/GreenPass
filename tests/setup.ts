import { TextEncoder, TextDecoder } from 'util';
import { MessageChannel, MessagePort } from 'worker_threads';

// Polyfill for Node environment missing these globals
// @ts-ignore
global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;

if (typeof global.MessageChannel === 'undefined') {
  // @ts-ignore
  global.MessageChannel = MessageChannel;
}
if (typeof global.MessagePort === 'undefined') {
  // @ts-ignore
  global.MessagePort = MessagePort;
}

// Polyfill fetch, Request, Response, Headers for MSW 2.0+
const { fetch, Request, Response, Headers } = require('undici');
if (typeof global.fetch === 'undefined') {
  global.fetch = fetch;
  global.Request = Request;
  global.Response = Response;
  global.Headers = Headers;
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
