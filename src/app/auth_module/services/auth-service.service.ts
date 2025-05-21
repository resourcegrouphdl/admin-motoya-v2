import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@angular/fire/auth';
import { from, map, Observable, switchMap, tap } from 'rxjs';
import { UserCacheService } from './user-cache.service';
import { UserModelResponse } from './i-user';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  _firebaseAuth = inject(Auth)
  _userCacheService = inject(UserCacheService)

  constructor() { }


  userLoginForFirebase(email: string, password: string): Observable<UserModelResponse> {
    return from(signInWithEmailAndPassword(this._firebaseAuth, email, password)).pipe(
      switchMap((userCredential) => {
        return from(userCredential.user.getIdToken()).pipe(
          map((token) => ({
            uid: userCredential.user.uid,
            email: userCredential.user.email ?? '',
            displayName: userCredential.user.displayName ?? '',
            token: token,
            providerId: userCredential.user.providerId,
            refreshToken: userCredential.user.refreshToken,
            emailVerified: userCredential.user.emailVerified.toString()
          })),
          tap((userData: UserModelResponse) => {
            this._userCacheService.setUser(userData);  // Guardar en caché
          })
        );
      })
    );
  }



  register(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this._firebaseAuth, email, password));
  }



  logout(): Observable<void> {
    return from(this._firebaseAuth.signOut());
  }


}
