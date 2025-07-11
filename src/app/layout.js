// app/layout.js
import localFont from "next/font/local";
import "./globals.css";
import ClientLayout from "./client-layout";
import { AuthProvider } from '@/contexts/AuthContext'
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { fetchCartItems } from '@/lib/service/cartService';
import { transformCartForCheckout } from '@/lib/utils/cartTransformUtils';
import ClientOnly from '../components/ClientOnly.jsx';

// Montserrat for paragraphs and spans
const montserrat = localFont({
  src: '../../public/fonts/Montserrat-Regular.ttf',
  variable: '--font-montserrat',
  display: 'swap',
});

// Sansation for headings and buttons
const sansation = localFont({
  src: '../../public/fonts/Sansation-Regular.ttf',
  variable: '--font-sansation',
  display: 'swap',
});

export const metadata = {
  title: "Rabbit Auto Care",
  description: "Your one-stop shop for auto care products",
};

export default async function RootLayout({ children }) {
  // SSR: Get user session and userId
  let initialCartItems = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (userId) {
      const rawCartItems = await fetchCartItems(userId);
      initialCartItems = await transformCartForCheckout(rawCartItems, userId);
    }
  } catch (e) {
    // Fail silently, fallback to empty cart
    initialCartItems = [];
  }

  return (
    <html lang="en" className={`${montserrat.variable} ${sansation.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientOnly>
          <AuthProvider>
            {/* ✅ ScrollSmoother wrapper */}
            <div id="smooth-wrapper">
              <div id="smooth-content">
                <ClientLayout initialCartItems={initialCartItems}>{children}</ClientLayout>
              </div>
            </div>
          </AuthProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
