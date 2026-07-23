import React from 'react';
import PersonaForm from '../PersonaForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Create Persona - Framework Engine',
  description: 'Create a new AI persona.',
};

export default function NewPersonaPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/personas" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Library
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Persona</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Define a new persona with custom instructions.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <PersonaForm />
      </div>
    </div>
  );
}
