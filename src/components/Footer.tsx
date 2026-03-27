'use client';

import React, { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faInstagram, 
    faFacebook, 
    faTiktok, 
    faYoutube 
} from '@fortawesome/free-brands-svg-icons';
import Link from 'next/link';

interface Category {
    id: string;
    name: string;
}
import { 
    faChevronDown, 
    faArrowRight, 
    faTruck, 
    faLeaf, 
    faShieldAlt, 
    faHandsHelping 
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

const Footer = () => {
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const supabase = getSupabase();
                const { data, error } = await supabase
                    .from('categories')
                    .select('id, name')
                    .order('name');
                
                if (error) throw error;
                if (data) setCategories(data);
            } catch (err) {
                console.error('Error fetching categories for footer:', err);
            }
        };
        fetchCategories();
        setMounted(true);
    }, []);

    const toggleAccordion = (id: string) => {
        setActiveAccordion(activeAccordion === id ? null : id);
    };

    const FooterSection = ({ id, title, links }: { id: string; title: string; links: { label: string; href: string }[] }) => (
        <div className="footer-col">
            <h4 className="footer-title">{title}</h4>
            <ul className="footer-links">
                {links.map((link, index) => (
                    <li key={index}>
                        <Link href={link.href}>
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <footer className="site-footer">
            {/* Value Propositions / Pre-Footer */}
            <div className="footer-values">
                <div className="container">
                    <div className="values-grid">
                        <div className="value-item">
                            <FontAwesomeIcon icon={faLeaf} />
                            <div>
                                <h5>100% Vegan</h5>
                                <p>Ethically sourced ingredients</p>
                            </div>
                        </div>
                        <div className="value-item">
                            <FontAwesomeIcon icon={faShieldAlt} />
                            <div>
                                <h5>Clean Beauty</h5>
                                <p>No harmful chemicals</p>
                            </div>
                        </div>
                        <div className="value-item">
                            <FontAwesomeIcon icon={faTruck} />
                            <div>
                                <h5>Fast Delivery</h5>
                                <p>Island-wide shipping</p>
                            </div>
                        </div>
                        <div className="value-item">
                            <FontAwesomeIcon icon={faHandsHelping} />
                            <div>
                                <h5>Fair Trade</h5>
                                <p>Supporting local communities</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Primary Footer Content with Migrated Background */}
            <div className="footer-primary-content">
                <div className="footer-main">
                    <div className="container">
                        <div className="footer-grid-5">
                            <FooterSection id="support" title="Help & support" links={[
                                { label: 'Help & FAQs', href: '/help' },
                                { label: 'Where is my order?', href: '/track' },
                                { label: 'Delivery & Returns', href: '/terms' },
                                { label: 'Contact us', href: '/about' },
                                { label: 'How to make a complaint', href: '#' },
                                { label: '45 day money back guarantee', href: '#' },
                            ]} />
                            
                            <FooterSection id="legal" title="Legal" links={[
                                { label: 'Terms & conditions of sale', href: '/terms' },
                                { label: 'Promotion terms & conditions', href: '/terms' },
                                { label: 'Reviews policy', href: '/terms' },
                                { label: 'Love Your Body Club terms & conditions', href: '/terms' },
                                { label: 'Terms of use', href: '/terms' },
                                { label: 'Privacy policy', href: '/terms' },
                            ]} />

                            <FooterSection id="shop" title="Shop with us" links={[
                                { label: 'Gift cards', href: '/products' },
                                { label: 'International markets', href: '#' },
                                { label: 'Reviews', href: '#' },
                                { label: 'Tips & advice', href: '#' }
                            ]} />

                            <FooterSection id="join" title="Join us" links={[
                                { label: 'Loyalty & Rewards Club', href: '#' },
                                { label: 'Refer a friend', href: '#' },
                                { label: 'Become an affiliate', href: '#' },
                                { label: 'Suppliers', href: '#' },
                                { label: 'Careers at SkinTalk', href: '#' }
                            ]} />

                            <FooterSection id="products" title="Our products" links={[
                                { label: 'Bestsellers', href: '/products' },
                                ...categories.map(cat => ({ 
                                    label: cat.name, 
                                    href: `/products?category=${encodeURIComponent(cat.name)}` 
                                })),
                                { label: 'Gifts', href: '/products' },
                                { label: 'Our ranges', href: '/products' }
                            ]} />
                        </div>
                    </div>
                </div>

                <div className="footer-branding">
                    <div className="container">
                        <div className="branding-content">
                            <div className="branding-logo-wrapper">
                                <img src="/logo.png" alt="SkinTalk" className="footer-large-logo" />
                            </div>
                            <div className="branding-right">
                                <div className="tagline-area">
                                    <h3>REBELLIOUS BY NATURE</h3>
                                    <p>SINCE 2024</p>
                                </div>
                                <div className="centered-socials">
                                    <Link href="#"><FontAwesomeIcon icon={faInstagram} /></Link>
                                    <Link href="#"><FontAwesomeIcon icon={faFacebook} /></Link>
                                    <Link href="#"><FontAwesomeIcon icon={faTiktok} /></Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar for legal links and payment icons */}
            <div className="footer-bottom-v2">
                <div className="container">
                    <div className="bottom-v2-grid">
                        <div className="bottom-v2-left">
                            <p>© 2026 SkinTalk Cosmetics. All rights reserved. | Website by B2U APPS</p>
                            <nav className="bottom-nav-links">
                                <Link href="/cookies">Cookies</Link>
                                <Link href="/sitemap">Site Map</Link>
                            </nav>
                        </div>
                        <div className="bottom-v2-right" suppressHydrationWarning>
                            {mounted && (
                                <div className="payment-icons-row">
                                    <span className="payment-label">Pay with</span>
                                    <img src="/lankaQR.png" alt="LankaQR" className="payment-logo lankaqr-footer" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
