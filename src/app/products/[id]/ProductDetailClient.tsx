'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faShoppingBag, faTimes, faBars, faMagic, faUser, faSignOutAlt, faStar, faCreditCard, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { motion, useInView } from 'framer-motion';
import { getSupabase, isAdminEmail } from '@/lib/supabase';

interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    quantity: number;
    description: string;
    item_code?: string;
    meta_title?: string;
    meta_description?: string;
    slug?: string;
    image_alt?: string;
    sku?: string;
    short_benefit?: string;
    benefits?: string;
    how_to_use?: string;
    ingredients?: string;
}

interface CartItem {
    product_id: string;
}

interface Review {
    id: string;
    product_id: string;
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
    user_profiles?: {
        name: string;
    };
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    return (
        <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }} transition={{ duration: 0.8, delay, ease: [0.25, 0.25, 0.25, 0.75] }}>
            {children}
        </motion.div>
    );
}

export default function ProductDetailClient({ 
    initialProduct, 
    initialRelatedProducts, 
    initialReviews 
}: { 
    initialProduct: Product; 
    initialRelatedProducts: Product[]; 
    initialReviews: Review[];
}) {
    const { id } = useParams();
    const productId = initialProduct.id;
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [cart, setCart] = useState<any[]>([]);
    const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [product, setProduct] = useState<Product>(initialProduct);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>(initialRelatedProducts);
    const [loading, setLoading] = useState(false);
    
    // Auth & UI States
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Review States
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [averageRating, setAverageRating] = useState(() => {
        if (initialReviews.length === 0) return 5;
        const avg = initialReviews.reduce((acc, r) => acc + r.rating, 0) / initialReviews.length;
        return Math.round(avg * 10) / 10;
    });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const supabase = getSupabase();
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setIsAdmin(isAdminEmail(user?.email));
            if (user) loadCartFromDb(user.id);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setIsAdmin(isAdminEmail(session?.user?.email));
            if (session?.user) loadCartFromDb(session.user.id);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        setProduct(initialProduct);
        setRelatedProducts(initialRelatedProducts);
        setReviews(initialReviews);
        if (initialReviews.length > 0) {
            const avg = initialReviews.reduce((acc, r) => acc + r.rating, 0) / initialReviews.length;
            setAverageRating(Math.round(avg * 10) / 10);
        } else {
            setAverageRating(5);
        }
    }, [initialProduct, initialRelatedProducts, initialReviews]);

    const loadReviews = async () => {
        const supabase = getSupabase();
        const { data } = await supabase
            .from('product_reviews')
            .select('*, user_profiles(name)')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });
        
        if (data) {
            setReviews(data);
            if (data.length > 0) {
                const avg = data.reduce((acc, r) => acc + r.rating, 0) / data.length;
                setAverageRating(Math.round(avg * 10) / 10);
            }
        }
    };

    const submitReview = async () => {
        if (!user) {
            setAuthModalOpen(true);
            return;
        }
        if (!newComment.trim()) return;

        setSubmittingReview(true);
        const supabase = getSupabase();
        const { error } = await supabase
            .from('product_reviews')
            .insert({
                product_id: productId,
                user_id: user.id,
                rating: newRating,
                comment: newComment
            });
        
        if (!error) {
            setNewComment('');
            setNewRating(5);
            loadReviews();
        } else {
            alert('Error submitting review: ' + error.message);
        }
        setSubmittingReview(false);
    };

    const loadProductDetails = async () => {
        // No-op, data handled by parent server component or useEffect update
    };

    const loadCartFromDb = async (userId: string) => {
        const supabase = getSupabase();
        const { data } = await supabase.from('carts').select('items').eq('user_id', userId).single();
        if (data?.items && data.items.length > 0) {
            const productIds = data.items.map((item: CartItem) => item.product_id).filter(Boolean);
            if (productIds.length > 0) {
                const { data: productsData } = await supabase.from('products').select('*').in('id', productIds);
                const cartWithProducts: any[] = [];
                for (const item of data.items) {
                    const product = productsData?.find(p => p.id === item.product_id);
                    if (product) cartWithProducts.push(product);
                }
                setCart(cartWithProducts);
            }
        }
    };

    const saveCartToDb = async (userId: string, cartItems: CartItem[]) => {
        const supabase = getSupabase();
        await supabase.from('carts').upsert({
            user_id: userId,
            items: cartItems,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    };

    const addToCart = (p: Product) => {
        const newCart = [...cart, p];
        setCart(newCart);
        setCartOpen(true);
        if (user) {
            const dbCart = newCart.map(item => ({ product_id: item.id }));
            saveCartToDb(user.id, dbCart);
        }
    };

    const removeFromCart = (index: number) => {
        const newCart = cart.filter((_, i) => i !== index);
        setCart(newCart);
        if (user) {
            const dbCart = newCart.map(item => ({ product_id: (item as any).id }));
            saveCartToDb(user.id, dbCart);
        }
    };

    const handleBuyNow = (p: Product) => {
        const newCart = [...cart, p];
        setCart(newCart);
        if (user) {
            const dbCart = newCart.map(item => ({ product_id: item.id }));
            saveCartToDb(user.id, dbCart).then(() => router.push('/checkout'));
        } else {
            setAuthModalOpen(true);
        }
    };

    const handleAuth = async () => {
        setAuthLoading(true);
        setAuthError('');
        try {
            const supabase = getSupabase();
            if (authMode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ 
                    email, password,
                    options: { data: { name, contact_number: phoneNumber } }
                });
                if (error) throw error;
            }
            setAuthModalOpen(false);
        } catch (err: any) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
    };

    const cartTotal = cart.reduce((sum, item) => sum + ((item as any).price || 0), 0);

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)' }}>Loading Product...</div>;
    if (!product) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)' }}>Product not found.</div>;

    return (
        <div style={{ paddingTop: 'var(--header-height)' }}>
            <motion.header className={`header ${scrolled ? 'scrolled' : ''}`} initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.6 }}>
                <div className="container nav-content">
                    <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
                        <img src="/logo.png" alt="SkinTalk" style={{ height: 90, objectFit: 'contain' }} />
                    </div>
                    <nav className="nav-links">
                        <a onClick={() => router.push('/')} className="nav-link" style={{ cursor: 'pointer' }}>Home</a>
                        <a onClick={() => router.push('/products')} className="nav-link active" style={{ cursor: 'pointer' }}>Shop</a>
                        <a onClick={() => router.push('/#collections')} className="nav-link" style={{ cursor: 'pointer' }}>Collections</a>
                    </nav>
                    <div className="nav-actions">
                        {user ? (
                            <button className="icon-btn" onClick={handleLogout} title="Logout"><FontAwesomeIcon icon={faSignOutAlt} /></button>
                        ) : (
                            <button className="icon-btn" onClick={() => setAuthModalOpen(true)} title="Login"><FontAwesomeIcon icon={faUser} /></button>
                        )}
                        <button className="icon-btn cart-trigger" onClick={() => setCartOpen(true)}>
                            <FontAwesomeIcon icon={faShoppingBag} />
                            {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
                        </button>
                        <button className="icon-btn mobile-menu-trigger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><FontAwesomeIcon icon={faBars} /></button>
                    </div>
                </div>
            </motion.header>

            <section style={{ padding: '60px 0' }}>
                <div className="container">
                    <div style={{ marginBottom: '2rem' }}>
                        <a 
                            onClick={() => router.push('/products')} 
                            style={{ 
                                cursor: 'pointer', 
                                color: '#888', 
                                fontSize: '0.9rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                transition: 'color 0.2s',
                                width: 'fit-content'
                            }}
                            className="back-btn"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} /> Back to Shop
                        </a>
                    </div>
                    <div className="pdp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
                        {/* Left: Product Image Gallery */}
                        <FadeIn>
                            <div className="product-gallery">
                                <motion.img 
                                    src={product.image} 
                                    alt={product.image_alt || product.name} 
                                    style={{ width: '100%', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </FadeIn>

                        {/* Right: Product Info */}
                        <FadeIn delay={0.2}>
                            <div className="product-details">
                                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '1rem', color: '#1a1a1a' }}>{product.name}</h1>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: '500', color: '#333' }}>LKR {product.price.toFixed(2)}</h2>
                                    <div style={{ color: '#FFD700', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <FontAwesomeIcon 
                                                    key={star} 
                                                    icon={faStar} 
                                                    style={{ color: star <= Math.round(averageRating) ? '#FFD700' : '#ddd' }} 
                                                />
                                            ))}
                                        </div>
                                        <span style={{ color: '#888', fontSize: '0.9rem', fontWeight: '400' }}>({reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'})</span>
                                    </div>
                                </div>

                                {product.short_benefit && (
                                    <p style={{ fontSize: '1.1rem', color: '#555', marginBottom: '2rem', fontStyle: 'italic' }}>
                                        &quot;{product.short_benefit}&quot;
                                    </p>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                                    {(!product.quantity || product.quantity <= 0) ? (
                                        <p style={{ color: '#d9534f', fontWeight: 'bold' }}>Out of Stock</p>
                                    ) : (
                                        <>
                                            <motion.button 
                                                className="hero-cta" 
                                                style={{ width: '100%', background: '#000', color: '#fff', border: 'none' }}
                                                onClick={() => handleBuyNow(product)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                🟢 Buy Now
                                            </motion.button>
                                            <motion.button 
                                                className="hero-cta" 
                                                style={{ width: '100%', background: 'transparent', color: '#000', border: '1px solid #000' }}
                                                onClick={() => addToCart(product)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                Add to Cart
                                            </motion.button>
                                        </>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '0.85rem', color: '#777', margin: 0 }}>Secure Payment</p>
                                    <img src="/lankaQR.png" alt="LankaQR" style={{ height: '24px', objectFit: 'contain' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', color: '#555', alignItems: 'center' }}>
                                        <FontAwesomeIcon icon={faCreditCard} style={{ fontSize: '1.2rem' }} />
                                        <span style={{ fontSize: '0.75rem' }}>Card</span>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Detailed Content Sections */}
                    <div style={{ marginTop: '5rem', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                        <FadeIn>
                            <div style={{ borderTop: '1px solid #eee', paddingTop: '4rem' }}>
                                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '1.5rem' }}>Product Description</h3>
                                <p style={{ color: '#666', lineHeight: '1.8', fontSize: '1.05rem', whiteSpace: 'pre-line' }}>{product.description}</p>
                            </div>
                        </FadeIn>

                        {product.benefits && (
                            <FadeIn>
                                <div>
                                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '1.5rem' }}>[KEY BENEFITS]</h3>
                                    <div style={{ color: '#666', lineHeight: '1.8', fontSize: '1.05rem', whiteSpace: 'pre-line' }}>{product.benefits}</div>
                                </div>
                            </FadeIn>
                        )}

                        {product.how_to_use && (
                            <FadeIn>
                                <div>
                                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '1.5rem' }}>[HOW TO USE]</h3>
                                    <div style={{ color: '#666', lineHeight: '1.8', fontSize: '1.05rem', whiteSpace: 'pre-line' }}>{product.how_to_use}</div>
                                </div>
                            </FadeIn>
                        )}

                        {product.ingredients && (
                            <FadeIn>
                                <div>
                                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '1.5rem' }}>[INGREDIENTS]</h3>
                                    <div style={{ color: '#666', lineHeight: '1.8', fontSize: '1.05rem', whiteSpace: 'pre-line' }}>{product.ingredients}</div>
                                </div>
                            </FadeIn>
                        )}

                        <FadeIn>
                            <div style={{ borderTop: '1px solid #eee', paddingTop: '4rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>Customer Reviews</h3>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{averageRating}</div>
                                        <div style={{ color: '#FFD700' }}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <FontAwesomeIcon key={star} icon={faStar} style={{ color: star <= Math.round(averageRating) ? '#FFD700' : '#ddd' }} />
                                            ))}
                                        </div>
                                        <p style={{ color: '#888', fontSize: '0.9rem' }}>Based on {reviews.length} reviews</p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem' }}>
                                    {/* Write a Review Form */}
                                    <div style={{ position: 'sticky', top: '100px', alignSelf: 'start', background: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                                        <h4 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Write a Review</h4>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <FontAwesomeIcon 
                                                    key={star} 
                                                    icon={faStar} 
                                                    style={{ cursor: 'pointer', color: star <= newRating ? '#FFD700' : '#ddd', fontSize: '1.2rem' }}
                                                    onClick={() => setNewRating(star)}
                                                />
                                            ))}
                                        </div>
                                        <textarea 
                                            placeholder="Share your experience with this product..." 
                                            value={newComment} 
                                            onChange={(e) => setNewComment(e.target.value)}
                                            style={{ width: '100%', minHeight: '120px', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem', fontFamily: 'inherit', resize: 'vertical' }}
                                        />
                                        <button 
                                            className="hero-cta" 
                                            style={{ width: '100%', background: '#000', color: '#fff', opacity: submittingReview ? 0.7 : 1 }}
                                            onClick={submitReview}
                                            disabled={submittingReview}
                                        >
                                            {submittingReview ? 'Posting...' : 'Post Review'}
                                        </button>
                                        {!user && <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '1rem', textAlign: 'center' }}>Please sign in to post a review.</p>}
                                    </div>

                                    {/* Reviews List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        {reviews.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '4rem 0', background: '#fcfcfc', borderRadius: '12px', color: '#888' }}>
                                                No reviews yet. Be the first to share your thoughts!
                                            </div>
                                        ) : (
                                            reviews.map((review) => (
                                                <div key={review.id} style={{ padding: '2rem', background: '#fff', borderRadius: '12px', border: '1px solid #f9f9f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                        <div>
                                                            <h5 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{review.user_profiles?.name || 'Verified Customer'}</h5>
                                                            <div style={{ color: '#FFD700', fontSize: '0.8rem', display: 'flex', gap: '2px' }}>
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <FontAwesomeIcon key={star} icon={faStar} style={{ color: star <= review.rating ? '#FFD700' : '#ddd' }} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{new Date(review.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p style={{ color: '#555', lineHeight: '1.6', fontSize: '1rem' }}>{review.comment}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Related Products */}
                    {relatedProducts.length > 0 && (
                        <div style={{ marginTop: '8rem' }}>
                            <FadeIn><h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '4rem', textAlign: 'center' }}>You Might Also Love</h3></FadeIn>
                            <div className="products-grid">
                                {relatedProducts.map((p, idx) => (
                                    <FadeIn key={p.id} delay={idx * 0.1}>
                                        <motion.div className="product-card" whileHover={{ y: -10 }} onClick={() => router.push(`/products/${p.slug || p.id}`)} style={{ cursor: 'pointer' }}>
                                            <div className="product-image-container">
                                                <img src={p.image} alt={p.name} className="product-img" />
                                            </div>
                                            <div className="product-info">
                                                <h3>{p.name}</h3>
                                                <p className="product-price">LKR {p.price.toFixed(2)}</p>
                                            </div>
                                        </motion.div>
                                    </FadeIn>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

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

            {/* Sidebar & Modal Overlays */}
            <div className={`sidebar-overlay ${cartOpen || authModalOpen ? 'active' : ''}`} onClick={() => { setCartOpen(false); setAuthModalOpen(false); }}></div>
            
            <div className={`sidebar ${cartOpen ? 'active' : ''}`} id="cart-sidebar">
                <div className="sidebar-header">
                    <h3>Your Beauty Cart</h3>
                    <button className="icon-btn close-cart" onClick={() => setCartOpen(false)}><FontAwesomeIcon icon={faTimes} /></button>
                </div>
                <div className="sidebar-content">
                    {cart.length === 0 ? <p className="empty-cart">Your Cart is empty.</p> : cart.map((item: any, index: number) => (
                        <div className="cart-item" key={index}>
                            <img src={item.image} alt={item.name} className="cart-item-img" />
                            <div className="cart-item-info"><h4>{item.name}</h4><p>LKR {(item.price || 0).toFixed(2)}</p><button onClick={() => removeFromCart(index)}>Remove</button></div>
                        </div>
                    ))}
                </div>
                {cart.length > 0 && (
                    <div className="sidebar-footer">
                        <div className="cart-total"><span>Subtotal</span><span>LKR {cartTotal.toFixed(2)}</span></div>
                        <button className="hero-cta" style={{ width: '100%' }} onClick={() => { if (user) { setCartOpen(false); router.push('/checkout'); } else { setCartOpen(false); setAuthModalOpen(true); } }}>Proceed to Checkout</button>
                    </div>
                )}
            </div>

            {authModalOpen && (
                <div className="auth-modal-overlay" onClick={() => setAuthModalOpen(false)}>
                    <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="auth-close" onClick={() => setAuthModalOpen(false)}><FontAwesomeIcon icon={faTimes} /></button>
                        <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                        <div className="auth-form">
                            {authMode === 'signup' && (
                                <>
                                    <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                                    <input type="tel" placeholder="Contact Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                                </>
                            )}
                            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <button className="hero-cta" onClick={handleAuth} disabled={authLoading} style={{ width: '100%' }}>{authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}</button>
                            <p onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={{ textAlign: 'center', marginTop: '1rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                {authMode === 'login' ? 'Don\'t have an account? Sign Up' : 'Already have an account? Login'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx global>{`
                .pdp-grid {
                    grid-template-columns: 1.2fr 1fr;
                }
                @media (max-width: 968px) {
                    .pdp-grid {
                        grid-template-columns: 1fr;
                        gap: 2rem;
                    }
                }
            `}</style>
        </div>
    );
}
