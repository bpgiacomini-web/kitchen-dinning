export function recoveryContext(href) {
  const url = new URL(href);
  const token = url.searchParams.get('token') || '';
  const invalid = url.searchParams.has('error') || token.length > 2048 || /[\s\x00-\x1f]/.test(token);
  return { token: invalid ? '' : token, invalid, cleanPath: url.pathname };
}

export function validateNewPassword(password, confirmation) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw Error('Choose a password between 8 and 128 characters.');
  if (password !== confirmation) throw Error('The passwords do not match.');
}

async function authRequest(fetcher, route, payload) {
  let response;
  try {
    response = await fetcher('/api/auth/' + route, {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
    });
  } catch { throw Error('The account service could not be reached. Please try again.'); }
  if (response.status === 429) throw Error('Too many attempts. Please wait before trying again.');
  if (!response.ok) {
    if (route === 'reset-password' && [400, 401, 403, 422].includes(response.status)) throw Error('This reset link is invalid or expired, or the new password was not accepted. Request a new link or choose a different password.');
    throw Error('The account service could not complete this request. Please try again later.');
  }
}

export async function requestPasswordReset(fetcher, { email, origin }) {
  email = String(email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw Error('Enter a valid email address.');
  const site = new URL(origin);
  if (site.protocol !== 'https:' && !(site.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(site.hostname))) throw Error('Open Metro Eats using its secure site address.');
  // The callback is always on the current site, never taken from query input.
  await authRequest(fetcher, 'request-password-reset', { email, redirectTo: site.origin + '/architecture-v2/reset-password.html' });
  return 'If an account exists for that email, a reset link has been requested. Check your inbox and spam folder.';
}

export async function resetPassword(fetcher, { token, password, confirmation }) {
  if (!token || token.length > 2048 || /[\s\x00-\x1f]/.test(token)) throw Error('This reset link is missing or invalid. Request a new link.');
  validateNewPassword(password, confirmation);
  await authRequest(fetcher, 'reset-password', { token, newPassword: password });
}

export function mountPasswordRecovery({ document, location, history, fetcher }) {
  const context = recoveryContext(location.href);
  // Keep the one-time token only in this closure, not in navigation history,
  // storage, analytics, provider error messages, or subsequent referrers.
  if (new URL(location.href).search || new URL(location.href).hash) history.replaceState(null, '', context.cleanPath);
  let token = context.token;
  const get = id => document.getElementById(id);
  const requestForm = get('recovery-request'), resetForm = get('recovery-reset');
  const status = get('recovery-status'), another = get('recovery-another');
  const password = get('recovery-password'), confirmation = get('recovery-confirm');
  const resetMode = !!token && !context.invalid;
  requestForm.hidden = resetMode; resetForm.hidden = !resetMode;
  get('recovery-title').textContent = resetMode ? 'Choose a new password' : 'Forgot password?';
  get('recovery-description').textContent = resetMode ? 'Choose a password with 8–128 characters. You will sign in again after saving it.' : 'Enter your account email to request a password reset link.';
  if (context.invalid) status.textContent = 'This reset link is invalid or expired. Request a new link below.';
  let busy = false, nextRequestAt = 0;
  requestForm.addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    if (Date.now() < nextRequestAt) { status.textContent = 'Please wait a minute before requesting another link.'; return; }
    const button = requestForm.querySelector('button');
    busy = true; button.disabled = true; status.textContent = 'Requesting reset link…';
    try {
      status.textContent = await requestPasswordReset(fetcher, { email: get('recovery-email').value, origin: location.origin });
      nextRequestAt = Date.now() + 60000;
    } catch (error) { status.textContent = error.message; }
    finally { busy = false; button.disabled = false; }
  });
  resetForm.addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    try { validateNewPassword(password.value, confirmation.value); }
    catch (error) { status.textContent = error.message; return; }
    const button = resetForm.querySelector('button');
    busy = true; button.disabled = true; status.textContent = 'Saving new password…';
    try {
      await resetPassword(fetcher, { token, password: password.value, confirmation: confirmation.value });
      token = ''; resetForm.hidden = true;
      status.textContent = 'Your password has been updated. Use Back to sign in with your new password.';
    } catch (error) { status.textContent = error.message; another.hidden = false; }
    finally { password.value = ''; confirmation.value = ''; busy = false; button.disabled = false; }
  });
}

if (typeof document !== 'undefined' && document.getElementById('recovery-request')) {
  mountPasswordRecovery({ document, location: window.location, history: window.history, fetcher: window.fetch.bind(window) });
}
