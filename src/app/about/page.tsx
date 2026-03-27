'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faShoppingBag, faBars, faUser, faSearch, faSignOutAlt, faLeaf, faUsers, faStar, faHandHoldingHeart } from '@fortawesome/free-solid-svg-icons';
import { getSupabase, isAdminEmail } from '@/lib/supabase';
import dynamic from 'next/dynamic';
const Header = dynamic(() => import('@/components/Header'), { ssr: false });
import Footer from '@/components/Footer';

interface Category {
    id: string;
    name: string;
}

export default function AboutPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        window.scrollTo(0, 0);
        const supabase = getSupabase();
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });

        const loadCategories = async () => {
            const { data } = await supabase.from('categories').select('*').order('name');
            if (data) setCategories(data);
        };
        loadCategories();
    }, []);

    const handleLogout = async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        router.refresh();
    };

    return (
        <div style={{ background: '#fffcfd', minHeight: '100vh' }}>
            <Header 
                user={user}
                cartCount={0}
                onLogout={handleLogout}
                onLoginClick={() => router.push('/#login')}
                onCartClick={() => router.push('/products')}
                onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
                categories={categories}
            />

            {mounted && (
                <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
                    <nav className="mobile-nav">
                        <a onClick={() => { router.push('/'); setMobileMenuOpen(false); }} className="mobile-nav-link" style={{ cursor: 'pointer' }}>Home</a>
                        <a onClick={() => { router.push('/products'); setMobileMenuOpen(false); }} className="mobile-nav-link" style={{ cursor: 'pointer' }}>Shop</a>
                        <a onClick={() => { router.push('/#collections'); setMobileMenuOpen(false); }} className="mobile-nav-link" style={{ cursor: 'pointer' }}>Collection</a>
                        <a onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="mobile-nav-link" style={{ cursor: 'pointer' }}>Our Story</a>
                    </nav>
                </div>
            )}

            <main style={{ paddingTop: '20px', paddingBottom: '60px' }}>
                <div className="container" style={{ maxWidth: '900px' }}>
                    
                    {/* Hero Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.8 }}
                        style={{ textAlign: 'center', marginBottom: '5rem' }}
                    >
                        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3.5rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Our Story</h1>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
                            Skintalks was created with a simple idea: skincare should be easy to understand, honest, and accessible to everyone.
                        </p>
                    </motion.div>

                    {/* Timeline / Content Sections */}
                    <section style={{ marginBottom: '6rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Where it all began</h2>
                                <p style={{ lineHeight: '1.8', color: 'var(--text-main)', marginBottom: '1.5rem' }}>
                                    Founded in 2020, Skintalks began with a vision to simplify skincare and make effective products available to everyone. We saw that many people struggle to find products that truly suit their skin. With so many options in the market, skincare can often feel confusing and overwhelming.
                                </p>
                                <p style={{ lineHeight: '1.8', color: 'var(--text-main)' }}>
                                    We wanted to create products that speak to your skin, using carefully selected ingredients that are gentle, effective, and suitable for everyday use.
                                </p>
                            </div>
                            <div style={{ background: '#f9f9f9', padding: '3rem', borderRadius: '20px', textAlign: 'center' }}>
                                <FontAwesomeIcon icon={faLeaf} style={{ fontSize: '4rem', color: 'var(--accent)', marginBottom: '1rem' }} />
                                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>Pure Reset</h3>
                            </div>
                        </div>
                    </section>

                    <section style={{ marginBottom: '6rem', padding: '4rem', background: '#fff', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.02)', border: '1px solid #f5f5f5' }}>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>Our Approach</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                            <div style={{ padding: '2rem', background: '#fffcfd', borderRadius: '16px' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent)' }}>The Power of Herbs</h3>
                                <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text-muted)' }}>
                                    We use powerful, locally sourced herbal ingredients, carefully selected to maintain authenticity and deliver real results. Our focus is on creating products that stay true to their roots while meeting modern skincare needs.
                                </p>
                            </div>
                            <div style={{ padding: '2rem', background: '#fffcfd', borderRadius: '16px' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent)' }}>Our Commitment</h3>
                                <ul style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text-muted)', paddingLeft: '1.2rem' }}>
                                    <li>Preserving the authenticity of herbal skincare</li>
                                    <li>Using ingredients that are locally sourced and trusted</li>
                                    <li>Effective yet gentle for everyday use</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Founder Section */}
                    <section style={{ marginBottom: '6rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                             <div style={{ borderRadius: '20px', overflow: 'hidden' }}>
                                <img src="/WhatsApp Image 2026-03-23 at 9.10.39 AM.jpeg" alt="Skintalks Vision" style={{ width: '100%', display: 'block' }} />
                             </div>
                             <div>
                                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '1.5rem' }}>Founder&apos;s Story</h2>
                                <p style={{ lineHeight: '1.8', color: '#444', marginBottom: '1.5rem' }}>
                                    Skintalks was founded with a passion for creating something meaningful in the world of skincare. The journey began with a simple goal: to develop products that are practical, effective, and accessible, without unnecessary complexity.
                                </p>
                                <p style={{ lineHeight: '1.8', color: '#444' }}>
                                    Through hands-on experience in product development and understanding what customers truly need, the vision for Skintalks slowly came to life. Every product is created with care, keeping in mind real skin concerns faced every day.
                                </p>
                             </div>
                        </div>
                    </section>

                    {/* Beliefs Grid */}
                    <section style={{ textAlign: 'center', marginBottom: '6rem' }}>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '3rem' }}>What We Believe</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                            {[
                                { icon: faBars, title: "Simplicity", desc: "Skincare should not be complicated" },
                                { icon: faStar, title: "Quality", desc: "Good quality should be affordable" },
                                { icon: faLeaf, title: "Heritage", desc: "The power of herbs should be preserved" },
                                { icon: faUser, title: "Confidence", desc: "Everyone deserves to feel confident" }
                            ].map((item, i) => (
                                <div key={i} style={{ padding: '2rem', background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
                                    <FontAwesomeIcon icon={item.icon} style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '1.5rem' }} />
                                    <h4 style={{ marginBottom: '0.5rem' }}>{item.title}</h4>
                                    <p style={{ fontSize: '0.85rem', color: '#888' }}>{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Final CTA/Promise */}
                    <section style={{ textAlign: 'center', padding: '5rem 0', background: 'var(--accent)', borderRadius: '30px', color: '#fff' }}>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '1.5rem' }}>Our Promise</h2>
                        <p style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2.5rem', opacity: 0.9 }}>
                            We are committed to creating products that are gentle, effective, and fit into your daily routine. Skintalks is more than skincare—it&apos;s a conversation with your skin.
                        </p>
                        <button 
                            onClick={() => router.push('/products')} 
                            style={{ 
                                padding: '1.2rem 3rem', 
                                background: '#fff', 
                                color: 'var(--accent)', 
                                border: 'none', 
                                borderRadius: '50px', 
                                fontWeight: '600', 
                                cursor: 'pointer',
                                fontSize: '1.1rem'
                            }}
                        >
                            Explore Collection
                        </button>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
