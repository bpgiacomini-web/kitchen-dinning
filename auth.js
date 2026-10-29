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

function message(text, error = false) {
  authStatus.textContent = text;
  authStatus.style.color = error ? '#ffb4a9' : '#cdebd5';
}
function setMode(next) {
  mode = next;
  document.getElementById('metroAuthHeading').textContent = mode === 'signin' ? 'Welcome back' : 'Create your account';
  authSubmit.textContent = mode === 'signin' ? 'Sign In' : 'Create Account';
  document.getElementById('metroAuthNameWrap').hidden = mode === 'signin';
  document.getElementById('metroAuthConfirmWrap').hidden = mode === 'signin';
  authModeButton.textContent = mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in';
  message('');
}
authModeButton.addEventListener('click', () => setMode(mode === 'signin' ? 'signup' : 'signin'));

const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  if (accessToken && new URL(url, location.href).origin === location.origin &&
      new URL(url, location.href).pathname === '/api/data') {
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('Authorization', 'Bearer ' + accessToken);
    init = { ...init, headers, cache: 'no-store' };
  }
  return nativeFetch(input, init);
};

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
    const configResponse = await nativeFetch('/api/auth-config', { cache: 'no-store' });
    const config = await configResponse.json();
    if (!config.authUrl) throw new Error('The preview auth URL is not configured in Vercel.');
    const { createAuthClient } = await import('https://esm.sh/@neondatabase/auth@latest');
    authClient = createAuthClient(config.authUrl);
    const result = await authClient.getSession();
    const session = result?.data?.session;
    const user = result?.data?.user || session?.user;
    if (session?.access_token && user) {
      accessToken = session.access_token;
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
    message('Sign-in setup could not start: ' + (error?.message || 'check preview configuration'), true);
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
  if (password.length < 8) return message('Use a password with at least 8 characters.', true);
  authSubmit.disabled = true;
  message(mode === 'signin' ? 'Signing in…' : 'Creating your account…');
  try {
    const result = mode === 'signin'
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ email, password, name: name || email.split('@')[0] });
    if (result?.error) throw new Error(result.error.message || 'Authentication failed.');
    const sessionResult = await authClient.getSession();
    const session = sessionResult?.data?.session || result?.data?.session;
    const user = sessionResult?.data?.user || result?.data?.user || session?.user;
    if (!session?.access_token || !user) {
      message('Account request submitted. If email verification is enabled, check your inbox, then sign in.', false);
      if (mode === 'signup') setMode('signin');
      return;
    }
    accessToken = session.access_token;
    await startApp(user);
  } catch (error) {
    message(error?.message || 'Could not sign in. Check your details and try again.', true);
  } finally {
    authSubmit.disabled = false;
  }
});

boot();
