import { inject, Injectable } from '@angular/core';
import { UserModelResponse } from './i-user';
import { AuthServiceService } from './auth-service.service';

@Injectable({
  providedIn: 'root'
})
export class UserCacheService {

  
  _userData: UserModelResponse | null = null;

  setUser(user: UserModelResponse): void {
    this._userData = user;
  }

  getUser(): UserModelResponse | null {
    return this._userData;
  }

  clearUser(): void {
    this._userData = null;
  }

  isAuthenticated(): boolean {
    return !!this._userData?.token;
  }
}
