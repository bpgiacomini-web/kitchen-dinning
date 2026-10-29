const loginPanel = document.getElementById('metroAuthPanel');
const appRoot = document.querySelector('.app');
const bottomNav = document.getElementById('bottomNav');
const authStatus = document.getElementById('metroAuthStatus');
const authForm = document.getElementById('metroAuthForm');
const authModeButton = document.getElementById('metroAuthMode');
const authSubmit = document.getElementById('metroAuthSubmit');
let mode = 'signin';
let authClient;
let accessToken = '';
let appStarted = false;
let lastAuthFailure = '';
let bootStage = 'starting';

function message(text, error = false) {
  authStatus.textContent = text;
  authStatus.style.color = error ? '#ffb4a9' : '#cdebd5';
}
const authForgotButton = document.createElement('button');
authForgotButton.type = 'button';
authForgotButton.textContent = 'Forgot your password?';
authForgotButton.style.cssText = 'display:block;margin:4px auto 0;padding:8px;border:0;background:transparent;color:#e7c17a;font:inherit';
authModeButton.insertAdjacentElement('afterend', authForgotButton);

function setMode(next) {
  mode = next;
  const heading = document.getElementById('metroAuthHeading');
  const nameWrap = document.getElementById('metroAuthNameWrap');
  const confirmWrap = document.getElementById('metroAuthConfirmWrap');
  const emailInput = document.getElementById('metroAuthEmail');
  const passwordInput = document.getElementById('metroAuthPassword');
  const passwordLabel = passwordInput.closest('label');
  heading.textContent = ({signin:'Welcome back', signup:'Create your account', forgot:'Reset your password', reset:'Choose a new password'})[mode] || 'Welcome back';
  authSubmit.textContent = ({signin:'Sign In', signup:'Create Account', forgot:'Email Me a Reset Link', reset:'Save New Password'})[mode] || 'Sign In';
  nameWrap.hidden = mode !== 'signup';
  confirmWrap.hidden = !['signup','reset'].includes(mode);
  passwordLabel.hidden = mode === 'forgot';
  passwordInput.required = mode !== 'forgot';
  emailInput.closest('label').hidden = mode === 'reset';
  emailInput.required = mode !== 'reset';
  passwordInput.autocomplete = mode === 'reset' || mode === 'signup' ? 'new-password' : 'current-password';
  authModeButton.hidden = mode === 'reset';
  authForgotButton.hidden = mode !== 'signin';
  authModeButton.textContent = mode === 'signin' ? 'Need an account? Create one' : mode === 'signup' ? 'Already have an account? Sign in' : 'Back to Sign In';
  message('');
}
authModeButton.addEventListener('click', () => setMode(mode === 'signin' ? 'signup' : 'signin'));
authForgotButton.addEventListener('click', () => setMode('forgot'));

const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  if (accessToken && new URL(url, location.href).origin === location.origin &&
      new URL(url, location.href).pathname === '/api/data') {
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('Authorization', 'Bearer ' + accessToken);
    init = { ...init, headers, cache: 'no-store' };
  }
  const response = await nativeFetch(input, init);
  try {
    const requestUrl = new URL(url, location.href);
    if (!response.ok) {
      const detail = await response.clone().text();
      lastAuthFailure = requestUrl.host + requestUrl.pathname + ' → HTTP ' + response.status + (detail ? ' — ' + detail.slice(0, 180) : '');
    }
  } catch (_) {}
  return response;
};

async function getUsableSession() {
  const result = await authClient.getSession();
  const session = result?.data?.session;
  const user = result?.data?.user || session?.user;
  let token = session?.access_token || '';
  if (!token && typeof authClient.getJWTToken === 'function') {
    const tokenResult = await authClient.getJWTToken();
    token = typeof tokenResult === 'string' ? tokenResult : (tokenResult?.data?.token || tokenResult?.token || '');
  }
  return { session, user, token };
}

async function startApp(user) {
  if (appStarted) return;
  appStarted = true;
  const userId = String(user.id || user.sub || '');
  if (!userId) throw new Error('The sign-in response did not include a user ID.');
  window.METRO_EATS_STORAGE_KEY = 'metro_eats_user_' + userId;
  loginPanel.hidden = true;
  appRoot.hidden = false;
  bottomNav.hidden = false;
  const existing = document.querySelector('script[data-metro-app]');
  if (!existing) {
    const script = document.createElement('script');
    script.src = './app.js?v=20261029-auth-1';
    script.defer = true;
    script.dataset.metroApp = 'true';
    document.body.appendChild(script);
  }
  message('Signed in. Loading your private Metro Eats data…');
  try {
const response = await nativeFetch('/api/data?initial=' + Date.now(), {
      headers: { Authorization: 'Bearer ' + accessToken },
      cache: 'no-store'
    });
    if (response.ok) {
      const cloud = await response.json();
      const key = window.METRO_EATS_STORAGE_KEY;
      const local = JSON.parse(localStorage.getItem(key) || '{"recipes":[],"restaurants":[],"cats":[]}');
      const mapById = (a, b) => {
        const map = new Map((a || []).filter(x => x && x.id).map(x => [String(x.id), x]));
        (b || []).forEach(x => { if (x && x.id) map.set(String(x.id), x); });
        return [...map.values()];
      };
      const merged = {
        recipes: mapById(local.recipes, cloud.recipes),
        restaurants: mapById(local.restaurants, cloud.restaurants),
        cats: cloud.cats?.length ? cloud.cats : (local.cats || [])
      };
      localStorage.setItem(key, JSON.stringify(merged));
      window.db = merged;
      window.metroEatsCloudStatus = 'saved';
      const status = document.getElementById('metroCloudStatus');
      if (status) status.textContent = 'Cloud backup: signed in — personal account storage connected';
      if (typeof window.renderRecipes === 'function') window.renderRecipes();
      if (typeof window.renderRestaurants === 'function') window.renderRestaurants();
    } else if (response.status === 503) {
      const detail = await response.json().catch(() => ({}));
      message(detail.error || 'Preview database setup is incomplete.', true);
      const status = document.getElementById('metroCloudStatus');
      if (status) status.textContent = 'Cloud storage needs preview database configuration';
    } else if (response.status === 401) {
      message('Your session needs refreshing. Please sign in again.', true);
    } else {
      message('Your account is signed in, but the preview data could not be loaded.', true);
    }
  } catch (e) {
    message('Signed in, but data loading failed. Your local account data has not been deleted.', true);
  }
}

