import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryProvider } from "@/components/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#059669", // emerald-600
};

export const metadata: Metadata = {
  title: "Tourist Management System - Jammu & Himachal Pradesh",
  description: "Digital platform for managing tourist flow in ecologically sensitive areas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of incorrect theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var d = document.documentElement;
                  d.classList.remove('light', 'dark');
                  var theme = localStorage.getItem('greenpass-theme');
                  var resolved;
                  if (theme === 'dark') {
                    resolved = 'dark';
                  } else if (theme === 'light') {
                    resolved = 'light';
                  } else {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  d.classList.add(resolved);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${inter.variable} antialiased`}
      >
        <ThemeProvider defaultTheme="system" storageKey="greenpass-theme">
          <QueryProvider>
            <AuthProvider>
              <ConnectionProvider>
                {children}
              </ConnectionProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
