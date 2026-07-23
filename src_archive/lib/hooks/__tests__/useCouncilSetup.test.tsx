import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCouncilSetup } from '../useCouncilSetup';
import { Persona } from '../../schemas/persona';

describe('useCouncilSetup', () => {
  const mockPersona1: Persona = {
    id: '1',
    name: 'Debater 1',
    instructions: 'Instructions 1',
    createdAt: 123,
    updatedAt: 123
  };

  const mockPersona2: Persona = {
    id: '2',
    name: 'Debater 2',
    instructions: 'Instructions 2',
    createdAt: 123,
    updatedAt: 123
  };

  const mockPersona3: Persona = {
    id: '3',
    name: 'Debater 3',
    instructions: 'Instructions 3',
    createdAt: 123,
    updatedAt: 123
  };

  it('should initialize with empty debaters and null synthesizer', () => {
    const { result } = renderHook(() => useCouncilSetup());
    expect(result.current.debaters).toEqual([]);
    expect(result.current.synthesizer).toBeNull();
    expect(result.current.turnCap).toBe(6);
  });

  it('should add and remove debaters', () => {
    const { result } = renderHook(() => useCouncilSetup());
    
    act(() => {
      result.current.addDebater(mockPersona1);
      result.current.addDebater(mockPersona2);
    });

    expect(result.current.debaters.length).toBe(2);
    expect(result.current.debaters[0].persona.id).toBe('1');

    // Test prevent duplicate adding
    act(() => {
      result.current.addDebater(mockPersona1);
    });
    expect(result.current.debaters.length).toBe(2);

    act(() => {
      result.current.removeDebater('1');
    });

    expect(result.current.debaters.length).toBe(1);
    expect(result.current.debaters[0].persona.id).toBe('2');
  });

  it('should set and update synthesizer', () => {
    const { result } = renderHook(() => useCouncilSetup());

    act(() => {
      result.current.setSynthesizerPersona(mockPersona1);
    });
    expect(result.current.synthesizer?.persona.id).toBe('1');

    act(() => {
      result.current.updateSynthesizerModel('openai', 'gpt-4');
    });
    expect(result.current.synthesizer?.providerId).toBe('openai');
    expect(result.current.synthesizer?.modelId).toBe('gpt-4');

    act(() => {
      result.current.setSynthesizerPersona(null);
    });
    expect(result.current.synthesizer).toBeNull();
  });

  it('should move debaters earlier and later', () => {
    const { result } = renderHook(() => useCouncilSetup());

    act(() => {
      result.current.addDebater(mockPersona1);
      result.current.addDebater(mockPersona2);
      result.current.addDebater(mockPersona3);
    });

    expect(result.current.debaters.map(d => d.persona.id)).toEqual(['1', '2', '3']);

    // Move '2' earlier
    act(() => {
      result.current.moveDebater('2', 'earlier');
    });
    expect(result.current.debaters.map(d => d.persona.id)).toEqual(['2', '1', '3']);

    // Try move '2' earlier again (already first)
    act(() => {
      result.current.moveDebater('2', 'earlier');
    });
    expect(result.current.debaters.map(d => d.persona.id)).toEqual(['2', '1', '3']);

    // Move '2' later
    act(() => {
      result.current.moveDebater('2', 'later');
    });
    expect(result.current.debaters.map(d => d.persona.id)).toEqual(['1', '2', '3']);

    // Move '3' later (already last)
    act(() => {
      result.current.moveDebater('3', 'later');
    });
    expect(result.current.debaters.map(d => d.persona.id)).toEqual(['1', '2', '3']);
  });

  it('should update debater model correctly', () => {
    const { result } = renderHook(() => useCouncilSetup());

    act(() => {
      result.current.addDebater(mockPersona1);
    });

    act(() => {
      result.current.updateDebaterModel('1', 'anthropic', 'claude-3');
    });

    expect(result.current.debaters[0].providerId).toBe('anthropic');
    expect(result.current.debaters[0].modelId).toBe('claude-3');
  });

  it('should set turn cap', () => {
    const { result } = renderHook(() => useCouncilSetup());

    act(() => {
      result.current.setTurnCap(10);
    });
    expect(result.current.turnCap).toBe(10);
  });
});
