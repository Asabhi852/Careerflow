# 🚀 Careerflow

**A Modern Job Board & Career Management Platform**

Careerflow is a comprehensive full-stack web application that connects job seekers with employers through an intelligent, AI-powered platform. Built with Next.js 15, Firebase, and modern web technologies, it offers a seamless experience for job searching, application management, and professional networking.

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.0-orange?logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## ✨ Features

### 🎯 For Job Seekers

- **Smart Job Search** - Advanced filtering by location, category, salary, and experience level
- **AI-Powered Matching** - Get personalized job recommendations based on your profile
- **One-Click Apply** - Quick application process with resume upload
- **Application Tracking** - Monitor all your applications in one dashboard
- **Real-time Messaging** - WhatsApp-style chat with recruiters and employers
- **Multilingual Chatbot** - Get assistance in multiple languages (Kannada, Hindi, Tamil, Telugu, English)
- **Profile Builder** - Create comprehensive professional profiles with skills and experience
- **Saved Jobs** - Bookmark jobs for later review
- **Resume Parser** - AI-powered resume analysis and parsing

### 💼 For Employers

- **Post Jobs** - Easy job posting with detailed organization information
- **Manage Applications** - Review and respond to applications efficiently
- **Edit/Delete Jobs** - Full control over your job postings
- **Candidate Search** - Find the right talent with advanced filters
- **External Apply Links** - Direct candidates to your company career page
- **Organization Profiles** - Showcase your company, school, or institution
- **Application Analytics** - Track application metrics and engagement

### 🤖 AI-Powered Features

- **Job Matching Algorithm** - Intelligent job recommendations
- **Resume Analysis** - Automated resume parsing and skill extraction
- **Multilingual Support** - Chatbot assistance in 5+ languages
- **Smart Notifications** - Real-time updates on applications and messages

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: React Hooks, Context API
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Animations**: Framer Motion, Custom CSS

### Backend & Services
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **AI/ML**: Google Genkit
- **Real-time**: Firestore real-time listeners
- **File Storage**: Firebase Storage
- **Security**: Firestore Security Rules

### External APIs
- **Job Aggregation**: LinkedIn, Naukri APIs
- **AI Services**: Google Generative AI
- **Internationalization**: Custom i18n implementation

---


---

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Asabhi852/Careerflow)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy Firebase Rules

```bash
npm run deploy:rules
```

---

## 📚 API Documentation

### Firestore Collections

- **users**: User profiles and settings
- **public_profiles**: Public user information
- **jobs**: Job postings
- **job_postings**: Enhanced job listings
- **applications**: Job applications
- **posts**: Social posts
- **conversations**: Chat conversations
- **messages**: User messages (subcollection)
- **notifications**: User notifications (subcollection)

### API Routes

- `POST /api/ai-match` - AI job matching
- `GET /api/jobs/external` - External job aggregation
- `POST /api/resume/parse` - Resume parsing

---
**
team members:
 ~ Abhishek
 ~ Abhishek S H
 ~ Adarsha 
 ~ Ashok B
 ~ 


*Last Updated: November 4, 2025*
