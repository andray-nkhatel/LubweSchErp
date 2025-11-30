
import store from '@/store';

/**
 * Authentication guard for Vue Router
 * 
 * Usage in router:
 * {
 *   path: '/admin',
 *   component: AdminDashboard,
 *   meta: { 
 *     requiresAuth: true,
 *     roles: ['admin'],
 *     permissions: ['view_dashboard']
 *   }
 * }
 */
export const authGuard = async (to, from, next) => {
  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  if (!requiresAuth) {
    return next();
  }
  
  // Make sure token is valid and refresh if needed
  await store.dispatch('auth/checkTokenAndRefreshIfNeeded');
  
  // Check if user is authenticated
  const isAuthenticated = store.getters['auth/isAuthenticated'];
  const user = store.getters['auth/user'];
  
  if (!isAuthenticated) {
    // Redirect to login page with return url
    return next({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    });
  }
  
  // Check for required roles
  const requiredRoles = to.matched.reduce((roles, record) => {
    if (record.meta.roles) {
      return [...roles, ...record.meta.roles];
    }
    return roles;
  }, []);
  
  if (requiredRoles.length > 0) {
    const hasRequiredRole = store.getters['auth/hasAnyRole'](requiredRoles);
    if (!hasRequiredRole) {
      return next({ path: '/unauthorized' });
    }
  }
  
  // Check for required permissions
  const requiredPermissions = to.matched.reduce((permissions, record) => {
    if (record.meta.permissions) {
      return [...permissions, ...record.meta.permissions];
    }
    return permissions;
  }, []);
  
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = store.getters['auth/hasAnyPermission'](requiredPermissions);
    if (!hasRequiredPermission) {
      return next({ path: '/unauthorized' });
    }
  }
  
  // Optional: require being an assigned homeroom teacher
  const requiresHomeroom = to.matched.some(record => record.meta?.requiresHomeroom === true);
  if (requiresHomeroom) {
    // Ensure we have up-to-date status
    const isHomeroomTeacher = store.getters['auth/isHomeroomTeacher'];
    if (isHomeroomTeacher !== true) {
      try {
        const result = await store.dispatch('auth/checkHomeroomStatus');
        if (!result) {
          return next({ path: '/unauthorized' });
        }
      } catch (e) {
        return next({ path: '/unauthorized' });
      }
    }
  }
  
  // Note: Homeroom teacher validation is handled at component level
  // This allows for better error handling and user feedback
  
  // All checks passed, proceed to route
  next();
};

// Apply guard to router
// In your router/index.js:
// import { authGuard } from './guards/auth.guard';
// router.beforeEach(authGuard);
