import React, { createContext, useState, useContext, useEffect } from 'react';
import { appParams } from '@/lib/app-params';

const AuthContext = createContext();

const publicPreviewPaths = [
  '/',
  '/ProgramHelper',
  '/Home',
  '/About',
  '/Dashboard',
  '/WorkspaceSetup',
  '/HowItWorks',
  '/Integrations',
  '/Settings',
  '/Proof',
  '/field-proof-week1',
  '/FieldProofWeek1',
  '/Docs',
];

function isPublicPreviewPath(pathname) {
  return publicPreviewPaths.includes(pathname) || pathname.startsWith('/Packages/') || pathname.startsWith('/Docs/');
}

function isLocalPreviewHost() {
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

function getRecordList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.records)) return response.records;
  return [];
}

async function enrichUserFromAppRecord(base44, currentUser) {
  const email = currentUser?.email;
  if (!email) return currentUser;

  try {
    const matchingUsers = await base44.entities.User.filter({ email }, "-updated_date", 5);
    const normalizedEmail = String(email).toLowerCase();
    const appUser =
      getRecordList(matchingUsers).find((record) => String(record?.email || "").toLowerCase() === normalizedEmail) ||
      getRecordList(matchingUsers)[0];

    if (!appUser) return currentUser;

    return {
      ...currentUser,
      app_user_id: currentUser.app_user_id || appUser.id,
      app_user_role: currentUser.app_user_role || appUser.role,
      portal_role: currentUser.portal_role || appUser.portal_role || appUser.role,
      role: currentUser.role || appUser.role,
      metadata: {
        ...(currentUser.metadata || {}),
        app_user_role: currentUser.metadata?.app_user_role || appUser.role,
      },
    };
  } catch (_error) {
    return currentUser;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      const previewPath = isPublicPreviewPath(window.location.pathname);
      if (previewPath && isLocalPreviewHost()) {
        setAppPublicSettings({
          id: appParams.appId || 'canonical_program_helper_preview',
          public_settings: { auth_required: false }
        });
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setIsLoadingPublicSettings(false);
        return;
      }
      
      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      const { createAxiosClient } = await import('@base44/sdk/dist/utils/axios-client');
      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId
        },
        token: appParams.token, // Include token if available
        interceptResponses: true
      });
      
      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);
        const authRequired = Boolean(
          publicSettings?.public_settings?.auth_required ?? publicSettings?.auth_required,
        );
        
        // If we got the app public settings successfully, check if user is authenticated
        if (appParams.token) {
          await checkUserAuth();
        } else if (authRequired) {
          setAuthError({
            type: 'auth_required',
            message: 'Authentication required'
          });
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        
        // Handle app-level errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const { base44 } = await import('@/api/base44Client');
      const currentUser = await base44.auth.me();
      const enrichedUser = await enrichUserFromAppRecord(base44, currentUser);
      setUser(enrichedUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      
      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      import('@/api/base44Client').then(({ base44 }) => base44.auth.logout(window.location.href));
    } else {
      // Just remove the token without redirect
      import('@/api/base44Client').then(({ base44 }) => base44.auth.logout());
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    import('@/api/base44Client').then(({ base44 }) => base44.auth.redirectToLogin(window.location.href));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
