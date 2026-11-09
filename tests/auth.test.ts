import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// 1. FRONTEND FORM VALIDATION LOGIC (Unit Tests)
// ============================================================================

export function validateLoginForm(email: string, password: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return 'Please enter a valid email address.';
  }
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  return null;
}

export function validateSignupForm(
  fullName: string,
  businessName: string,
  email: string,
  password: string,
  confirmPassword: string
): string | null {
  if (!fullName.trim()) {
    return 'Please enter your full name.';
  }
  if (!businessName.trim()) {
    return 'Please enter your business or workspace name.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return 'Please enter a valid email address.';
  }
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
}

describe('Frontend Auth Form Validation', () => {
  it('Login form rejects an invalid email and a short password', () => {
    expect(validateLoginForm('not-an-email', '12345678')).toBe('Please enter a valid email address.');
    expect(validateLoginForm('user@example', '12345678')).toBe('Please enter a valid email address.');
    expect(validateLoginForm('user@example.com', 'short')).toBe('Password must be at least 8 characters long.');
    expect(validateLoginForm('user@example.com', 'validpassword123')).toBeNull();
  });

  it('Signup form requires matching passwords', () => {
    expect(
      validateSignupForm('Alex Mercer', 'CloudCorp', 'alex@cloudcorp.com', 'password123', 'password999')
    ).toBe('Passwords do not match.');

    expect(
      validateSignupForm('Alex Mercer', 'CloudCorp', 'alex@cloudcorp.com', 'password123', 'password123')
    ).toBeNull();
  });

  it('Signup form rejects missing full name or business name', () => {
    expect(
      validateSignupForm('', 'CloudCorp', 'alex@cloudcorp.com', 'password123', 'password123')
    ).toBe('Please enter your full name.');

    expect(
      validateSignupForm('Alex Mercer', '   ', 'alex@cloudcorp.com', 'password123', 'password123')
    ).toBe('Please enter your business or workspace name.');
  });
});

// ============================================================================
// 2. ROUTE GUARD & API CLIENT BEHAVIOR
// ============================================================================

describe('Route Guard & Token Handling', () => {
  it('ProtectedRoute logic determines redirect when there is no session', () => {
    const checkProtectedRoute = (user: any, session: any) => {
      if (!session && !user) {
        return { shouldRedirect: true, destination: '/login' };
      }
      return { shouldRedirect: false, destination: null };
    };

    expect(checkProtectedRoute(null, null)).toEqual({
      shouldRedirect: true,
      destination: '/login',
    });

    expect(checkProtectedRoute({ id: 'u1' }, { access_token: 'token123' })).toEqual({
      shouldRedirect: false,
      destination: null,
    });
  });

  it('apiClient does not attach a demo token in production mode', async () => {
    // Pure function mimicking apiClient's token resolver
    const resolveToken = (hasLiveSession: boolean, liveToken: string | null, isDev: boolean) => {
      if (hasLiveSession && liveToken) {
        return liveToken;
      }
      if (!isDev) {
        return null;
      }
      return 'demo.eyJzdWIiOiJkZW1vLXVzZXIifQ.demo';
    };

    // In production without live session: token MUST be null
    const prodToken = resolveToken(false, null, false);
    expect(prodToken).toBeNull();

    // In dev without live session: fallback demo token returned
    const devToken = resolveToken(false, null, true);
    expect(devToken).toContain('demo.');

    // In production with live session: authentic token returned
    const liveToken = resolveToken(true, 'supabase.live.jwt', false);
    expect(liveToken).toBe('supabase.live.jwt');
  });
});

// ============================================================================
// 3. SERVER AUTH MIDDLEWARE LOGIC (Unit & Integration tests)
// ============================================================================

interface MockRequest {
  headers: Record<string, string>;
  body?: any;
  query?: any;
  userId?: string;
  userEmail?: string;
  businessId?: string;
}

interface MockResponse {
  statusCode: number;
  jsonBody: any;
  status: (code: number) => MockResponse;
  json: (body: any) => MockResponse;
}

function createMockRes(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    jsonBody: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: any) {
      this.jsonBody = body;
      return this;
    },
  };
  return res;
}

