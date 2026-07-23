"use client";

import React, { useEffect, useState } from 'react';
import { getAllProviders } from '../../lib/providers/registry';
import { getAllPricingEntries } from '../../lib/analytics/pricing-catalog';
import { settingsStore } from '../../lib/storage/settings';

interface ProviderModelSelectorProps {
  providerId: string;
  modelId: string;
  onProviderChange: (providerId: string) => void;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export function ProviderModelSelector({
  providerId,
  modelId,
  onProviderChange,
  onModelChange,
  disabled = false,
}: ProviderModelSelectorProps) {
  const availableProviders = getAllProviders();
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!providerId) {
      setAvailableModels([]);
      return;
    }

    if (providerId === 'ollama') {
      try {
        const prefs = settingsStore.getPreferences();
        const models = prefs.ollama?.modelIds || [];
        setAvailableModels(models.map((m) => ({ id: m, name: m })));
      } catch (e) {
        setAvailableModels([]);
      }
      return;
    }

    const loadModels = async () => {
      let models: { id: string; name: string }[] = [];
      const fallbackModels = getAllPricingEntries()
          .filter((entry) => entry.providerId === providerId)
          .map((entry) => ({ id: entry.modelId, name: entry.modelId }));
      
      if (providerId === 'anthropic') {
        // Anthropic doesn't have an API to list models
        setAvailableModels(fallbackModels);
        return;
      }

      const apiKeys = settingsStore.getApiKeys();
      const apiKey = apiKeys[providerId];

      if (!apiKey) {
        setAvailableModels(fallbackModels);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/proxy/${providerId}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.models && data.models.length > 0) {
            models = data.models;
          } else {
            console.warn('Provider API returned no models, falling back to hardcoded models', data);
            models = fallbackModels;
          }
        } else {
          console.error(`Failed to fetch models: ${response.status} ${response.statusText}`);
          models = fallbackModels;
        }
      } catch (e) {
        console.error('Error fetching models:', e);
        models = fallbackModels;
      } finally {
        setAvailableModels(models);
        setIsLoading(false);
      }
    };

    loadModels();
  }, [providerId]);

  // Auto-select first model when provider changes and current model is not valid for new provider
  useEffect(() => {
    if (providerId && availableModels.length > 0 && !isLoading) {
      const isValid = availableModels.some((m) => m.id === modelId);
      if (!isValid) {
        onModelChange(availableModels[0].id);
      }
    } else if (!providerId && modelId) {
      onModelChange('');
    }
  }, [providerId, availableModels, modelId, onModelChange, isLoading]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <select
        value={providerId || ''}
        onChange={(e) => onProviderChange(e.target.value)}
        disabled={disabled}
        className="p-2 border rounded-md text-sm w-full bg-background"
        aria-label="Select Provider"
      >
        <option value="">Select Provider</option>
        {availableProviders.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      
      <select
        value={modelId || ''}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled || !providerId || availableModels.length === 0 || isLoading}
        className="p-2 border rounded-md text-sm w-full bg-background disabled:opacity-50"
        aria-label="Select Model"
      >
        {isLoading ? (
          <option value="">Loading models...</option>
        ) : (
          <option value="">Select Model</option>
        )}
        {availableModels.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}
