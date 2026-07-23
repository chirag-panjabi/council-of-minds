import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { settingsStore } from '@/lib/storage/settings';
import { ProviderSetupForm } from './ProviderSetupForm';

const mocks = vi.hoisted(() => ({
  validateCloudProvider: vi.fn(),
  testOllamaConnection: vi.fn(),
}));

vi.mock('@/lib/providers/cloud-validation', () => ({ validateCloudProvider: mocks.validateCloudProvider }));
vi.mock('@/lib/providers/ollama', () => ({
  DEFAULT_OLLAMA_BASE_URL: 'http://localhost:11434/api',
  testOllamaConnection: mocks.testOllamaConnection,
}));

describe('ProviderSetupForm', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.validateCloudProvider.mockReset();
    mocks.testOllamaConnection.mockReset();
  });

  it('saves a cloud key only after proxy validation succeeds', async () => {
    mocks.validateCloudProvider.mockResolvedValue({ status: 'valid', retryable: false });
    render(<ProviderSetupForm />);

    fireEvent.change(screen.getByLabelText('API key'), { target: { value: 'key-for-test-only' } });
    fireEvent.click(screen.getByRole('button', { name: 'Validate and save' }));

    await waitFor(() => expect(mocks.validateCloudProvider).toHaveBeenCalledWith('openai', 'key-for-test-only'));
    expect(settingsStore.getApiKeys()).toEqual({ openai: 'key-for-test-only' });
    expect(screen.getByText('Key validated and saved in this browser.')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('key-for-test-only')).not.toBeInTheDocument();
  });

  it('preserves an entered cloud key without storing it after validation fails', async () => {
    mocks.validateCloudProvider.mockResolvedValue({ status: 'invalid_key', retryable: false });
    render(<ProviderSetupForm />);

    fireEvent.change(screen.getByLabelText('API key'), { target: { value: 'key-for-test-only' } });
    fireEvent.click(screen.getByRole('button', { name: 'Validate and save' }));

    await screen.findByRole('alert');
    expect(settingsStore.getApiKeys()).toEqual({});
    expect(screen.getByDisplayValue('key-for-test-only')).toBeInTheDocument();
  });

  it('uses direct Ollama validation and stores only the loopback configuration', async () => {
    mocks.testOllamaConnection.mockResolvedValue({
      status: 'connected',
      baseUrl: 'http://localhost:11434/api',
      models: [{ name: 'qwen3:latest', model: 'qwen3:latest' }],
    });
    render(<ProviderSetupForm />);

    fireEvent.click(screen.getByRole('radio', { name: 'Ollama (local)' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Test connection' }));

    await waitFor(() => expect(mocks.testOllamaConnection).toHaveBeenCalledWith('http://localhost:11434/api'));
    expect(settingsStore.getApiKeys()).toEqual({});
    expect(settingsStore.getPreferences().ollama).toEqual({
      enabled: true,
      baseUrl: 'http://localhost:11434/api',
      modelIds: ['qwen3:latest'],
      selectedModelId: 'qwen3:latest',
    });
    expect(screen.getByRole('status')).toHaveTextContent('Connected directly to Ollama.');
  });

  it('keeps saved keys masked and requires an explicit replacement action', async () => {
    settingsStore.setApiKeys({ openai: 'key-for-test-only' });
    render(<ProviderSetupForm />);

    expect(await screen.findByText('A key is saved for OpenAI. Saved keys cannot be revealed or exported.')).toBeInTheDocument();
    expect(screen.queryByLabelText('API key')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Replace key' }));
    expect(screen.getByLabelText('API key')).toHaveAttribute('type', 'password');
  });
});
