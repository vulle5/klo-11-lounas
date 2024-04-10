import { vi } from 'vitest';
import { loadEnvConfig } from '@next/env';

vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(new Response()));

// Load the environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);
