'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faShoppingBag, faBars, faUser, faSearch, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { getSupabase, isAdminEmail } from '@/lib/supabase';

export default function TermsPage() {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        
        const supabase = getSupabase();
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setIsAdmin(isAdminEmail(user?.email));
        });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        router.refresh();
    };

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 160;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div style={{ background: '#fffcfd', minHeight: '100vh' }}>
            <motion.header className={`header ${scrolled ? 'scrolled' : ''}`} initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.6 }}>
                <div className="container nav-content">
                    <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
                        <img src="/logo.png" alt="SkinTalk" style={{ height: 90, objectFit: 'contain' }} />
                    </div>
                    <nav className="nav-links">
                        <a onClick={() => router.push('/')} className="nav-link" style={{ cursor: 'pointer' }}>Home</a>
                        <a onClick={() => router.push('/products')} className="nav-link" style={{ cursor: 'pointer' }}>Shop</a>
                        <a onClick={() => router.push('/#collections')} className="nav-link" style={{ cursor: 'pointer' }}>Collections</a>
                    </nav>
                    <div className="nav-actions">
                        {user ? (
                            <button className="icon-btn" onClick={handleLogout} title="Logout"><FontAwesomeIcon icon={faSignOutAlt} /></button>
                        ) : (
                            <button className="icon-btn" onClick={() => router.push('/#login')} title="Login"><FontAwesomeIcon icon={faUser} /></button>
                        )}
                        <button className="icon-btn" onClick={() => router.push('/products')}><FontAwesomeIcon icon={faShoppingBag} /></button>
                        <button className="icon-btn mobile-menu-trigger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><FontAwesomeIcon icon={faBars} /></button>
                    </div>
                </div>
            </motion.header>

            <main style={{ paddingTop: '140px', paddingBottom: '100px' }}>
                <div className="container terms-grid">
                    {/* Sidebar */}
                    <aside className="terms-sidebar">
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '0.5rem' }}>Navigation</h4>
                            <a href="#terms" onClick={(e) => scrollToSection(e, 'terms')} style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'var(--transition)' }} className="sidebar-link">Terms & Conditions</a>
                            <a href="#qr-policy" onClick={(e) => scrollToSection(e, 'qr-policy')} style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'var(--transition)' }} className="sidebar-link">QR Payment Policy</a>
                            <a href="#return-policy" onClick={(e) => scrollToSection(e, 'return-policy')} style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'var(--transition)' }} className="sidebar-link">Return & Refund Policy</a>
                        </nav>
                        
                        <style jsx>{`
                            .sidebar-link:hover {
                                color: var(--accent) !important;
                                padding-left: 5px;
                            }
                        `}</style>
                    </aside>

                    {/* Content */}
                    <div className="terms-main-content">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ duration: 0.8 }}
                        >
                            <button 
                                onClick={() => router.back()} 
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: '#888', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem',
                                    marginBottom: '2rem',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <FontAwesomeIcon icon={faArrowLeft} /> Back
                            </button>

                            <h1 id="terms" style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', marginBottom: '3rem', color: '#1a1a1a' }}>Terms & Conditions</h1>
                            
                            <div className="terms-content" style={{ lineHeight: '1.8', color: '#444', fontSize: '1.05rem' }}>
                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>1. Introduction</h2>
                                    <p>Welcome to Skintalks. These Terms & Conditions govern your use of our website and services. By accessing or purchasing from our website, you agree to be bound by these terms.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>2. Eligibility</h2>
                                    <p>By using this website, you confirm that:</p>
                                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                        <li>You are at least 18 years old or using the site under supervision</li>
                                        <li>You provide accurate and complete information during checkout</li>
                                    </ul>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>3. Products & Services</h2>
                                    <p>Skintalks offers skincare and cosmetic products for personal use. We reserve the right to:</p>
                                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                        <li>Modify or discontinue products without notice</li>
                                        <li>Limit quantities per order</li>
                                        <li>Refuse service to anyone at our discretion</li>
                                    </ul>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>4. Pricing & Payments</h2>
                                    <p>All prices are listed in LKR (Sri Lankan Rupees). Prices are subject to change without prior notice.</p>
                                    <p style={{ marginTop: '0.5rem' }}>Accepted Payment Methods:</p>
                                    <ul style={{ paddingLeft: '1.5rem' }}>
                                        <li>LankaQR payments</li>
                                        <li>Debit/Credit Cards</li>
                                        <li>Cash on Delivery (if applicable)</li>
                                    </ul>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>5. Order Processing & Delivery</h2>
                                    <p>Orders are processed within 1–3 working days. Delivery timelines may vary based on location. Delays may occur due to unforeseen circumstances.</p>
                                    <p style={{ marginTop: '0.5rem' }}>We are not responsible for:</p>
                                    <ul style={{ paddingLeft: '1.5rem' }}>
                                        <li>Incorrect delivery details provided by the customer</li>
                                        <li>Delays caused by courier partners</li>
                                    </ul>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>6. Order Cancellation</h2>
                                    <p>Orders can be cancelled only before dispatch. Once shipped, cancellations are not permitted.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>7. Returns & Refunds</h2>
                                    <p>Returns and refunds are governed by our Return Policy. Only unused, unopened products are eligible. Damaged or incorrect items must be reported within the specified time.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>8. Product Use & Disclaimer</h2>
                                    <p>All Skintalks products are intended for external use only. Results may vary based on individual skin type.</p>
                                    <p style={{ marginTop: '0.5rem' }}>We strongly recommend performing a patch test before use. Skintalks is not liable for allergic reactions, misuse, or use without proper guidance.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>9. User Information & Privacy</h2>
                                    <p>By using our website, you agree to provide accurate information. Your data will be used for order processing, communication, and marketing (if consented). We do not sell or share your personal data with unauthorized third parties.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>10. Promotions & Discounts</h2>
                                    <p>Discounts and offers are subject to change. Only one promotion may be used per order unless stated otherwise. Skintalks reserves the right to withdraw offers at any time.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>11. Prohibited Use</h2>
                                    <p>You agree not to use the website for unlawful purposes, attempt to hack or disrupt the platform, or provide false information.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>12. Intellectual Property</h2>
                                    <p>All content including logos, images, product names, and text are the property of Skintalks and may not be used without permission.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>13. Limitation of Liability</h2>
                                    <p>Skintalks shall not be liable for indirect or consequential damages, losses resulting from use or inability to use products, or delays beyond our control.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>14. Governing Law</h2>
                                    <p>These Terms & Conditions are governed by the laws of Sri Lanka.</p>
                                </section>

                                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '4rem 0' }} />

                                <h1 id="qr-policy" style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '2rem', color: '#1a1a1a' }}>QR Payment Policy</h1>
                                
                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>1.1 QR Payment Process</h2>
                                    <p>Skintalks offers a secure QR-based payment option for faster checkout. A unique QR code will be generated at checkout which must be scanned using a supported banking app. Payment must be completed within the specified time window (e.g., 5 minutes).</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>1.2 Payment Confirmation</h2>
                                    <p>Orders will only be confirmed after successful payment verification. If payment is not completed within the time limit, the order will be automatically cancelled and the QR code will expire.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>1.3 Failed or Delayed Payments</h2>
                                    <p>If payment is made but not reflected, customers must contact support with proof of payment. Skintalks reserves the right to verify transactions before confirmation.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>1.4 Incorrect Payments</h2>
                                    <p>Skintalks is not responsible for payments made to incorrect QR codes outside the official website or manual transfer errors.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>1.5 Refunds for QR Payments</h2>
                                    <p>If an order is cancelled after successful QR payment, refunds will be processed to the original payment source where possible within 5–10 working days.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>1.6 Contact Information</h2>
                                    <p>Email: sales@skintalks.lk</p>
                                    <p>WhatsApp: 0767678984</p>
                                </section>

                                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '4rem 0' }} />

                                <h1 id="return-policy" style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '2rem', color: '#1a1a1a' }}>Return & Refund Policy</h1>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>1. Overview</h2>
                                    <p>At Skintalks, we prioritize quality, safety, and customer satisfaction. Due to the nature of skincare and cosmetic products, our return policy is designed to ensure hygiene while offering fair support to our customers.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>2. Return Eligibility</h2>
                                    <p>You may request a return or exchange if:</p>
                                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                        <li>The request is made within 3–7 days of delivery.</li>
                                        <li>The product is unused, unopened, and in original packaging.</li>
                                        <li>The product seal is intact and not tampered with.</li>
                                        <li>You provide proof of purchase (order number or receipt).</li>
                                    </ul>
                                    <p style={{ marginTop: '1rem', fontStyle: 'italic', color: '#666' }}>👉 This aligns with common cosmetic policies where unopened items are accepted due to hygiene concerns.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>3. Non-Returnable Items</h2>
                                    <p>For safety and hygiene reasons, we do NOT accept returns for:</p>
                                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                        <li>Opened or used skincare/cosmetic products.</li>
                                        <li>Products with broken seals.</li>
                                        <li>Items purchased on clearance or promotion.</li>
                                        <li>Gift cards or free promotional items.</li>
                                    </ul>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>4. Damaged, Defective, or Incorrect Items</h2>
                                    <p>We will gladly replace or refund items if:</p>
                                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                        <li>The product is damaged, leaking, or broken.</li>
                                        <li>You received the wrong item.</li>
                                        <li>There is a manufacturing defect.</li>
                                    </ul>
                                    <div style={{ marginTop: '1rem', background: '#f9f9f9', padding: '1rem', borderRadius: '4px' }}>
                                        <strong>📌 Conditions:</strong>
                                        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                            <li>Must be reported within 24–48 hours of delivery.</li>
                                            <li>Provide photos/videos as proof.</li>
                                        </ul>
                                    </div>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>5. Refund Policy</h2>
                                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                        <li>Approved refunds will be processed to the original payment method.</li>
                                        <li>Refunds may take 5–10 working days to reflect.</li>
                                        <li>Shipping charges are non-refundable unless the error is ours.</li>
                                    </ul>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>6. Exchanges</h2>
                                    <p>We offer exchanges only for damaged products or incorrect items.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>7. Return Process</h2>
                                    <p>To initiate a return, contact us via:</p>
                                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                        <li>Email: sales@skintalks.lk</li>
                                        <li>WhatsApp: 0767678984</li>
                                    </ul>
                                    <p style={{ marginTop: '1rem' }}>Please share your **Order number** and a **description of the issue**. Wait for approval before sending the item. Returns sent without approval will not be accepted.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>8. Order Cancellation</h2>
                                    <p>Orders can be cancelled only before dispatch. Once shipped, cancellation is not possible.</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '1rem' }}>9. Allergy / Skin Reaction Disclaimer</h2>
                                    <p>At Skintalks, we recommend performing a patch test before use. We are not liable for individual skin reactions unless the product is defective or expired.</p>
                                </section>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            <footer className="footer">
                <div className="container footer-grid">
                    <div className="footer-brand">
                        <div className="footer-logo"><span className="logo-text">SkinTalk</span><span className="logo-tagline">Clean Beauty Ethics</span></div>
                        <p style={{ color: '#777', fontSize: '0.95rem', maxWidth: 350 }}>Redefining the standard of clean beauty with products that deliver visible results without compromise.</p>
                    </div>
                    <div className="footer-col">
                        <h4>Explore</h4>
                        <ul>
                            <li><a onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>Home</a></li>
                            <li><a onClick={() => router.push('/products')} style={{ cursor: 'pointer' }}>Shop</a></li>
                            <li><a onClick={() => router.push('/about')} style={{ cursor: 'pointer' }}>Our Story</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Support</h4>
                        <ul>
                            <li><a onClick={() => router.push('/terms')} style={{ cursor: 'pointer' }}>Terms & Conditions</a></li>
                            <li><a href="mailto:sales@skintalks.lk">Email Us</a></li>
                            <li><a href="https://wa.me/94767678984" target="_blank">WhatsApp Us</a></li>
                        </ul>
                    </div>
                </div>
                <div className="container footer-bottom">&copy; 2026 SkinTalk Cosmetics. Artfully Crafted.</div>
            </footer>
        </div>
    );
}
