# Signal

A lightweight, modern web framework built on Web Standards. Signal uses the native Fetch API and comes with built-in Zod validation, CORS support, and an intuitive routing system.

## Features

- **Web Standards** - Built on top of the standard Fetch API
- **Type Safe** - Full TypeScript support out of the box
- **Built-in Validation** - Easy request validation using Zod schemas
- **CORS Support** - Configure CORS with a simple method call
- **Cookie Management** - Set, get, and clear cookies easily
- **Middleware Support** - Global and route-level middleware
- **Dynamic Routing** - Support for URL parameters
- **Clean API** - Simple and intuitive methods for building APIs

## Installation

```bash
npm install @yourusername/signal
```

## Quick Start

```typescript
import { Signal } from '@signal';

const app = new Signal();

// Simple GET route
app.router().GET('/', async (c) => {
  return c.res.json({ message: 'Hello World!' });
});

// Route with parameters
app.router().GET('/users/:id', async (c) => {
  const userId = c.req.params.id;
  return c.res.json({ userId });
});

// POST route with validation
import { z } from 'zod';

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

app.router().POST('/users', app.validate(userSchema), async (c) => {
  const user = c.req.body; // validated data
  return c.res.status(201).json({ user });
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## Middleware

```typescript
// Global middleware
app.use(async (c, next) => {
  console.log(`${c.req.method} ${c.req.path}`);
  await next();
});

// Path-specific middleware
app.use('/api', async (c, next) => {
  // runs for all /api/* routes
  await next();
});
```

## CORS

```typescript
app.cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Content-Type', 'Authorization'],
  credentials: true,
});
```

## Cookies

```typescript
// Set a cookie
app.router().GET('/set-cookie', async (c) => {
  c.res.cookie('session', 'abc123', {
    httpOnly: true,
    secure: true,
    maxAge: 3600,
  });
  return c.res.text('Cookie set');
});

// Get a cookie
app.router().GET('/get-cookie', async (c) => {
  const session = c.req.cookie('session');
  return c.res.json({ session });
});

// Clear a cookie
app.router().GET('/clear-cookie', async (c) => {
  c.res.clearCookie('session');
  return c.res.text('Cookie cleared');
});
```

## Error Handling

```typescript
app.onError((err, c) => {
  console.error(err);
  return c.res.status(500).json({ 
    error: 'Something went wrong' 
  });
});
```

## Request Logging

```typescript
app.logRequests(); // Toggle request logging
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
