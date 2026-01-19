// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock browser APIs
if (typeof global.URL !== 'undefined') {
  global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost:3000/mock-blob-url')
  global.URL.revokeObjectURL = jest.fn()
} else {
  global.URL = {
    createObjectURL: jest.fn(() => 'blob:http://localhost:3000/mock-blob-url'),
    revokeObjectURL: jest.fn(),
  }
}

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
})

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Supabase client
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        remove: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  })),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.ASSEMBLYAI_API_KEY = 'test-assemblyai-key'
process.env.OPENROUTER_API_KEY = 'test-openrouter-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Mock Next.js NextResponse - properly handle it for tests
// Note: Next.js 14 provides NextResponse in tests, but we need to ensure it works
// The actual NextResponse.json should work, but if tests fail, we'll handle it

// Mock Request/Response globals for API route tests
if (typeof global.Request === 'undefined') {
  global.Request = class MockRequest {
    constructor(input, init) {
      this.url = typeof input === 'string' ? input : input.url
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers || {})
      this.body = init?.body || null
      this.json = async () => {
        if (this.body && typeof this.body === 'string') {
          return JSON.parse(this.body)
        }
        return {}
      }
      this.formData = async () => {
        return this.body
      }
      this.text = async () => {
        return typeof this.body === 'string' ? this.body : ''
      }
    }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class MockResponse {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.headers = new Headers(init?.headers || {})
      this.ok = this.status >= 200 && this.status < 300
    }
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
    }
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    }
  }
}

if (typeof global.FormData === 'undefined') {
  global.FormData = class MockFormData {
    constructor() {
      this.data = new Map()
    }
    append(key, value) {
      this.data.set(key, value)
    }
    get(key) {
      return this.data.get(key)
    }
    entries() {
      return this.data.entries()
    }
  }
}
