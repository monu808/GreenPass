# 🌿 GreenPass

**Sustainable Tourism Management for India's Fragile Ecosystems**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> A digital platform to manage tourist flow in ecologically sensitive areas of Jammu & Kashmir and Himachal Pradesh, preventing overcrowding and promoting sustainable tourism.

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

1. **Fork & Clone** the repository
2. **Read** [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
3. **Sync your fork** with upstream regularly:
   ```bash
   git remote add upstream https://github.com/monu808/GreenPass.git
   git fetch upstream
   git merge upstream/main
   ```
4. **Create a feature branch**, make changes, and submit a PR
5. **Report bugs** using our [Issue Template](.github/ISSUE_TEMPLATE/bug_report.md)

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

**Frontend**: Next.js 15, TypeScript, Tailwind CSS  
**Backend**: Supabase (Auth + PostgreSQL)  
**UI**: Radix UI, Lucide Icons, Recharts  
**Tools**: NextAuth, date-fns, Turbopack

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