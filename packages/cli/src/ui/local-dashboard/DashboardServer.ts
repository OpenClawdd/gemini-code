/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createServer,
  type Server,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';

export interface LocalDashboardStatus {
  running: boolean;
  url?: string;
}

let server: Server | undefined;
let port: number | undefined;

function writeJson(
  response: ServerResponse,
  statusCode: number,
  payload: Record<string, unknown>,
): void {
  response.writeHead(statusCode, { 'content-type': 'application/json' });
  response.end(JSON.stringify(payload));
}

function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
): void {
  if (request.url === '/health') {
    writeJson(response, 200, { ok: true, service: 'gemini-code localhost' });
    return;
  }

  writeJson(response, 200, {
    product: 'gemini-code',
    cockpit: 'localhost dashboard',
    status: 'optional',
  });
}

export function getLocalDashboardStatus(): LocalDashboardStatus {
  if (!server || port === undefined) {
    return { running: false };
  }

  return { running: true, url: `http://127.0.0.1:${port}` };
}

export async function startLocalDashboard(
  requestedPort = 0,
): Promise<LocalDashboardStatus> {
  const currentStatus = getLocalDashboardStatus();
  if (currentStatus.running) {
    return currentStatus;
  }

  const nextServer = createServer(handleRequest);
  await new Promise<void>((resolve, reject) => {
    nextServer.once('error', reject);
    nextServer.listen(requestedPort, '127.0.0.1', () => {
      nextServer.off('error', reject);
      resolve();
    });
  });

  const address = nextServer.address();
  if (typeof address === 'object' && address !== null) {
    port = address.port;
  } else {
    port = requestedPort;
  }
  server = nextServer;
  return getLocalDashboardStatus();
}

export async function stopLocalDashboard(): Promise<void> {
  if (!server) {
    return;
  }

  const currentServer = server;
  server = undefined;
  port = undefined;

  await new Promise<void>((resolve, reject) => {
    currentServer.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