// Server authentication middleware logic under test
function executeAuthMiddleware(
  req: MockRequest,
  res: MockResponse,
  isProduction: boolean,
  verifiedUser: { id: string; email: string; businessId: string } | null
): boolean {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header.' });
    return false;
  }

  const token = authHeader.slice(7).trim();

  // Demo token rejection in production
  if (token.startsWith('demo.')) {
    if (isProduction) {
      res.status(401).json({ error: 'Demo token is not permitted in production mode.' });
      return false;
    }
    req.userId = 'demo-user';
    req.businessId = 'biz_demo_01';
    return true;
  }

  // Malformed token rejection
  const parts = token.split('.');
  if (parts.length !== 3) {
    res.status(401).json({ error: 'Invalid token structure.' });
    return false;
  }

  if (!verifiedUser) {
    res.status(401).json({ error: 'Invalid or expired token.' });
    return false;
  }

  req.userId = verifiedUser.id;
  req.userEmail = verifiedUser.email;
  req.businessId = verifiedUser.businessId;

  // Multi-tenant check: if request asks for a business user does not belong to
  const requestedBusinessId = req.body?.business_id || req.headers['x-business-id'];
  if (requestedBusinessId && requestedBusinessId !== verifiedUser.businessId) {
    res.status(403).json({ error: 'Forbidden: You do not have access to the requested business.' });
    return false;
  }

  return true;
}

describe('Server Authentication & Multi-Tenant Enforcement', () => {
  it('A request without a token returns 401', () => {
    const req: MockRequest = { headers: {} };
    const res = createMockRes();
    const passed = executeAuthMiddleware(req, res, true, null);

    expect(passed).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.jsonBody.error).toBe('Missing or malformed Authorization header.');
  });

  it('A request with a malformed token returns 401', () => {
    const req: MockRequest = { headers: { authorization: 'Bearer not-a-valid-jwt-token' } };
    const res = createMockRes();
    const passed = executeAuthMiddleware(req, res, true, null);

    expect(passed).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.jsonBody.error).toBe('Invalid token structure.');
  });

  it('The demo token returns 401 when NODE_ENV=production', () => {
    const req: MockRequest = { headers: { authorization: 'Bearer demo.header.payload.signature' } };
    const res = createMockRes();
    const passed = executeAuthMiddleware(req, res, true, null);

    expect(passed).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.jsonBody.error).toBe('Demo token is not permitted in production mode.');
  });

  it('The demo token is allowed only when NOT in production', () => {
    const req: MockRequest = { headers: { authorization: 'Bearer demo.header.payload.signature' } };
    const res = createMockRes();
    const passed = executeAuthMiddleware(req, res, false, null);

    expect(passed).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(req.userId).toBe('demo-user');
  });

  it('A request with a valid token for a business the user does not belong to returns 403', () => {
    const req: MockRequest = {
      headers: {
        authorization: 'Bearer header.payload.signature',
        'x-business-id': 'biz_tenant_b',
      },
      body: { business_id: 'biz_tenant_b' },
    };
    const res = createMockRes();
    const verifiedUser = {
      id: 'usr_user_a',
      email: 'user_a@company.com',
      businessId: 'biz_tenant_a', // User belongs to tenant A, but requested tenant B
    };

    const passed = executeAuthMiddleware(req, res, true, verifiedUser);

    expect(passed).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.jsonBody.error).toBe('Forbidden: You do not have access to the requested business.');
  });

  it('A request with a valid token for the user own business succeeds', () => {
    const req: MockRequest = {
      headers: {
        authorization: 'Bearer header.payload.signature',
        'x-business-id': 'biz_tenant_a',
      },
      body: { business_id: 'biz_tenant_a' },
    };
    const res = createMockRes();
    const verifiedUser = {
      id: 'usr_user_a',
      email: 'user_a@company.com',
      businessId: 'biz_tenant_a',
    };

    const passed = executeAuthMiddleware(req, res, true, verifiedUser);

    expect(passed).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(req.businessId).toBe('biz_tenant_a');
  });
});
