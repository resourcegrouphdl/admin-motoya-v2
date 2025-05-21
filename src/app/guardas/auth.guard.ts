import { CanActivateFn, Router } from '@angular/router';
import { UserCacheService } from '../auth_module/services/user-cache.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {

  const userCache = inject(UserCacheService);
  const router = inject(Router);

  if (userCache.isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
