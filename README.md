# 🌿 GreenPass

**Sustainable Tourism Management for India's Fragile Ecosystems**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![Test Suite](https://github.com/monu808/GreenPass/actions/workflows/test.yml/badge.svg)

> A digital platform to manage tourist flow in ecologically sensitive areas of Jammu & Kashmir and Himachal Pradesh, preventing overcrowding and promoting sustainable tourism.

---

## 📑 Table of Contents
- [About](#-about)
- [Core Features](#core-features)
- [Supported Destinations](#supported-destinations)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)
- [Support](#-support)


## 🧪 Testing & Quality Assurance

To ensure reliability and maintain high standards, we have integrated a comprehensive testing suite:

- **Unit & Integration**: Powered by Jest and React Testing Library.
- **End-to-End (E2E)**: Powered by Playwright.
- **CI/CD**: GitHub Actions runs the full test suite on every push and PR.
- **Pre-commit Hooks**: Husky ensures code quality before every commit.

### Coverage Requirements

We enforce strict coverage thresholds to maintain code quality:

| Component | Target Coverage |
|-----------|-----------------|
| Global Minimum | 70% |
| `src/lib/utils.ts` | 100% |
| Validation Schemas | 100% |
| Calculators | 80% |
| Policy Engine | 80% |

### Running Tests

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

---

## 🤝 Contributing

**We need your help!** GreenPass is an open-source project tackling real environmental challenges. Whether you're a developer, designer, or tourism enthusiast—your contribution matters.

### 🎯 What We Need

- **🐛 Bug Fixes**: Registration validation, capacity calculations, alert systems
- **🔒 Security Improvements**: Authentication, data encryption, input sanitization
- **✨ New Features**: Payment integration, mobile app, GPS tracking, AI analytics
- **🎨 UI/UX Enhancements**: Accessibility, mobile responsiveness, design improvements
- **📚 Documentation**: Tutorials, API docs, translations (Hindi, Punjabi, Kashmiri)
- **💬 Community Support**: Answer questions in [Discussions](https://github.com/monu808/GreenPass/discussions)

### 🚀 Quick Start for Contributors

🚀 Quick Start for Contributors

1. Fork the repository using the GitHub Fork button
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/GreenPass.git
   cd GreenPass
   ```
3. **Read** [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
4. **Sync your fork** with upstream regularly:
   ```bash
   git remote add upstream https://github.com/monu808/GreenPass.git
   git fetch upstream
   git merge upstream/main
   ```
5. **Create a feature branch**, make your changes, and commit them 
6. **Push The branch** , and open a Pull Request
6. **Report bugs** using our [Issue Template](.github/ISSUE_TEMPLATE/bug_report.md)

👉 **[Read Full Contributing Guide](./CONTRIBUTING.md)**

---

## 📖 About

GreenPass helps manage tourist capacity in sensitive Himalayan regions to prevent environmental damage and ensure visitor safety. Built in response to flash floods and overcrowding incidents in Northern India.

### Core Features

- **📊 Real-time Dashboard**: Live occupancy tracking across destinations
- **📝 Smart Registration**: Pre-booking with ID verification and group support
- **🗺️ Capacity Management**: Automated slot allocation based on ecological sensitivity
- **🔔 Alert System**: Weather advisories, capacity warnings, emergency notifications

### Supported Destinations

| Location | Capacity | Sensitivity |
|----------|----------|-------------|
| Vaishno Devi | 1,000 | 🔴 High |
| Manali | 800 | 🟡 Medium |
| Shimla | 1,200 | 🟡 Medium |
| Dharamshala | 600 | 🔴 High |
| Spiti Valley | 200 | 🟣 Critical |

---

## 🛠️ Tech Stack

**Frontend**: Next.js 15, TypeScript, Tailwind CSS, TanStack Query (React Query)
**Backend**: Supabase (Auth + PostgreSQL), LRU Cache
**UI**: Radix UI, Lucide Icons, Recharts  
**Tools**: NextAuth, date-fns, Turbopack

---

## 🚀 Performance Optimization

To maintain high performance and eliminate N+1 query patterns, we recommend the following database indexes:

```sql
-- Index for destination lookups in tourists table
CREATE INDEX idx_tourists_destination_id ON tourists(destination_id);

-- Index for status-based occupancy calculations
CREATE INDEX idx_tourists_status ON tourists(status) WHERE status IN ('checked-in', 'approved');

-- Index for temporal queries (latest weather, latest indicators)
CREATE INDEX idx_weather_data_destination_created ON weather_data(destination_id, created_at DESC);
CREATE INDEX idx_ecological_indicators_destination_created ON ecological_indicators(destination_id, created_at DESC);

-- Index for tourist lookups by user
CREATE INDEX idx_tourists_user_id ON tourists(user_id);
```

---

## 🚀 Installation

```bash
# Clone repository
git clone https://github.com/monu808/GreenPass.git
cd GreenPass

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Add your Supabase credentials to .env.local

# Run development server
npm run dev
# Open http://localhost:3000
```

---
### 🔑 Environment Variables

Create a file named `.env.local` in the root directory and add the following keys (see `.env.example`):

| Variable | Description |
|----------|-------------|
| **Supabase** | |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase API Anon Key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key (Keep this secret!). |
| **Weather API** | |
| `TOMORROW_API_KEY` | API Key from Tomorrow.io. |
| `NEXT_PUBLIC_TOMORROW_API_KEY` | Public Weather API Key. |
| **App & Auth** | |
| `NEXT_PUBLIC_APP_URL` | Base URL (e.g., `http://localhost:3000`). |
| `NEXTAUTH_URL` | Canonical URL for NextAuth (same as App URL). |
| `NEXTAUTH_SECRET` | Secret string for session encryption. |
| **Google OAuth** | |
| `GOOGLE_CLIENT_ID` | OAuth Client ID from Google Cloud. |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret from Google Cloud. |

## 📱 Usage

### For Tourists
1. Register with ID proof and travel details
2. Select destination and date
3. Receive digital permit via email
4. Show QR code at entry

### For Administrators
1. Monitor dashboard for real-time occupancy
2. Approve/reject registrations
3. Send alerts and manage capacity
4. Generate compliance reports

---

## 🗺️ Roadmap

**Phase 2**: Mobile apps, payment gateway, QR check-in, GPS tracking  
**Phase 3**: AI predictions, IoT sensors, multi-language, blockchain permits

---

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/monu808/GreenPass/issues)
- **Discussions**: [GitHub Discussions](https://github.com/monu808/GreenPass/discussions)
- **Docs**: [Contributing Guide](./CONTRIBUTING.md)

---

**Built with ❤️ for sustainable tourism in India**

## 🚀 Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

1.  Push your code to a GitHub repository.
2.  Go to Vercel and import your project.
3.  **Crucial:** Add your **Environment Variables** (the ones listed above) in the Vercel Project Settings.
4.  Click **Deploy**.

For manual production builds:
```bash
npm run build
npm start