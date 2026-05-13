/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getLocalDashboardStatus,
  startLocalDashboard,
  stopLocalDashboard,
} from './DashboardServer.js';

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    get(url, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk: string) => {
        body += chunk;
      });
      response.on('end', () => {
        resolve(body);
      });
    }).on('error', reject);
  });
}

describe('DashboardServer', () => {
  afterEach(async () => {
    await stopLocalDashboard();
  });

  it('is stopped by default', () => {
    expect(getLocalDashboardStatus()).toEqual({ running: false });
  });

  it('starts on localhost only and serves health JSON', async () => {
    const status = await startLocalDashboard();

    expect(status.running).toBe(true);
    expect(status.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    await expect(fetchText(`${status.url}/health`)).resolves.toContain(
      'gemini-code localhost',
    );
  });

  it('stops after explicit shutdown', async () => {
    await startLocalDashboard();
    await stopLocalDashboard();

    expect(getLocalDashboardStatus()).toEqual({ running: false });
  });
});
