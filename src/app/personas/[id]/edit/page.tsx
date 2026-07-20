'use client';

import React, { useEffect, useState } from 'react';
import PersonaForm from '../../PersonaForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { personaRepository } from '../../../../lib/db/repositories/persona';
import { LocalPersona } from '../../../../lib/schemas/persona';

export default function EditPersonaPage({ params }: { params: { id: string } }) {
  const [persona, setPersona] = useState<LocalPersona | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPersona() {
      try {
        const p = await personaRepository.get(params.id);
        if (p) {
          setPersona(p);
        } else {
          setError('Persona not found');
        }
      } catch (err) {
        setError('Failed to load persona');
      } finally {
        setLoading(false);
      }
    }
    
    loadPersona();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !persona) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {error || 'Persona not found'}
        </h2>
        <Link href="/personas" className="text-blue-600 hover:underline">
          Return to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/personas" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Library
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Persona</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Update instructions and settings for {persona.name}.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <PersonaForm initialPersona={persona} />
      </div>
    </div>
  );
}
