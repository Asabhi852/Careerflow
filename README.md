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

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase account
- Git

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/Asabhi852/Careerflow.git
cd Careerflow
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Environment Configuration**

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google AI
GOOGLE_GENAI_API_KEY=your_google_ai_key

# External APIs (Optional)
LINKEDIN_API_KEY=your_linkedin_key
NAUKRI_API_KEY=your_naukri_key
```

4. **Firebase Setup**

- Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
- Enable Authentication (Email/Password, Google)
- Create Firestore database
- Set up Firebase Storage
- Deploy security rules:

```bash
npm run deploy:rules
```

5. **Run Development Server**

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser.

---

## 🏗️ Project Structure

```
Careerflow/
├── src/
│   ├── app/                      # Next.js 15 App Router
│   │   ├── (auth)/              # Authentication pages
│   │   ├── dashboard/           # User dashboard
│   │   │   ├── applications/    # Application management
│   │   │   ├── edit-job/        # Job editing
│   │   │   ├── messages/        # Messaging system
│   │   │   ├── notifications/   # Notifications
│   │   │   ├── post-job/        # Job posting
│   │   │   └── settings/        # User settings
│   │   ├── jobs/                # Job listings & details
│   │   ├── candidates/          # Candidate search
│   │   ├── posts/               # Social posts
│   │   └── chatbot/             # AI chatbot
│   ├── ai/                      # AI/ML features
│   │   └── flows/               # Genkit flows
│   ├── components/              # React components
│   │   ├── auth/               # Authentication
│   │   ├── chatbot/            # Chatbot UI
│   │   ├── jobs/               # Job components
│   │   ├── landing/            # Landing page
│   │   ├── layout/             # Layout components
│   │   ├── resume/             # Resume parser
│   │   └── ui/                 # UI primitives
│   ├── firebase/               # Firebase configuration
│   ├── i18n/                   # Internationalization
│   ├── lib/                    # Utilities & types
│   └── hooks/                  # Custom React hooks
├── public/                     # Static assets
├── docs/                       # Documentation
├── firestore.rules            # Firestore security rules
├── firebase.json              # Firebase configuration
└── package.json               # Dependencies

```

---

## 🎨 Key Features in Detail

### 1. **Enhanced Job Posting**

- Support for multiple organization types (Company, School, College, Non-profit, etc.)
- Detailed organization profiles with contact information
- Optional external application URLs
- Rich job descriptions with benefits and requirements
- Category and experience level tagging

### 2. **WhatsApp-Style Messaging**

- Real-time messaging between users
- Message status indicators (sent, delivered, read)
- Typing indicators
- Date separators
- Message grouping
- Sequential conversation view
- Auto-scroll to latest messages

### 3. **Multilingual AI Chatbot**

- Support for 5+ Indian languages
- Language detection and auto-translation
- Context-aware responses
- Integration with job search
- Helpful career guidance

### 4. **Job Application System**

- One-click apply or external website redirect
- Application status tracking
- Resume upload and management
- Notification system for updates
- Application history

### 5. **Advanced Search & Filters**

- Location-based search
- Category filtering
- Salary range filters
- Experience level matching
- External job aggregation (LinkedIn, Naukri)

### 6. **Modern UI/UX**

- Clean, professional design
- Responsive mobile-first layout
- Smooth animations and transitions
- Dark mode support
- Custom scrollbars
- Glass morphism effects
- Gradient accents

---

## 🔒 Security

- **Authentication**: Firebase Authentication with email/password and Google Sign-in
- **Authorization**: Firestore Security Rules for data protection
- **Data Validation**: Zod schema validation on forms
- **Secure Storage**: Firebase Storage with access rules
- **HTTPS Only**: All communications encrypted
- **Input Sanitization**: Protection against XSS and injection attacks

---

## 📱 Responsive Design

Careerflow is fully responsive and optimized for:

- 📱 Mobile devices (320px+)
- 💻 Tablets (768px+)
- 🖥️ Desktops (1024px+)
- 📺 Large screens (1440px+)

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

## 🎯 Roadmap

### Upcoming Features

- [ ] Video interviewing
- [ ] Advanced analytics dashboard
- [ ] Company reviews and ratings
- [ ] Salary insights and comparisons
- [ ] Skills assessment tests
- [ ] Job alerts via email/SMS
- [ ] Social media integration
- [ ] Referral system
- [ ] Premium subscriptions
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly

---

## 📝 Scripts

```bash
# Development
npm run dev              # Start dev server on port 9002

# Build
npm run build            # Build for production
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint
npm run typecheck        # TypeScript type checking

# Firebase
npm run deploy:rules     # Deploy Firestore rules

# Genkit (AI)
npm run genkit:dev       # Start Genkit development server
npm run genkit:watch     # Start Genkit with watch mode
```

---

## 🐛 Known Issues

- External job APIs may have rate limits
- Resume parsing works best with standard formats
- Some features require authentication

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Abhishek**
- GitHub: [@Asabhi852](https://github.com/Asabhi852)
- Project: [Careerflow](https://github.com/Asabhi852/Careerflow)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Firebase](https://firebase.google.com/) - Backend services
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://radix-ui.com/) - UI components
- [Lucide](https://lucide.dev/) - Icons
- [Google Genkit](https://firebase.google.com/docs/genkit) - AI integration

---

## 📞 Support

If you have any questions or need help, please:

- 🐛 [Open an issue](https://github.com/Asabhi852/Careerflow/issues)
- 💬 [Start a discussion](https://github.com/Asabhi852/Careerflow/discussions)
- 📧 Contact via GitHub profile

---

## ⭐ Show Your Support

If you like this project, please give it a ⭐ on GitHub!

---

**Made with ❤️ and ☕ by Abhishek**

*Last Updated: October 31, 2025*
