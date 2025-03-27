# 🔐 Biometric Authentication Project

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern, secure Next.js application that demonstrates advanced biometric authentication capabilities. This project showcases a robust authentication system that leverages biometric factors alongside traditional authentication methods to provide enhanced security with improved user experience.

<div align="center">
  <img src="https://via.placeholder.com/800x400?text=Biometric+Authentication+Demo" alt="Biometric Authentication Demo" width="800"/>
</div>

## ✨ Features

- **Biometric Authentication** - Seamless integration with device biometric sensors (fingerprint, face recognition)
- **Traditional Authentication** - Username/password fallback with secure practices
- **User Registration Flow** - Step-by-step account creation with biometric enrollment
- **Secure Session Management** - Protected routes and session handling
- **Responsive Design** - Mobile-first interface that works across all devices
- **Secure Password Storage** - Bcrypt hashing for secure credential storage
- **SQLite Database** - Lightweight, serverless database integration
- **Modern Tech Stack**:
  - Next.js 15 with App Router architecture
  - React 19 with latest features
  - TypeScript for type safety
  - TailwindCSS for responsive styling

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or newer recommended)
- **npm**, **yarn**, or **pnpm** for package management
- Modern browser with WebAuthn support for biometric features

### Installation

1. **Clone the repository**:

```bash
git clone https://github.com/yourusername/biometric-auth.git
cd biometric-auth
```

2. **Install dependencies**:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**:

Create a `.env.local` file in the root directory with the following variables:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
# Add any other environment variables here
```

4. **Run the development server**:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. **Access the application**:

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application in action.

## 📁 Project Structure

```
biometric-auth/
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   │   ├── api/          # Backend API endpoints
│   │   ├── login/        # Login interface
│   │   ├── register/     # Registration flow
│   │   └── ...
│   ├── components/       # Reusable React components
│   ├── lib/              # Utility functions and database interactions
│   └── types/            # TypeScript type definitions
├── db/                   # Database files and migrations
├── public/               # Static files
└── ...
```

## 🔧 Technology Stack

### Frontend

- **Next.js** - React framework with server-side rendering and static site generation
- **React** - UI component library
- **TailwindCSS** - Utility-first CSS framework
- **WebAuthn API** - Web standard for passwordless authentication

### Authentication

- **NextAuth.js** - Flexible authentication for Next.js
- **WebAuthn/FIDO2** - Industry standard for biometric authentication
- **Credential Management API** - Browser API for credential storage

### Backend & Database

- **Next.js API Routes** - Serverless API endpoints
- **SQLite** - Lightweight, file-based database
- **better-sqlite3** - High-performance SQLite3 library for Node.js

### Security

- **Bcrypt** - Password hashing algorithm
- **HTTP-Only Cookies** - Secure session storage
- **CSP Headers** - Content Security Policy implementation

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Authentication Flow

1. **Registration**:

   - User provides initial credentials
   - System prompts for biometric enrollment
   - Account is created with both authentication options

2. **Login**:
   - User initiates login
   - Biometric verification is attempted first
   - Falls back to password if biometrics unavailable

## 🔒 Security Considerations

This project implements several security best practices:

- Passwords are never stored in plain text
- Biometric data never leaves the user's device
- CSRF protection is enabled
- Strict CSP headers prevent XSS attacks
- Rate limiting prevents brute force attempts

## 📚 Learn More

- [WebAuthn API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [FIDO2 Standard](https://fidoalliance.org/fido2/)

## 📝 License

This project is licensed under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
