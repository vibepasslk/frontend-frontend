'use strict';

const VibePass = (() => {
  function defaultApiBase() {
    const host = window.location.hostname;
    if (host === 'vibepass.lk' || host === 'www.vibepass.lk' || host.endsWith('.vercel.app')) {
      return 'https://api.vibepass.lk/api';
    }
    return 'http://localhost:5000/api';
  }

  const API_BASE = window.VIBEPASS_API_BASE || localStorage.getItem('vibepass_api_base') || defaultApiBase();
  const TOKEN_KEY = 'vibepass_token';
  const USER_KEY = 'vibepass_user';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch (_error) {
      return null;
    }
  }

  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
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
      return false;
    }

    if (!token || !encodedUser) return false;

    try {
      const user = parseEncodedJson(encodedUser);
      setSession(token, user);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      window.location.href = redirectForRole(user);
      return true;
    } catch (_error) {
      toast('Could not complete Google sign-in', 'error');
      return false;
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = pagePath('login.html');
  }

  async function request(path, options = {}) {
    const headers = {
      Accept: 'application/json',
      ...(options.headers || {})
    };

    const isFormData = options.body instanceof FormData;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      body: isFormData ? options.body : options.body ? JSON.stringify(options.body) : undefined
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || `Request failed (${response.status})`);
    }
    return payload.data;
  }

  async function login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    setSession(data.token, data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: payload
    });
    setSession(data.token, data.user);
    return data.user;
  }

  async function me() {
    const data = await request('/auth/me');
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  async function requireAuth(roles = []) {
    if (!getToken()) {
      window.location.href = pagePath('login.html');
      return null;
    }

    const user = await me().catch(() => {
      logout();
      return null;
    });

    if (!user) return null;
    if (roles.length && !roles.includes(user.role)) {
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
    el._timer = setTimeout(() => el.classList.remove('show'), 3200);
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
        const button = loginForm.querySelector('[type="submit"]');
        setLoading(button, true, 'Signing in...');
        try {
          const user = await login(loginForm.email.value, loginForm.password.value);
          toast('Signed in successfully', 'success');
          window.location.href = redirectForRole(user);
        } catch (error) {
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
        const button = registerForm.querySelector('[type="submit"]');
        const role = document.querySelector('.role-btn.selected')?.dataset.role || new URLSearchParams(location.search).get('role') || 'customer';
        const payload = {
          name: `${registerForm.fname?.value || ''} ${registerForm.lname?.value || ''}`.trim(),
          first_name: registerForm.fname?.value,
          last_name: registerForm.lname?.value,
          email: registerForm.email.value,
          phone: registerForm.phone?.value,
          password: registerForm.password.value,
          role,
          organization_name: registerForm.orgName?.value
        };
        setLoading(button, true, 'Creating account...');
        try {
          const user = await register(payload);
          toast('Account created', 'success');
          window.location.href = redirectForRole(user);
        } catch (error) {
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
      navigator.serviceWorker.register('/sw.js').catch(() => null);
    }
  });

  return {
    API_BASE,
    request,
    login,
    register,
    me,
    requireAuth,
    redirectForRole,
    getUser,
    getToken,
    setSession,
    logout,
    toast,
    setLoading,
    money,
    pagePath
  };
})();
