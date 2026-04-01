import type { Metadata } from "next";
import "./globals.css";
import WhatsAppButton from "@/components/WhatsAppButton";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library, config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { faSearch, faShoppingBag, faTimes, faMagic, faBars, faStar, faCreditCard, faTruck, faUndo, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

// Prevent Font Awesome from adding its own CSS since we are importing it above
config.autoAddCss = false;

library.add(faSearch, faShoppingBag, faTimes, faMagic, faBars, faWhatsapp, faStar, faCreditCard, faTruck, faUndo, faShieldAlt);

export const metadata: Metadata = {
  metadataBase: new URL('https://www.skintalks.lk'),
  title: {
    default: "SkinTalk | Premium Clean Skincare Sri Lanka",
    template: "%s | SkinTalk",
  },
  description: "Experience the perfect blend of minimalist design and pure ingredients. Discover your glow with SkinTalk's premium clean beauty products in Sri Lanka.",
  keywords: ["skincare", "clean beauty", "organic skincare", "premium skincare", "face serums", "moisturizers", "cleansers", "Sri Lanka"],
  authors: [{ name: "SkinTalk" }],
  creator: "SkinTalk",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.skintalks.lk",
    siteName: "SkinTalk",
    title: "SkinTalk | Premium Clean Skincare Sri Lanka",
    description: "Experience the perfect blend of minimalist design and pure ingredients. Discover your glow with SkinTalk.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SkinTalk - Clean & Elegant Skincare",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SkinTalk | Premium Clean Skincare Sri Lanka",
    description: "Experience the perfect blend of minimalist design and pure ingredients.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SkinTalk",
    "description": "Premium Clean Skincare - Experience the perfect blend of minimalist design and pure ingredients.",
    "url": "https://www.skintalks.lk",
    "logo": "https://www.skintalks.lk/logo.png",
    "sameAs": [
      "https://instagram.com/skintalk",
      "https://facebook.com/skintalk"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "hello@skintalk.com"
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}