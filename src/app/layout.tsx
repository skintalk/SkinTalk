import type { Metadata } from "next";
import "./globals.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faSearch, faShoppingBag, faTimes, faMagic, faBars } from '@fortawesome/free-solid-svg-icons';

library.add(faSearch, faShoppingBag, faTimes, faMagic, faBars);

export const metadata: Metadata = {
  metadataBase: new URL('https://skintalk.com'),
  title: {
    default: "SkinTalk | Premium Clean Skincare",
    template: "%s | SkinTalk",
  },
  description: "Experience the perfect blend of minimalist design and pure ingredients. Discover your glow with SkinTalk's premium clean beauty products.",
  keywords: ["skincare", "clean beauty", "organic skincare", "premium skincare", "face serums", "moisturizers", "cleansers"],
  authors: [{ name: "SkinTalk" }],
  creator: "SkinTalk",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://skintalk.com",
    siteName: "SkinTalk",
    title: "SkinTalk | Premium Clean Skincare",
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
    title: "SkinTalk | Premium Clean Skincare",
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
    "url": "https://skintalk.com",
    "logo": "https://skintalk.com/logo.png",
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
      <body>{children}</body>
    </html>
  );
}