import { vi } from 'vitest';
import { createUpdateProfile, type UpdateProfile } from './profile-service';

describe('createUpdateProfile', () => {
  it('passes the authenticated user ID and display name to persistence', async () => {
    const updatedUser = {
      id: 'user-123',
      email: 'anzu@example.com',
      displayName: 'Anzu Prime',
      createdAt: new Date('2026-08-29T00:00:00.000Z'),
    };
    const updateUserProfile = vi.fn<UpdateProfile>(async () => updatedUser);
    const updateProfile = createUpdateProfile({ updateUserProfile });

    await expect(
      updateProfile({ userId: updatedUser.id, displayName: 'Anzu Prime' }),
    ).resolves.toEqual(updatedUser);
    expect(updateUserProfile).toHaveBeenCalledWith({
      userId: updatedUser.id,
      displayName: 'Anzu Prime',
    });
  });
});
