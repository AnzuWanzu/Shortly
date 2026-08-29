import type { AuthenticatedUser } from '../login/login-service';
import type { ProfileUpdateInput } from './profile-schema';

export type UpdateProfileInput = ProfileUpdateInput & { userId: string };
export type UpdateProfile = (
  input: UpdateProfileInput,
) => Promise<AuthenticatedUser>;

type ProfileDependencies = {
  updateUserProfile: UpdateProfile;
};

export function createUpdateProfile(
  _dependencies: ProfileDependencies,
): UpdateProfile {
  return async function updateProfile(
    _input: UpdateProfileInput,
  ): Promise<AuthenticatedUser> {
    throw new Error('Not implemented');
  };
}
