# Tourist Management System (TMS)

A comprehensive digital platform for managing tourist flow in ecologically sensitive areas of Jammu and Himachal Pradesh, designed to prevent overcrowding and promote sustainable tourism.

## 🌟 Overview

The Tourist Management System addresses the critical need for regulating tourist flow in northern India's fragile ecosystems, particularly in response to recent natural calamities like flash floods and cloudbursts. The system enforces capacity limits (e.g., 1000 tourists) while enabling real-time monitoring and automated slot management.

## 🎯 Key Features

### 🏠 Dashboard
- **Real-time Monitoring**: Live occupancy tracking across all destinations
- **Capacity Management**: Visual indicators showing utilization levels
- **Alert System**: Immediate notifications for overcapacity or emergencies
- **Statistics Overview**: Comprehensive analytics and insights

### 📝 Tourist Registration
- **Pre-registration System**: Online booking with slot allocation
- **Validation**: Email, phone, and ID verification
- **Group Management**: Support for family/group bookings (up to 10 people)
- **Emergency Contacts**: Mandatory safety information collection

### 🗺️ Destination Management
- **Capacity Control**: Real-time tracking of tourist numbers
- **Ecological Sensitivity Levels**: Color-coded risk assessment
- **Guidelines Display**: Location-specific rules and regulations
- **Status Monitoring**: Active/inactive destination management

### 🔔 Alert System
- **Weather Advisories**: Real-time weather-related warnings
- **Capacity Alerts**: Automatic notifications when limits approach
- **Emergency Notifications**: Critical safety communications
- **Maintenance Updates**: Scheduled closure notifications

## 🏔️ Supported Destinations

### Jammu & Kashmir
- **Vaishno Devi** (Capacity: 1000, High Sensitivity)

### Himachal Pradesh
- **Manali** (Capacity: 800, Medium Sensitivity)
- **Shimla** (Capacity: 1200, Medium Sensitivity)  
- **Dharamshala** (Capacity: 600, High Sensitivity)
- **Spiti Valley** (Capacity: 200, Critical Sensitivity)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Tourist_Measure
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build
npm start
```

## 🛠️ Technology Stack

- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Build Tool**: Turbopack

## 📱 Usage Guide

### For Tourists

1. **Registration Process**
   - Visit the registration page
   - Fill in personal details and travel information
   - Select destination and dates
   - Provide emergency contact information
   - Submit for approval

2. **Booking Management**
   - Check application status
   - Receive email confirmations
   - Access digital permits

### For Administrators

1. **Dashboard Monitoring**
   - Monitor real-time occupancy levels
   - Track capacity utilization across destinations
   - Review pending approvals
   - Manage active alerts

2. **Tourist Management**
   - Approve/reject registrations
   - Update tourist status (check-in/check-out)
   - Generate reports and analytics

## 🔐 Security Features

- **Data Validation**: Comprehensive input validation and sanitization
- **ID Verification**: Mandatory government ID proof requirement
- **Emergency Contacts**: Safety-first approach with mandatory emergency information
- **Real-time Monitoring**: Continuous capacity and safety monitoring

## 🌱 Environmental Impact

### Ecological Protection
- **Capacity Limits**: Strict enforcement of carrying capacity
- **Sensitivity Mapping**: Risk-based destination categorization
- **Real-time Monitoring**: Immediate response to environmental concerns
- **Sustainable Tourism**: Promoting responsible travel practices

### Disaster Preparedness
- **Crowd Management**: Controlled tourist numbers during emergencies
- **Early Warning System**: Integrated weather and safety alerts
- **Evacuation Planning**: Streamlined visitor tracking for emergency response

## 📊 System Architecture

```
Tourist Management System
├── Frontend (Next.js + TypeScript)
│   ├── Dashboard
│   ├── Registration
│   ├── Destination Management
│   └── Alert System
├── Data Layer
│   ├── Tourist Records
│   ├── Destination Information
│   ├── Booking Slots
│   └── Alert Management
└── Utilities
    ├── Validation Functions
    ├── Date Management
    └── Export/Import Tools
```

## 🔄 Future Enhancements

### Phase 2 Features
- **Mobile Application**: Native iOS/Android apps
- **Payment Integration**: Online fee collection
- **QR Code System**: Digital check-in/check-out
- **GPS Tracking**: Real-time location monitoring

### Phase 3 Features
- **Machine Learning**: Predictive analytics for crowd management
- **IoT Integration**: Environmental sensors and monitoring
- **Multi-language Support**: Regional language interfaces
- **API Gateway**: Third-party integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For technical support or queries:
- **Email**: support@tms-india.gov.in
- **Phone**: 1950 (Emergency Helpline)
- **Documentation**: [User Guide](docs/user-guide.md)

## 🏛️ Government Compliance

This system is designed to comply with:
- **Digital India Initiative**: Supporting paperless governance
- **Environmental Protection Act**: Safeguarding ecological zones
- **Tourism Policy**: Promoting sustainable and responsible tourism
- **Data Protection Laws**: Ensuring tourist data privacy and security

---

**Built with ❤️ for sustainable tourism in India**
