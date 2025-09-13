# Financial Analysis Tooling

Advanced financial analysis tooling with LLM-powered insights, built with modern web technologies and Cloudflare infrastructure.

## 🚀 Features

- **Lease Analysis**: Comprehensive lease agreement analysis with amortization schedules
- **Financial Modeling**: Deterministic financial calculations with precision math
- **LLM Integration**: MCP (Model Context Protocol) server for AI-powered insights
- **Cloudflare Stack**: Workers API, D1 database, R2 storage, KV sessions
- **Modern UI**: Astro frontend with Tailwind CSS and React components
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Testing**: Comprehensive unit tests with Vitest and coverage reporting

## 🏗️ Architecture

```
financial-analysis/
├── apps/web/          # Astro frontend application
├── workers/api/       # Cloudflare Workers API with MCP server
├── packages/analysis/ # Deterministic financial calculation engines
├── packages/tools/    # MCP tool modules for LLM integration
├── packages/ui/       # Shared React components with Tailwind
├── docs/              # API documentation and guides
└── .github/           # CI/CD workflows and templates
```

## 🛠️ Tech Stack

- **Frontend**: Astro, React, Tailwind CSS
- **Backend**: Cloudflare Workers, TypeScript
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Sessions**: Cloudflare KV
- **LLM**: MCP Protocol for AI integration
- **Math**: Decimal.js for financial precision
- **Testing**: Vitest, Testing Library
- **Code Quality**: ESLint, Prettier
- **Package Manager**: pnpm with workspaces

## 📋 Prerequisites

- Node.js 18+
- pnpm 8+
- Cloudflare account (for deployment)
- Git

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/blakeox/financial-analysis.git
   cd financial-analysis
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development servers**

   ```bash
   # Start all services
   pnpm run dev

   # Or start individually:
   pnpm --filter @financial-analysis/web run dev    # Frontend
   pnpm --filter @financial-analysis/api run dev    # API Worker
   ```

5. **Open your browser**
   - Frontend: `http://localhost:4321`
   - API Worker: Check terminal output for local worker URL

## 📖 Usage

### Running Analysis

```typescript
import { LeaseAnalyzer } from '@financial-analysis/analysis';

const result = LeaseAnalyzer.analyze({
  principal: 50000,
  annualRate: 0.05,
  termMonths: 60,
  residualValue: 10000,
});

console.log(result.monthlyPayment); // Monthly payment amount
console.log(result.schedule); // Full amortization schedule
```

### Using MCP Tools

The API provides MCP-compatible endpoints for LLM integration:

```typescript
// Example MCP tool call
const response = await fetch('/api/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'lease-analysis',
      arguments: {
        principal: 50000,
        annualRate: 0.05,
        termMonths: 60,
      },
    },
  }),
});
```

## 🧪 Testing

```bash
# Run all tests
pnpm run test

# Run tests with coverage
pnpm run test --coverage

# Run tests in watch mode
pnpm run test --watch

# Run specific test file
pnpm run test lease.test.ts
```

## 🚢 Deployment

### Development

```bash
pnpm run deploy:api   # Deploy API to Cloudflare Workers
pnpm run deploy:web   # Deploy frontend to Cloudflare Pages
```

### Production

```bash
pnpm run deploy:all   # Deploy both API and frontend
```

### Environment Setup

1. Create Cloudflare account and install Wrangler CLI
2. Set up D1 database, R2 bucket, and KV namespace
3. Configure environment variables in Cloudflare dashboard
4. Update `wrangler.toml` with your resource IDs

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Agent Guidelines](./AGENT.md)
- [Environment Setup](./.env.example)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes following our coding standards
4. Add tests for new functionality
5. Ensure all tests pass: `pnpm run test`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Astro](https://astro.build/)
- Powered by [Cloudflare Workers](https://workers.cloudflare.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Financial math with [Decimal.js](https://github.com/MikeMcl/decimal.js/)

---

Made with ❤️ for financial analysis professionals