async function boot() {
  try {
    bootStage = 'loading preview auth configuration';
    const configResponse = await nativeFetch('/api/auth-config', { cache: 'no-store' });
    const config = await configResponse.json();
    if (!config.authUrl) throw new Error('The preview auth URL is not configured in Vercel.');
    bootStage = 'loading Neon Auth SDK';
    const { createAuthClient } = await import('https://esm.sh/@neondatabase/auth@latest');
    bootStage = 'initializing Neon Auth client';
    authClient = createAuthClient(String(config.authUrl).replace(/\/$/, ''));
    bootStage = 'checking existing sign-in session';
    const { session, user, token } = await getUsableSession();
    const params = new URLSearchParams(location.search);
    if (params.has('token') || params.has('error')) {
      loginPanel.hidden = false;
      appRoot.hidden = true;
      bottomNav.hidden = true;
      if (params.has('token')) setMode('reset');
      else {
        setMode('signin');
        message('That password-reset link is invalid or expired. Request a new one.', true);
      }
    } else if (token && user) {
      accessToken = token;
      await startApp(user);
    } else {
      loginPanel.hidden = false;
      appRoot.hidden = true;
      bottomNav.hidden = true;
    }
  } catch (error) {
    loginPanel.hidden = false;
    appRoot.hidden = true;
    bottomNav.hidden = true;
    message('Sign-in setup failed while ' + bootStage + ': ' + (error?.message || 'check preview configuration') + (lastAuthFailure ? ' | Request: ' + lastAuthFailure : ''), true);
  }
}

authForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!authClient) return message('Sign-in is still initializing. Please try again in a moment.', true);
  const email = document.getElementById('metroAuthEmail').value.trim();
  const password = document.getElementById('metroAuthPassword').value;
  const name = document.getElementById('metroAuthName').value.trim();
  const confirm = document.getElementById('metroAuthConfirm').value;
  if (mode === 'signup' && password !== confirm) return message('The passwords do not match.', true);
  if (mode !== 'forgot' && password.length < 8) return message('Use a password with at least 8 characters.', true);
  authSubmit.disabled = true;
  message(mode === 'signin' ? 'Signing in…' : mode === 'signup' ? 'Creating your account…' : mode === 'forgot' ? 'Requesting a reset link…' : 'Updating your password…');
  try {
    if (mode === 'forgot') {
      if (typeof authClient.requestPasswordReset !== 'function') {
        throw new Error('Password recovery is not available on this authentication service yet. The account was not changed.');
      }
      const resetResult = await authClient.requestPasswordReset({
        email,
        redirectTo: location.origin + location.pathname
      });
      if (resetResult?.error) throw new Error(resetResult.error.message || 'The reset email could not be requested.');
      message('If an account exists for that email and password recovery is enabled, a reset link will be sent. Check your inbox and spam folder.');
      authForm.reset();
      return;
    }
    if (mode === 'reset') {
      const token = new URLSearchParams(location.search).get('token');
      if (!token) throw new Error('This reset link is missing its token. Request a new password reset link.');
      if (password !== confirm) throw new Error('The passwords do not match.');
      if (typeof authClient.resetPassword !== 'function') throw new Error('Password reset is not supported by this authentication service.');
      const resetResult = await authClient.resetPassword({ newPassword: password, token });
      if (resetResult?.error) throw new Error(resetResult.error.message || 'The reset link may have expired. Request a new one.');
      history.replaceState({}, document.title, location.pathname);
      authForm.reset();
      setMode('signin');
      message('Your password was changed. Sign in using your new password.');
      return;
    }
    const result = mode === 'signin'
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ email, password, name: name || email.split('@')[0] });
    if (result?.error) {
      const detail = result.error.message || result.error.statusText || 'Authentication failed.';
      const lower = detail.toLowerCase();
      if (mode === 'signup' && /already|exist|registered|duplicate/.test(lower)) {
        throw new Error('This email already has an account. Switch to Sign In, or choose “Forgot your password?” to recover access. No new account was created.');
      }
      if (mode === 'signin' && /invalid|credential|password|unauthorized/.test(lower)) {
        throw new Error('The email/password combination was not accepted. Check the email, or use “Forgot your password?” to reset the password. Details: ' + detail);
      }
      throw new Error(detail);
    }
    const { session, user: sessionUser, token } = await getUsableSession();
    const resolvedUser = sessionUser || result?.data?.user || session?.user;
    if (!token || !resolvedUser) {
      if (mode === 'signup') {
        setMode('signin');
        message('The signup request was accepted, but Metro Eats did not receive an active session. Try signing in with the same email and password. Do not create another account.', true);
      } else {
        message('Sign-in did not return an active session. Please try again. If this continues, we need to inspect the Neon session response.', true);
      }
      return;
    }
    accessToken = token;
    await startApp(resolvedUser);
  } catch (error) {
    message(error?.message || 'Could not sign in. Check your details and try again.', true);
  } finally {
    authSubmit.disabled = false;
  }
});

boot();