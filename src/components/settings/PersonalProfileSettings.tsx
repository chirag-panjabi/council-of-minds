"use client";

import * as React from 'react';
import { profileRepository } from '@/lib/db/repositories/profile';
import { useLiveQuery } from 'dexie-react-hooks';

export function PersonalProfileSettings() {
  const profile = useLiveQuery(() => profileRepository.getProfile());
  const [preferredName, setPreferredName] = React.useState('');
  const [contextualProfile, setContextualProfile] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setPreferredName(profile.preferredName || '');
      setContextualProfile(profile.contextualProfile || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await profileRepository.saveProfile({
        preferredName,
        contextualProfile,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section aria-labelledby="profile-setup-title" className="space-y-6 rounded-xl border bg-card p-5 shadow-sm mt-6">
      <div>
        <h2 id="profile-setup-title" className="text-xl font-semibold">Personal Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell AI models about yourself and set a preferred name. This context will be injected into prompts.
        </p>
      </div>

      <div className="space-y-4 max-w-xl">
        <div className="flex flex-col space-y-1.5">
          <label htmlFor="preferredName" className="text-sm font-medium">Preferred Name</label>
          <input
            id="preferredName"
            type="text"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            placeholder="How should the AI address you?"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="flex flex-col space-y-1.5">
          <label htmlFor="contextualProfile" className="text-sm font-medium">Contextual Profile</label>
          <textarea
            id="contextualProfile"
            value={contextualProfile}
            onChange={(e) => setContextualProfile(e.target.value)}
            placeholder="e.g. I am a software engineer building web apps. I prefer concise answers and code snippets without explanations..."
            rows={5}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y min-h-[100px]"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </section>
  );
}
