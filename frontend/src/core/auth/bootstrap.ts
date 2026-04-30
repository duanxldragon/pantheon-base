import { getMe, type UserInfo } from '../../modules/auth/api';
import { useAuthStore } from '../../store/useAuthStore';

let pendingToken: string | null = null;
let pendingProfilePromise: Promise<UserInfo | null> | null = null;

export function ensureAuthUserInfo() {
  const { token, userInfo, setUserInfo } = useAuthStore.getState();
  if (!token) {
    return Promise.resolve(null);
  }
  if (userInfo) {
    return Promise.resolve(userInfo);
  }
  if (pendingProfilePromise && pendingToken === token) {
    return pendingProfilePromise;
  }

  pendingToken = token;
  pendingProfilePromise = getMe()
    .then((profile) => {
      if (useAuthStore.getState().token === token) {
        setUserInfo(profile);
      }
      return profile;
    })
    .finally(() => {
      if (pendingToken === token) {
        pendingToken = null;
        pendingProfilePromise = null;
      }
    });

  return pendingProfilePromise;
}
