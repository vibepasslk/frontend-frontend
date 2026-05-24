'use strict';

const VibePass = (() => {
  const TOKEN_KEY = 'vibepass_token';
  const USER_KEY = 'vibepass_user';
  const API_PATH_PREFIX = '/api';

  function getImportMetaApiUrl() {
    return import.meta.env?.VITE_API_URL || '';
  }

  function getConfiguredApiUrl() {
    const runtimeUrl = window.__VIBEPASS_ENV__?.VITE_API_URL || window.VITE_API_URL || window.VIBEPASS_API_URL || '';
    return String(getImportMetaApiUrl() || runtimeUrl).trim();
  }

  function normalizeApiBase(rawUrl) {
    const fallback = new URL(API_PATH_PREFIX, window.location.origin);
    const url = rawUrl ? new URL(rawUrl, window.location.origin) : fallback;
    const trimmedPath = url.pathname.replace(/\/+$/, '');
    url.pathname = trimmedPath.endsWith(API_PATH_PREFIX) ? trimmedPath : `${trimmedPath}${API_PATH_PREFIX}`;
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  }

  const API_BASE = normalizeApiBase(getConfiguredApiUrl());

  function endpointPath(path) {
    const nextPath = String(path || '').startsWith('/') ? String(path || '') : `/${path || ''}`;
    if (nextPath === API_PATH_PREFIX) return '';
    if (nextPath.startsWith(`${API_PATH_PREFIX}/`)) return nextPath.slice(API_PATH_PREFIX.length);
    return nextPath;
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch (error) {
      console.error('Stored VibePass user data is invalid:', error);
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function setSession(token, user) {
    if (!token || !user || !user.id || !user.role) {
      throw new Error('Authentication response was incomplete. Please try again.');
    }
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function normalizeAuthData(data) {
    const token = data?.token || data?.accessToken || data?.access_token;
    const user = data?.user;
    if (!token || !user) {
      throw new Error('Authentication response was incomplete. Please try again.');
    }
    return { token, user };
  }

  function parseEncodedJson(encoded) {
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function handleOAuthRedirect() {
    if (!window.location.hash) return false;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('token');
    const encodedUser = params.get('user');
    const error = params.get('error');

    if (error) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      toast('Google sign-in was cancelled or failed', 'error');
      console.error('Google sign-in failed:', error);
      return false;
    }

    if (!token || !encodedUser) return false;

    try {
      const user = parseEncodedJson(encodedUser);
      setSession(token, user);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      window.location.href = redirectForRole(user);
      return true;
    } catch (error) {
      console.error('Could not complete Google sign-in:', error);
      toast('Could not complete Google sign-in', 'error');
      return false;
    }
  }

  function logout() {
    clearSession();
    window.location.href = pagePath('login.html');
  }

  async function request(path, options = {}) {
    const headers = {
      Accept: 'application/json',
      ...(options.headers || {})
    };

    const isFormData = options.body instanceof FormData;
    const method = String(options.method || 'GET').toUpperCase();
    if (!isFormData && method !== 'GET') headers['Content-Type'] = 'application/json';

    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
      response = await fetch(`${API_BASE}${endpointPath(path)}`, {
        ...options,
        method,
        headers,
        cache: 'no-store',
        body: isFormData ? options.body : options.body ? JSON.stringify(options.body) : undefined
      });
    } catch (error) {
      console.error('VibePass API request failed:', { path, error });
      throw new Error('Cannot reach the VibePass API. Please check your connection and try again.');
    }

    const text = await response.text();
    const payload = text ? parseJsonPayload(text, response.status) : {};

    if (!response.ok || payload.success === false) {
      const message = payload.message || payload.error || `Request failed (${response.status})`;
      const error = new Error(message);
      error.status = response.status;
      error.details = payload.details || null;
      console.error('VibePass API returned an error:', { path, status: response.status, message, details: error.details });
      throw error;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'data')) return payload.data;
    return payload;
  }

  function parseJsonPayload(text, status) {
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('VibePass API returned invalid JSON:', { status, error });
      return { success: false, message: 'The API returned an invalid response. Please try again.' };
    }
  }

  async function login(email, password) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    const auth = normalizeAuthData(data);
    setSession(auth.token, auth.user);
    return auth.user;
  }

  async function signup(payload) {
    const data = await request('/api/auth/signup', {
      method: 'POST',
      body: payload
    });
    const auth = normalizeAuthData(data);
    setSession(auth.token, auth.user);
    return auth.user;
  }

  const register = signup;

  async function me() {
    const data = await request('/api/auth/me');
    if (!data.user || !data.user.role) throw new Error('Your session could not be validated.');
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  async function requireAuth(roles = []) {
    if (!getToken()) {
      window.location.href = pagePath('login.html');
      return null;
    }

    let user = null;
    try {
      user = await me();
    } catch (error) {
      console.error('Auth validation failed:', error);
      clearSession();
      window.location.href = pagePath('login.html');
      return null;
    }

    if (roles.length && !roles.includes(user.role)) {
      console.error('Unauthorized route access blocked:', { requiredRoles: roles, userRole: user.role });
      toast('You do not have access to that dashboard.', 'error');
      window.location.href = redirectForRole(user);
      return null;
    }
    return user;
  }

  function redirectForRole(user) {
    if (!user) return pagePath('login.html');
    if (user.role === 'super_admin') return pagePath('admin-dashboard.html');
    if (user.role === 'organizer') return pagePath('organizer-dashboard.html');
    if (user.role === 'staff') return pagePath('scanner.html');
    return pagePath('dashboard.html');
  }

  function pagePath(page) {
    const inPages = window.location.pathname.includes('/pages/');
    return inPages ? page : `pages/${page}`;
  }

  function toast(message, type = 'info') {
    let el = document.querySelector('.vp-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'vp-toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.dataset.type = type;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 3600);
  }

  function setFormError(form, message) {
    if (!form) return;
    let el = form.querySelector('.form-error');
    if (!message) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement('div');
      el.className = 'form-error';
      form.prepend(el);
    }
    el.textContent = message;
  }

  function setLoading(button, isLoading, label) {
    if (!button) return;
    if (isLoading) {
      button.dataset.originalText = button.textContent;
      button.textContent = label || 'Working...';
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
    }
  }

  function money(value) {
    return `LKR ${Number(value || 0).toLocaleString('en-LK')}`;
  }

  function initAuthForms() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setFormError(loginForm, '');
        const button = loginForm.querySelector('[type="submit"]');
        setLoading(button, true, 'Signing in...');
        try {
          const user = await login(loginForm.email.value.trim(), loginForm.password.value);
          toast('Signed in successfully', 'success');
          window.location.href = redirectForRole(user);
        } catch (error) {
          console.error('Login failed:', error);
          setFormError(loginForm, error.message);
          toast(error.message, 'error');
        } finally {
          setLoading(button, false);
        }
      });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setFormError(registerForm, '');
        const button = registerForm.querySelector('[type="submit"]');
        const role = document.querySelector('.role-btn.selected')?.dataset.role || new URLSearchParams(location.search).get('role') || 'customer';
        const payload = {
          name: `${registerForm.fname?.value || ''} ${registerForm.lname?.value || ''}`.trim(),
          first_name: registerForm.fname?.value,
          last_name: registerForm.lname?.value,
          email: registerForm.email.value.trim(),
          phone: registerForm.phone?.value,
          password: registerForm.password.value,
          role,
          organization_name: registerForm.orgName?.value
        };
        setLoading(button, true, 'Creating account...');
        try {
          const user = await signup(payload);
          toast('Account created', 'success');
          window.location.href = redirectForRole(user);
        } catch (error) {
          console.error('Signup failed:', error);
          setFormError(registerForm, error.message);
          toast(error.message, 'error');
        } finally {
          setLoading(button, false);
        }
      });
    }
  }

  function initNavAuth() {
    const user = getUser();
    const actions = document.querySelectorAll('.nav-actions');
    actions.forEach((el) => {
      if (!user || el.dataset.keepAuth === 'true') return;
      const dashboard = redirectForRole(user);
      el.innerHTML = `
        <a href="${dashboard}" class="btn btn-ghost">Dashboard</a>
        <button class="btn btn-primary" type="button" data-logout>Sign out</button>
      `;
    });
    document.querySelectorAll('[data-logout]').forEach((button) => {
      button.addEventListener('click', logout);
    });
  }

  function initGoogleLoginLinks() {
    document.querySelectorAll('[data-google-login]').forEach((link) => {
      link.href = `${API_BASE}/auth/google`;
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (handleOAuthRedirect()) return;
    initGoogleLoginLinks();
    initAuthForms();
    initNavAuth();
    if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service worker registration failed:', error);
      });
    }
  });

  return {
    API_BASE,
    request,
    login,
    signup,
    register,
    me,
    requireAuth,
    redirectForRole,
    getUser,
    getToken,
    setSession,
    clearSession,
    logout,
    toast,
    setFormError,
    setLoading,
    money,
    pagePath
  };
})();

window.VibePass = VibePass;
