<div align="center">

# 🌿 GreenPass

### Sustainable Tourism Management System

[![Next.js](https://img.shields.io/badge/Next.js-15. 5.9-black? style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue? style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Integrated-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![License:  MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

*Protecting India's fragile ecosystems through intelligent tourist flow management*

[Features](#-features) • [Demo](#-quick-start) • [Installation](#-installation) • [Documentation](#-usage-guide) • [Contributing](./CONTRIBUTING.md)

</div>

---

## 📖 About GreenPass

GreenPass is a comprehensive digital platform designed to regulate and manage tourist flow in ecologically sensitive regions of **Jammu & Kashmir** and **Himachal Pradesh**. In response to increasing environmental challenges, flash floods, and overcrowding incidents in Northern India's mountainous regions, GreenPass provides a proactive solution to balance tourism with environmental conservation.

### 🎯 Mission

To promote **sustainable tourism** by implementing smart capacity management, real-time monitoring, and data-driven decision-making to protect fragile Himalayan ecosystems while ensuring tourist safety and memorable experiences.

### 🌍 Why GreenPass?

- **Environmental Protection**: Enforces carrying capacity limits to prevent ecological damage
- **Disaster Preparedness**: Real-time crowd tracking enables efficient emergency response
- **Tourist Safety**: Pre-registration system with emergency contact management
- **Data-Driven Insights**: Analytics for better tourism policy and planning
- **Digital India Compliant**: Paperless, accessible, and transparent governance

---

## ✨ Features

### 🏠 **Intelligent Dashboard**
- **Real-time Occupancy Tracking**: Monitor live tourist numbers across all destinations
- **Visual Capacity Indicators**: Color-coded alerts (Green/Yellow/Red) based on utilization
- **Emergency Alert System**: Instant notifications for overcapacity or critical situations
- **Analytics & Insights**: Historical data, trends, and predictive analytics

### 📝 **Smart Tourist Registration**
- **Online Pre-booking System**: Reserve slots before traveling
- **Multi-level Validation**: Email, phone, and government ID verification
- **Group Management**: Support for families and groups (up to 10 members)
- **Digital Permits**: QR-based entry passes with automated check-in/out

### 🗺️ **Destination Management**
- **Capacity Control**: Automatic slot allocation based on real-time availability
- **Ecological Sensitivity Mapping**: Risk-based categorization (Low/Medium/High/Critical)
- **Location Guidelines**: Destination-specific rules and regulations
- **Dynamic Status Updates**: Active/inactive management based on weather and conditions

### 🔔 **Proactive Alert System**
- **Weather Advisories**: Real-time weather warnings from meteorological data
- **Capacity Notifications**: Automatic alerts when destinations approach limits
- **Emergency Broadcasts**: Critical safety communications to registered tourists
- **Maintenance Updates**: Scheduled closure and route change notifications

---

## 🏔️ Supported Destinations

### **Jammu & Kashmir**
| Destination | Daily Capacity | Sensitivity Level |
|------------|---------------|------------------|
| Vaishno Devi | 1,000 | 🔴 High |

### **Himachal Pradesh**
| Destination | Daily Capacity | Sensitivity Level |
|------------|---------------|------------------|
| Manali | 800 | 🟡 Medium |
| Shimla | 1,200 | 🟡 Medium |
| Dharamshala | 600 | 🔴 High |
| Spiti Valley | 200 | 🟣 Critical |

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed: 
- **Node.js** 18.x or higher
- **npm** 9.x or **yarn** 1.22.x
- **Git**
- A **Supabase** account (for authentication and database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/monu808/GreenPass.git
   cd GreenPass
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   
   Copy the example environment file and add your Supabase credentials: 
   ```bash
   cp .env.example .env. local
   ```

   Edit `.env.local` with your Supabase project details:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

---

## 🛠️ Technology Stack

| Category | Technology |
|---------|-----------|
| **Framework** | Next.js 15.5.9 (App Router) |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS 4.0 |
| **Authentication** | NextAuth.js + Supabase Auth |
| **Database** | Supabase (PostgreSQL) |
| **UI Components** | Radix UI |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Date Handling** | date-fns |
| **Build Tool** | Turbopack |

---

## 📱 Usage Guide

### For Tourists

#### Registration Process
1. Navigate to the **Registration** page
2. Fill in personal details: 
   - Name, email, phone number
   - Government ID (Aadhaar/Passport/Driving License)
3. Select: 
   - Destination
   - Visit date
   - Number of people (1-10)
4. Provide emergency contact information
5. Submit application and wait for approval

#### Managing Your Booking
- Check application status on the dashboard
- Receive email/SMS confirmation with QR code
- Present digital permit at destination entry
- Update or cancel booking (subject to policy)

### For Administrators

#### Dashboard Monitoring
- View real-time occupancy across all destinations
- Monitor capacity utilization percentages
- Review and approve/reject pending registrations
- Manage active alerts and notifications

#### Tourist Management
- Approve or reject applications based on capacity
- Update tourist status (checked-in, checked-out, cancelled)
- Generate reports:  daily, weekly, monthly analytics
- Export data for government compliance

---

## 🔐 Security & Privacy

- **Data Encryption**: All sensitive data encrypted in transit and at rest
- **Input Validation**: Comprehensive sanitization to prevent injection attacks
- **Government ID Verification**: Mandatory identity proof for accountability
- **Emergency Contacts**: Safety-first approach with mandatory contact information
- **GDPR/Data Protection Compliant**: User data handled per Indian IT Act guidelines

---

## 🌱 Environmental Impact

### Ecological Benefits
- **Prevents Overcrowding**: Strict enforcement of scientifically determined carrying capacity
- **Reduces Carbon Footprint**: Optimized tourist distribution reduces traffic congestion
- **Real-time Monitoring**: Immediate intervention when ecological thresholds are breached
- **Promotes Awareness**: Educational guidelines for responsible tourism

### Disaster Management
- **Evacuation Planning**: Accurate visitor count aids emergency response
- **Early Warning Integration**: Weather and landslide alerts from IMD
- **Controlled Access**: Ability to halt registrations during adverse conditions

---

## 📊 Project Structure

```
GreenPass/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Admin dashboard
│   │   ├── register/           # Tourist registration
│   │   ├── destinations/       # Destination management
│   │   └── alerts/             # Alert system
│   ├── components/             # Reusable React components
│   ├── contexts/               # React Context providers
│   ├── data/                   # Static data and configurations
│   ├── lib/                    # Utility functions and helpers
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
├── scripts/                    # Build and deployment scripts
├── . env.example                # Environment variables template
├── package.json                # Dependencies and scripts
└── README.md                   # You are here! 
```

---

## 🔄 Roadmap

### 🎯 Phase 2 (Upcoming)
- [ ] **Mobile Applications**:  Native iOS and Android apps
- [ ] **Payment Gateway**:  Online permit fee collection
- [ ] **Advanced QR System**: Contactless check-in/out
- [ ] **GPS Tracking**: Real-time location monitoring for safety
- [ ] **Offline Mode**: Access permits without internet

### 🚀 Phase 3 (Future)
- [ ] **AI/ML Integration**: Predictive crowd analytics and recommendations
- [ ] **IoT Sensors**: Environmental monitoring (air quality, noise, temperature)
- [ ] **Multi-language Support**: Hindi, Punjabi, Kashmiri, Himachali
- [ ] **API Ecosystem**: Third-party integrations for hotels, tour operators
- [ ] **Blockchain Permits**: Tamper-proof digital credentials

---

## 🤝 Contributing

We welcome contributions from developers, environmentalists, and tourism enthusiasts! 

Please read our **[Contributing Guidelines](./CONTRIBUTING.md)** for details on: 
- Code of conduct
- Development setup
- Coding standards
- Submitting pull requests
- Reporting bugs and suggesting features

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for full details.

---

## 📞 Support & Contact

### For Tourists
- **Email**: support@greenpass.gov.in *(example)*
- **Emergency Helpline**: 1950
- **User Guide**: [Documentation](docs/user-guide.md)

### For Developers
- **Issues**: [GitHub Issues](https://github.com/monu808/GreenPass/issues)
- **Discussions**: [GitHub Discussions](https://github.com/monu808/GreenPass/discussions)

---

## 🏛️ Government Compliance

GreenPass aligns with: 
- **Digital India Initiative** - Promoting paperless governance
- **Environment Protection Act, 1986** - Safeguarding ecological zones
- **National Tourism Policy** - Sustainable and responsible tourism
- **IT Act, 2000** - Data protection and privacy

---

## 🙏 Acknowledgments

- **Ministry of Tourism, India** - Policy guidance
- **Indian Meteorological Department** - Weather data
- **State Tourism Departments** (J&K, Himachal Pradesh) - Destination information
- **Open Source Community** - Tools and libraries

---

<div align="center">

**Built with ❤️ for sustainable tourism in India**

[⬆ Back to Top](#-greenpass)

</div>
