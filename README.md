# Uptraa Backend - Microservices Architecture

A Node.js microservices backend built with TypeScript and Express.

## 📁 Project Structure

```
backend/
├── auth/          # Authentication service
├── user/          # User service
└── .gitignore     # Git ignore rules for all services
```

## 🛠️ Technology Stack

- **Runtime**: Node.js with ES Modules
- **Language**: TypeScript
- **Framework**: Express.js
- **Package Manager**: npm

## 🚀 Getting Started

### Prerequisites

- Node.js v22.16.0
- npm

### Setting Up a New Service

1. Create a new directory for your service:

   ```bash
   mkdir <service-name>
   cd <service-name>
   ```

2. Initialize the project:

   ```bash
   npm init -y
   ```

3. Add TypeScript and development dependencies:

   ```bash
   npm i -D typescript tsx nodemon @types/express
   npx tsc --init
   ```

4. Configure `package.json`:

   - Add `"type": "module"` for ES Modules support
   - Add scripts for development:
     ```json
     "scripts": {
       "dev": "nodemon --exec tsx ./src/index.ts",
       "build": "tsc",
       "start": "node dist/index.js"
     }
     ```

5. Install Express and other dependencies:

   ```bash
   npm i express dotenv
   ```

6. Create the basic structure:
   ```
   <service-name>/
   ├── src/
   │   ├── app.ts      # Express app configuration
   │   └── index.ts    # Entry point
   ├── package.json
   └── tsconfig.json
   ```

### Running Services

Each service runs independently. Navigate to the service directory and run:

```bash
cd auth
npm run dev
```

Or for production:

```bash
npm run build
npm start
```

## 🔧 Service Configuration

### Environment Variables

Each service should have its own `.env` file (not committed to git):

```env
PORT=3001
NODE_ENV=development
# Add service-specific environment variables here
```

### TypeScript Configuration

Each service should have its own `tsconfig.json`. Common settings:

- `outDir`: `./dist`
- `rootDir`: `./src`
- `module`: `NodeNext`
- `target`: `ES2020`

## 📦 Services

### Auth Service

Handles authentication and authorization.

**Dependencies:**

- express
- dotenv
- bcrypt
- jsonwebtoken

**Endpoints:** (To be implemented)

### User Service

Manages user data and profiles.

**Endpoints:** (To be implemented)

## 🧪 Development

### Development Mode

Run services in development mode with hot reload:

```bash
npm run dev
```

### Building

Build TypeScript to JavaScript:

```bash
npm run build
```

The compiled output will be in the `dist/` directory.

## 📝 Notes

- Each service is independent and can be deployed separately
- Services communicate via HTTP/REST (consider adding API Gateway or message queue for inter-service communication)
- Use environment variables for configuration
- Follow consistent code structure across services

## 🔐 Security

- Never commit `.env` files
- Use environment variables for sensitive data
- Implement proper authentication/authorization
- Use HTTPS in production

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
