import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-Classroom | SMZ Education",
  description: "E-Classroom - A modern learning management system by SMZ Education. Manage classes, assignments, grades, attendance, and communication for schools worldwide.",
  keywords: ["E-Classroom", "LMS", "Learning Management System", "SMZ Education", "Online Learning", "Education", "Schools", "Teachers", "Students"],
  authors: [{ name: "SMZ Education", url: "https://smzedu.com" }],
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "E-Classroom | SMZ Education",
    description: "Modern Learning Management System for schools worldwide",
    url: "https://smzedu.com",
    siteName: "E-Classroom",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "E-Classroom | SMZ Education",
    description: "Modern Learning Management System for schools worldwide",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
