import { db } from '../index';
import type { UserProfile } from '../../schemas/profile';

export const profileRepository = {
  getProfile: async (): Promise<UserProfile | undefined> => {
    return await db.profiles.get('default-user');
  },

  saveProfile: async (profileData: Omit<UserProfile, 'id'>): Promise<void> => {
    const profile: UserProfile = {
      id: 'default-user',
      ...profileData,
    };
    await db.profiles.put(profile);
  },
};
