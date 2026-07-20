'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PersonaSchema, LocalPersona } from '../../lib/schemas/persona';
import { settingsStore } from '../../lib/storage/settings';
import { personaRepository } from '../../lib/db/repositories/persona';
import { generateAvatarSvg } from '../../lib/utils/avatar';
import { generateId } from '../../lib/utils/uuid';

interface PersonaFormProps {
  initialPersona?: LocalPersona;
}

export default function PersonaForm({ initialPersona }: PersonaFormProps) {
  const router = useRouter();
  
  // Use 'persona:new' if no initial persona, otherwise 'persona:{id}'
  const draftKey = initialPersona ? `persona:${initialPersona.id}` : 'persona:new';
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: '',
    avatar: '',
    ui_color: '',
    welcome_message: '',
    advancedRules: '',
    tags: '',
    defaultWordLimit: '' as string | number,
    recommended_model: '',
    price: '' as string | number,
    is_council_member: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Load draft or initial data
  useEffect(() => {
    setMounted(true);
    const drafts = settingsStore.getDrafts();
    const savedDraft = drafts[draftKey];
    
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData({
          name: parsed.name || '',
          description: parsed.description || '',
          instructions: parsed.instructions || '',
          avatar: parsed.avatar || '',
          ui_color: parsed.ui_color || '',
          welcome_message: parsed.welcome_message || '',
          advancedRules: parsed.advancedRules || '',
          tags: parsed.tags || '',
          defaultWordLimit: parsed.defaultWordLimit || '',
          recommended_model: parsed.recommended_model || '',
          price: parsed.price || '',
          is_council_member: parsed.is_council_member || false,
        });
      } catch (e) {
        // Fallback
        if (initialPersona) {
          setFormData({
            name: initialPersona.name,
            description: initialPersona.description || '',
            instructions: initialPersona.instructions,
            avatar: initialPersona.avatar || '',
            ui_color: initialPersona.ui_color || '',
            welcome_message: initialPersona.welcome_message || '',
            advancedRules: initialPersona.advancedRules || '',
            tags: initialPersona.tags?.join(', ') || '',
            defaultWordLimit: initialPersona.defaultWordLimit || '',
            recommended_model: initialPersona.recommended_model || '',
            price: initialPersona.price || '',
            is_council_member: initialPersona.is_council_member || false,
          });
        }
      }
    } else if (initialPersona) {
      setFormData({
        name: initialPersona.name,
        description: initialPersona.description || '',
        instructions: initialPersona.instructions,
        avatar: initialPersona.avatar || '',
        ui_color: initialPersona.ui_color || '',
        welcome_message: initialPersona.welcome_message || '',
        advancedRules: initialPersona.advancedRules || '',
        tags: initialPersona.tags?.join(', ') || '',
        defaultWordLimit: initialPersona.defaultWordLimit || '',
        recommended_model: initialPersona.recommended_model || '',
        price: initialPersona.price || '',
        is_council_member: initialPersona.is_council_member || false,
      });
    }
  }, [draftKey, initialPersona]);
  
  // Save draft on change (only after initial load to avoid overwriting with empty)
  useEffect(() => {
    if (!mounted) return;
    const drafts = settingsStore.getDrafts();
    drafts[draftKey] = JSON.stringify(formData);
    settingsStore.setDrafts(drafts);
  }, [formData, draftKey, mounted]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'defaultWordLimit' || name === 'price') {
      finalValue = value === '' ? '' : Number(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    // Clear error for field
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate with Zod
    const personaToValidate = {
      id: initialPersona?.id || generateId(),
      createdAt: initialPersona?.createdAt || Date.now(),
      updatedAt: Date.now(),
      name: formData.name,
      description: formData.description || undefined,
      instructions: formData.instructions,
      avatar: formData.avatar || initialPersona?.avatar || (formData.name ? generateAvatarSvg(formData.name) : undefined),
      advancedRules: formData.advancedRules || undefined,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    };
    
    const result = PersonaSchema.safeParse(personaToValidate);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        if (issue.path.length > 0) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const localPersona: LocalPersona = {
        ...result.data,
        isFavorite: initialPersona?.isFavorite || false,
        isArchived: initialPersona?.isArchived || false,
        lastUsedAt: initialPersona?.lastUsedAt,
        ui_color: formData.ui_color || undefined,
        welcome_message: formData.welcome_message || undefined,
        defaultWordLimit: typeof formData.defaultWordLimit === 'number' ? formData.defaultWordLimit : undefined,
        recommended_model: formData.recommended_model || undefined,
        price: typeof formData.price === 'number' ? formData.price : undefined,
        is_council_member: formData.is_council_member || false,
      };
      
      await personaRepository.save(localPersona);
      
      // Clear draft
      const drafts = settingsStore.getDrafts();
      delete drafts[draftKey];
      settingsStore.setDrafts(drafts);
      
      router.push('/personas');
    } catch (err) {
      console.error('Failed to save persona', err);
      setIsSubmitting(false);
    }
  };
  
  const handleDiscard = () => {
    if (confirm('Are you sure you want to discard your draft?')) {
      const drafts = settingsStore.getDrafts();
      delete drafts[draftKey];
      settingsStore.setDrafts(drafts);
      router.push('/personas');
    }
  };

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            className={`shadow-sm block w-full sm:text-sm rounded-md dark:bg-gray-800 dark:text-white ${
              errors.name 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="e.g. Code Expert"
          />
        </div>
        {errors.name && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description (Optional)
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            className={`shadow-sm block w-full sm:text-sm rounded-md dark:bg-gray-800 dark:text-white ${
              errors.description 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="A short summary of what this persona does."
          />
        </div>
        {errors.description && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.description}</p>}
      </div>

      <div>
        <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          System Instructions <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <textarea
            id="instructions"
            name="instructions"
            rows={10}
            value={formData.instructions}
            onChange={handleChange}
            className={`shadow-sm block w-full sm:text-sm rounded-md dark:bg-gray-800 dark:text-white font-mono ${
              errors.instructions 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="You are an expert..."
          />
        </div>
        {errors.instructions && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.instructions}</p>}
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Provide the system prompt that dictates the behavior of the persona.
        </p>
      </div>

      <div>
        <label htmlFor="advancedRules" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Advanced Rules (Optional)
        </label>
        <div className="mt-1">
          <textarea
            id="advancedRules"
            name="advancedRules"
            rows={5}
            value={formData.advancedRules}
            onChange={handleChange}
            className={`shadow-sm block w-full sm:text-sm rounded-md dark:bg-gray-800 dark:text-white font-mono ${
              errors.advancedRules 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="E.g. Always output code in blocks, do not apologize, etc."
          />
        </div>
        {errors.advancedRules && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.advancedRules}</p>}
      </div>

      <div>
        <label htmlFor="welcome_message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          First Message / Welcome Message (Optional)
        </label>
        <div className="mt-1">
          <textarea
            id="welcome_message"
            name="welcome_message"
            rows={3}
            value={formData.welcome_message}
            onChange={handleChange}
            className={`shadow-sm block w-full sm:text-sm rounded-md dark:bg-gray-800 dark:text-white ${
              errors.welcome_message 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="Hi, I am ready to help you!"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tags (Optional)
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="tags"
              id="tags"
              value={formData.tags}
              onChange={handleChange}
              className={`shadow-sm block w-full sm:text-sm rounded-md dark:bg-gray-800 dark:text-white ${
                errors.tags 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="e.g. coding, javascript, helpful (comma separated)"
            />
          </div>
          {errors.tags && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.tags}</p>}
        </div>

        <div>
          <label htmlFor="ui_color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Accent Color (Optional)
          </label>
          <div className="mt-1 flex gap-3">
            <input
              type="color"
              name="ui_color"
              id="ui_color_picker"
              value={formData.ui_color || '#3b82f6'}
              onChange={handleChange}
              className="h-9 w-9 rounded-md border-0 cursor-pointer"
            />
            <input
              type="text"
              name="ui_color"
              id="ui_color"
              value={formData.ui_color}
              onChange={handleChange}
              className={`shadow-sm block w-full sm:text-sm rounded-md dark:bg-gray-800 dark:text-white ${
                errors.ui_color 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="#3b82f6"
            />
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Avatar URL (Optional)
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="avatar"
            id="avatar"
            value={formData.avatar}
            onChange={handleChange}
            className={`shadow-sm block w-full sm:text-sm rounded-md dark:bg-gray-800 dark:text-white ${
              errors.avatar 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="https://example.com/avatar.png"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Leave blank to use an auto-generated SVG avatar based on the name.
        </p>
      </div>
      
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Local Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="defaultWordLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Default Word Limit (Optional)
            </label>
            <div className="mt-1">
              <input
                type="number"
                name="defaultWordLimit"
                id="defaultWordLimit"
                value={formData.defaultWordLimit}
                onChange={handleChange}
                className="shadow-sm block w-full sm:text-sm rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 150"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Limit the persona&apos;s response length. Overrides global setting.
            </p>
          </div>

          <div>
            <label htmlFor="recommended_model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Recommended Model (Optional)
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="recommended_model"
                id="recommended_model"
                value={formData.recommended_model}
                onChange={handleChange}
                className="shadow-sm block w-full sm:text-sm rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. gpt-4-turbo"
              />
            </div>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Price (Optional)
            </label>
            <div className="mt-1">
              <input
                type="number"
                step="0.01"
                name="price"
                id="price"
                value={formData.price}
                onChange={handleChange}
                className="shadow-sm block w-full sm:text-sm rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 5.99"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="is_council_member"
            name="is_council_member"
            type="checkbox"
            checked={formData.is_council_member}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800"
          />
          <label htmlFor="is_council_member" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            Is Council Member
          </label>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end space-x-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handleDiscard}
          className="bg-white dark:bg-gray-800 py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Discard Draft
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Persona'}
        </button>
      </div>
    </form>
  );
}
