import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';
import { FirebaseClientProvider } from '@/firebase';
import { FloatingChatbot } from '@/components/chatbot/floating-chatbot';
import { AuthSessionManager } from '@/components/auth/auth-session-manager';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'CareerFlow Connect',
  description: 'Your next career move starts here.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-body antialiased`}
      >
        <FirebaseClientProvider>
          <Providers>
            <AuthSessionManager>
              {children}
              <FloatingChatbot />
              <Toaster />
            </AuthSessionManager>
          </Providers>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}