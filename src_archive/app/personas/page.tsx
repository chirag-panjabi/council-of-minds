import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PersonaList from './PersonaList';

export const metadata = {
  title: 'Persona Library - Framework Engine',
  description: 'Browse and manage your AI personas.',
};

export default function PersonasPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Persona Library</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Browse, search, and manage your local personas.
          </p>
        </div>
        <Link 
          href="/personas/new" 
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Create Persona
        </Link>
      </div>
      
      <PersonaList />
    </div>
  );
}
