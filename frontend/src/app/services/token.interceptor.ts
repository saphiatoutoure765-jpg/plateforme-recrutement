import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = localStorage.getItem('token');

  req = req.clone({
    setHeaders: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return next(req).pipe(
    catchError((e: HttpErrorResponse) => {
      const routeAuth = req.url.endsWith('/login') || req.url.endsWith('/register');
      if (e.status === 401 && token && !routeAuth) {
        auth.expirerSession();
      }
      return throwError(() => e);
    }),
  );
};
