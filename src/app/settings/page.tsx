'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { 
  Settings, 
  Save, 
  Bell,
  Shield,
  Globe,
  User,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface SystemSettings {
  general: {
    systemName: string;
    adminEmail: string;
    supportPhone: string;
    timezone: string;
    language: string;
  };
  capacity: {
    defaultMaxCapacity: number;
    overBookingPercentage: number;
    alertThreshold: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    capacityAlerts: boolean;
    weatherAlerts: boolean;
    emergencyAlerts: boolean;
  };
  security: {
    sessionTimeout: number;
    passwordExpiry: number;
    maxLoginAttempts: number;
    twoFactorAuth: boolean;
  };
  weather: {
    apiKey: string;
    updateInterval: number;
    alertThresholds: {
      windSpeed: number;
      rainfall: number;
      temperature: number;
    };
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      systemName: 'Tourist Management System',
      adminEmail: 'admin@tms-india.gov.in',
      supportPhone: '+91-1234567890',
      timezone: 'Asia/Kolkata',
      language: 'en'
    },
    capacity: {
      defaultMaxCapacity: 1000,
      overBookingPercentage: 10,
      alertThreshold: 80
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      capacityAlerts: true,
      weatherAlerts: true,
      emergencyAlerts: true
    },
    security: {
      sessionTimeout: 30,
      passwordExpiry: 90,
      maxLoginAttempts: 3,
      twoFactorAuth: false
    },
    weather: {
      apiKey: '',
      updateInterval: 60,
      alertThresholds: {
        windSpeed: 40,
        rainfall: 50,
        temperature: 45
      }
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would save to your backend/database
      localStorage.setItem('tms-settings', JSON.stringify(settings));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = <S extends keyof SystemSettings, F extends keyof SystemSettings[S]>(
    section: S, 
    field: F, 
    value: SystemSettings[S][F]
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedInputChange = <
    S extends keyof SystemSettings, 
    P extends keyof SystemSettings[S], 
    F extends keyof (SystemSettings[S][P] & object)
  >(
    section: S, 
    parentField: P, 
    field: F, 
    value: (SystemSettings[S][P] & object)[F]
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parentField]: {
          ...(prev[section][parentField] as object),
          [field]: value
        }
      }
    }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'capacity', label: 'Capacity', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'weather', label: 'Weather', icon: Globe },
  ];

  const SettingCard = ({ title, description, children }: {
    title: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
      {children}
    </div>
  );

  const InputField = <T extends string | number>({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    required = false,
    autoComplete,
  }: {
    label: string;
    value: T;
    onChange: (value: T) => void;
    type?: 'text' | 'email' | 'number' | 'password';
    placeholder?: string;
    required?: boolean;
    autoComplete?: string;
  }) => {
    const fieldId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    return (
      <div>
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <input
          id={fieldId}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          placeholder={placeholder}
          required={required}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    );
  };

  const SelectField = ({ 
    label, 
    value, 
    onChange, 
    options 
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
  }) => {
    const fieldId = `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
    return (
      <div>
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <select
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    );
  };

  const CheckboxField = ({ 
    label, 
    checked, 
    onChange 
  }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => {
    const fieldId = `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`;
    return (
      <div className="flex items-center">
        <input
          id={fieldId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        <label htmlFor={fieldId} className="ml-2 text-sm text-gray-700">{label}</label>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <SettingCard title="System Information" description="Basic system configuration">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="System Name"
                  value={settings.general.systemName}
                  onChange={(value) => handleInputChange('general', 'systemName', value)}
                  required
                />
                <InputField
                  label="Admin Email"
                  value={settings.general.adminEmail}
                  onChange={(value) => handleInputChange('general', 'adminEmail', value)}
                  type="email"
                  autoComplete="email"
                  required
                />
                <InputField
                  label="Support Phone"
                  value={settings.general.supportPhone}
                  onChange={(value) => handleInputChange('general', 'supportPhone', value)}
                />
                <SelectField
                  label="Timezone"
                  value={settings.general.timezone}
                  onChange={(value) => handleInputChange('general', 'timezone', value)}
                  options={[
                    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
                    { value: 'UTC', label: 'UTC' },
                    { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' }
                  ]}
                />
              </div>
            </SettingCard>
          </div>
        );

      case 'capacity':
        return (
          <div className="space-y-6">
            <SettingCard title="Capacity Management" description="Configure default capacity settings">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField
                  label="Default Max Capacity"
                  value={settings.capacity.defaultMaxCapacity}
                  onChange={(value) => handleInputChange('capacity', 'defaultMaxCapacity', value)}
                  type="number"
                />
                <InputField
                  label="Over-booking (%)"
                  value={settings.capacity.overBookingPercentage}
                  onChange={(value) => handleInputChange('capacity', 'overBookingPercentage', value)}
                  type="number"
                />
                <InputField
                  label="Alert Threshold (%)"
                  value={settings.capacity.alertThreshold}
                  onChange={(value) => handleInputChange('capacity', 'alertThreshold', value)}
                  type="number"
                />
              </div>
            </SettingCard>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <SettingCard title="Notification Preferences" description="Configure how and when notifications are sent">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Delivery Methods</h4>
                    <div className="space-y-3">
                      <CheckboxField
                        label="Email Notifications"
                        checked={settings.notifications.emailNotifications}
                        onChange={(value) => handleInputChange('notifications', 'emailNotifications', value)}
                      />
                      <CheckboxField
                        label="SMS Notifications"
                        checked={settings.notifications.smsNotifications}
                        onChange={(value) => handleInputChange('notifications', 'smsNotifications', value)}
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Alert Types</h4>
                    <div className="space-y-3">
                      <CheckboxField
                        label="Capacity Alerts"
                        checked={settings.notifications.capacityAlerts}
                        onChange={(value) => handleInputChange('notifications', 'capacityAlerts', value)}
                      />
                      <CheckboxField
                        label="Weather Alerts"
                        checked={settings.notifications.weatherAlerts}
                        onChange={(value) => handleInputChange('notifications', 'weatherAlerts', value)}
                      />
                      <CheckboxField
                        label="Emergency Alerts"
                        checked={settings.notifications.emergencyAlerts}
                        onChange={(value) => handleInputChange('notifications', 'emergencyAlerts', value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SettingCard>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <SettingCard title="Security Settings" description="Configure authentication and security policies">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <InputField
                    label="Session Timeout (minutes)"
                    value={settings.security.sessionTimeout}
                    onChange={(value) => handleInputChange('security', 'sessionTimeout', value)}
                    type="number"
                  />
                  <InputField
                    label="Password Expiry (days)"
                    value={settings.security.passwordExpiry}
                    onChange={(value) => handleInputChange('security', 'passwordExpiry', value)}
                    type="number"
                  />
                </div>
                <div className="space-y-4">
                  <InputField
                    label="Max Login Attempts"
                    value={settings.security.maxLoginAttempts}
                    onChange={(value) => handleInputChange('security', 'maxLoginAttempts', value)}
                    type="number"
                  />
                  <div className="pt-6">
                    <CheckboxField
                      label="Two-Factor Authentication"
                      checked={settings.security.twoFactorAuth}
                      onChange={(value) => handleInputChange('security', 'twoFactorAuth', value)}
                    />
                  </div>
                </div>
              </div>
            </SettingCard>
          </div>
        );

      case 'weather':
        return (
          <div className="space-y-6">
            <SettingCard title="Weather API Configuration" description="Configure weather monitoring and alerts">
              <div className="space-y-4">
                <InputField
                  label="Weather API Key"
                  value={settings.weather.apiKey}
                  onChange={(value) => handleInputChange('weather', 'apiKey', value)}
                  type="password"
                  autoComplete="off"
                  placeholder="Enter your OpenWeatherMap API key"
                />
                <InputField
                  label="Update Interval (minutes)"
                  value={settings.weather.updateInterval}
                  onChange={(value) => handleInputChange('weather', 'updateInterval', value)}
                  type="number"
                />
              </div>
            </SettingCard>

            <SettingCard title="Weather Alert Thresholds" description="Set thresholds for automatic weather alerts">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField
                  label="Wind Speed (km/h)"
                  value={settings.weather.alertThresholds.windSpeed}
                  onChange={(value) => handleNestedInputChange('weather', 'alertThresholds', 'windSpeed', value)}
                  type="number"
                />
                <InputField
                  label="Rainfall (mm)"
                  value={settings.weather.alertThresholds.rainfall}
                  onChange={(value) => handleNestedInputChange('weather', 'alertThresholds', 'rainfall', value)}
                  type="number"
                />
                <InputField
                  label="Temperature (°C)"
                  value={settings.weather.alertThresholds.temperature}
                  onChange={(value) => handleNestedInputChange('weather', 'alertThresholds', 'temperature', value)}
                  type="number"
                />
              </div>
            </SettingCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Configure system settings and preferences</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : saved ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                        activeTab === tab.id
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </Layout>
  );
}
