'use client';

import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faShoppingBag, faTimes, faBars, faMagic, faUser, faSignOutAlt, faMapMarkerAlt, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getSupabase, isAdminEmail, getAdminClient } from '@/lib/supabase';

interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    quantity: number;
    slug?: string;
}

interface Category {
    id: string;
    name: string;
    image_url?: string;
}

interface CartItem {
    product_id: string;
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

function ParallaxImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    return (
        <motion.div ref={ref} style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }} className={className}>
            <motion.img src={src} alt={alt} style={{ y, width: '100%', height: '120%', objectFit: 'cover', top: '-10%', left: 0, position: 'absolute' }} />
        </motion.div>
    );
}

export default function Home() {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [cart, setCart] = useState<any[]>([]);
    const [theme, setTheme] = useState('elegant');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<typeof products>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductImage, setNewProductImage] = useState<File | null>(null);
    const [newProductCategory, setNewProductCategory] = useState('');
    const [uploading, setUploading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 100);
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
            if (session?.user) {
                loadCartFromDb(session.user.id);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

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
                    email, 
                    password,
                    options: {
                        data: {
                            name: name,
                            contact_number: phoneNumber
                        }
                    }
                });
                if (error) throw error;
            }
            setAuthModalOpen(false);
            setEmail('');
            setPassword('');
            setName('');
            setPhoneNumber('');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
            setAuthError(errorMessage);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
    };

    const saveCartToDb = async (userId: string, cartItems: CartItem[]) => {
        const supabase = getSupabase();
        await supabase.from('carts').upsert({
            user_id: userId,
            items: cartItems,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    };

    const loadCartFromDb = async (userId: string) => {
        const supabase = getSupabase();
        const { data } = await supabase.from('carts').select('items').eq('user_id', userId).single();
        if (data?.items && data.items.length > 0) {
            const productIds = data.items.map((item: CartItem) => item.product_id).filter(Boolean);
            if (productIds.length === 0) {
                setCart([]);
                return;
            }
            const { data: productsData } = await supabase.from('products').select('*').in('id', productIds);
            const cartWithProducts: any[] = [];
            for (const item of data.items) {
                const product = productsData?.find(p => p.id === item.product_id);
                if (product) cartWithProducts.push(product);
            }
            setCart(cartWithProducts);
        }
    };

    const loadProducts = async () => {
        const supabase = getSupabase();
        const { data } = await supabase.from('products').select('*');
        if (data) setProducts(data);
    };

    const loadCategories = async () => {
        const supabase = getSupabase();
        const { data } = await supabase.from('categories').select('*');
        if (data) setCategories(data);
    };

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    const handleAddProduct = async () => {
        if (!newProductName || !newProductPrice) {
            alert('Please enter product name and price');
            return;
        }
        const adminClient = getAdminClient();
        if (!adminClient) {
            alert('Admin access not configured');
            return;
        }

        setUploading(true);
        let imageUrl = '/WhatsApp Image 2026-03-23 at 9.10.39 AM.jpeg';

        if (newProductImage) {
            const fileExt = newProductImage.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await adminClient.storage
                .from('products')
                .upload(fileName, newProductImage);

            if (uploadError) {
                alert('Error uploading image: ' + uploadError.message);
                setUploading(false);
                return;
            }

            const { data: { publicUrl } } = adminClient.storage
                .from('products')
                .getPublicUrl(fileName);
            imageUrl = publicUrl;
        }

        const { error } = await adminClient.from('products').insert({
            name: newProductName,
            price: parseFloat(newProductPrice),
            image: imageUrl,
            category: newProductCategory
        });
        if (error) {
            alert('Error adding product: ' + error.message);
        } else {
            setNewProductName('');
            setNewProductPrice('');
            setNewProductImage(null);
            setNewProductCategory('General');
            loadProducts();
            alert('Product added successfully!');
        }
        setUploading(false);
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        const adminClient = getAdminClient();
        if (!adminClient) {
            alert('Admin access not configured');
            return;
        }
        const { error } = await adminClient.from('products').delete().eq('id', productId);
        if (error) {
            alert('Error deleting product: ' + error.message);
        } else {
            loadProducts();
            alert('Product deleted successfully!');
        }
    };

    const handleCheckout = async () => {
        if (!user) {
            setCartOpen(false);
            setAuthModalOpen(true);
        } else {
            setCheckoutLoading(true);
            const orderItems = cart.map(item => ({ product_id: (item as any).id }));
            
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'place_order',
                    data: {
                        userId: user.id,
                        items: orderItems,
                        total: cartTotal
                    },
                    userEmail: user.email
                })
            });
            const json = await res.json();
            
            setCheckoutLoading(false);
            
            if (json.error) {
                alert('Error placing order: ' + json.error);
                return;
            }
            await saveCartToDb(user.id, []);
            alert('Order placed successfully!');
            setCart([]);
            setCartOpen(false);
            loadProducts();
        }
    };

    const addToCart = (product: typeof products[0]) => {
        const newCart = [...cart, product];
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
        if (user) saveCartToDb(user.id, newCart);
    };

    const cartTotal = cart.reduce((sum, item) => sum + ((item as any).price || 0), 0);

    useEffect(() => {
        if (theme === 'glow') {
            document.documentElement.style.setProperty('--bg-color', '#fffdfd');
            document.documentElement.style.setProperty('--accent', '#4caf50');
        } else {
            document.documentElement.style.setProperty('--bg-color', '#ffffff');
            document.documentElement.style.setProperty('--accent', '#2d5a27');
        }
    }, [theme]);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            setSearchResults(products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())));
            setShowSearch(true);
        }
    };

    return (
        <>
            <motion.header className={`header ${scrolled ? 'scrolled' : ''}`} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="announcement-bar">
                    <span className="arrow arrow-left"><FontAwesomeIcon icon={faChevronLeft} /></span>
                    <p>Free delivery on orders over LKR 5000</p>
                    <span className="arrow arrow-right"><FontAwesomeIcon icon={faChevronRight} /></span>
                </div>
                
                <div className="main-header">
                    <div className="header-search">
                        <input 
                            type="text" 
                            placeholder="SEARCH" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                        />
                        <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    </div>

                    <div className="logo-container" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
                        <img src="/logo.png" alt="SkinTalk" className="logo-img" />
                    </div>

                    <div className="header-actions">
                        <button className="header-action-btn" title="Location">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                        </button>
                        {user ? (
                            <button className="header-action-btn" onClick={handleLogout} title="Logout">
                                <FontAwesomeIcon icon={faSignOutAlt} />
                            </button>
                        ) : (
                            <button className="header-action-btn" onClick={() => setAuthModalOpen(true)} title="Login">
                                <FontAwesomeIcon icon={faUser} />
                            </button>
                        )}
                        <button className="header-action-btn cart-trigger" onClick={() => setCartOpen(true)} style={{ position: 'relative' }}>
                            <FontAwesomeIcon icon={faShoppingBag} />
                            {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
                        </button>
                        <button className="header-action-btn mobile-menu-trigger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <FontAwesomeIcon icon={faBars} />
                        </button>
                    </div>
                </div>

                <div className="sub-header">
                    <nav className="cat-nav">
                        <ul className="cat-nav-links">
                            <li><a href="#home" className="cat-nav-link">Home</a></li>
                            {categories.map((cat) => (
                                <li key={cat.id}>
                                    <a 
                                        href={`/products?category=${cat.name}`} 
                                        className="cat-nav-link"
                                    >
                                        {cat.name}
                                    </a>
                                </li>
                            ))}
                            <li><a href="/about" className="cat-nav-link">About Us</a></li>
                        </ul>
                    </nav>
                </div>
            </motion.header>

            <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
                <nav className="mobile-nav">
                    <a href="#home" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Home</a>
                    <a href="#shop" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Shop</a>
                    <a href="#collections" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Collections</a>
                    <a href="#about" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Our Story</a>
                </nav>
            </div>

            <section className="hero" id="home">
                <div className="container">
                    <div className="hero-content">
                        <FadeIn><p className="hero-subtitle">Premium Skincare</p></FadeIn>
                        <FadeIn delay={0.1}><h1 className="hero-title">Radiate<br />Confidence</h1></FadeIn>
                        <FadeIn delay={0.2}><p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2.5rem', maxWidth: 450 }}>Experience the perfect blend of minimalist design and pure ingredients. Discover your glow with SkinTalk. Launch Offer get 10% discount on every QR payment</p></FadeIn>
                        <FadeIn delay={0.3}><a href="#shop" className="hero-cta">Shop Now</a></FadeIn>
                    </div>
                    <div className="hero-image-pane"><ParallaxImage src="/skintalk-hero.png" alt="Lady holding SkinTalk product" className="hero-img" /></div>
                </div>
            </section>

            <section className="collections" id="collections">
                <div className="container">
                    <FadeIn><h2 className="section-title">Product Categories</h2></FadeIn>
                    <div className="collections-grid">
                        {categories.map((cat, index) => (
                            <FadeIn key={cat.id} delay={index * 0.15}>
                                <motion.div 
                                    className="collection-card" 
                                    whileHover={{ scale: 1.02 }} 
                                    transition={{ duration: 0.3 }}
                                    onClick={() => router.push(`/products?category=${cat.name}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <img src={cat.image_url || "/WhatsApp Image 2026-03-23 at 9.10.39 AM.jpeg"} alt={cat.name} className="collection-img" />
                                    <div className="collection-overlay">
                                        <h2 className="collection-title">{cat.name}</h2>
                                        <p>Clean Beauty Choice</p>
                                    </div>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <section className="products" id="shop">
                <div className="container">
                    <FadeIn><h2 className="section-title">New Arrivals</h2></FadeIn>
                    <div className="products-grid">
                        {products.map((product, index) => (
                            <FadeIn key={product.id} delay={index * 0.1}>
                                <motion.div className="product-card" whileHover={{ y: -10 }} transition={{ duration: 0.3 }}>
                                    <div className="product-image-container">
                                        <img 
                                            src={product.image} 
                                            alt={product.name} 
                                            className="product-img" 
                                            onClick={() => router.push(`/products/${product.slug || product.id}`)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        {(!product.quantity || product.quantity <= 0) ? (
                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.85rem' }}>Out of Stock</div>
                                        ) : (
                                            <motion.button className="quick-add" onClick={() => addToCart(product)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Add to Cart</motion.button>
                                        )}
                                    </div>
                                    <div className="product-info" onClick={() => router.push(`/products/${product.slug || product.id}`)} style={{ cursor: 'pointer' }}>
                                        <h3>{product.name}</h3>
                                        <p className="product-price">LKR {product.price.toFixed(2)}</p>
                                    </div>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                    <FadeIn delay={0.4}>
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <button className="hero-cta" onClick={() => router.push('/products')}>See All Products</button>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <section className="about" id="about" style={{ padding: '20px 0 100px 0', background: '#fffcfd', textAlign: 'center' }}>
                <div className="container" style={{ maxWidth: 800 }}>
                    <FadeIn><h2 className="section-title">The SkinTalk Promise</h2></FadeIn>
                    <FadeIn delay={0.1}><p style={{ fontSize: '1.1rem', color: '#777', marginBottom: '2rem' }}>Derived from nature, perfected by science. SkinTalk is committed to providing clean, effective skincare that respects your skin and the planet. No fillers, no toxins—just pure results.</p></FadeIn>
                    <FadeIn delay={0.2}><div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.3rem', color: 'var(--accent)', marginBottom: '3rem' }}>&quot;Your skin is your best accessory. Take care of it.&quot;</div></FadeIn>
                    <FadeIn delay={0.3}>
                        <button className="hero-cta" onClick={() => router.push('/about')}>Discover Our Story</button>
                    </FadeIn>
                </div>
            </section>

            <footer className="footer">
                <div className="container footer-grid">
                    <div className="footer-brand">
                        <div className="footer-logo"><span className="logo-text">SkinTalk</span><span className="logo-tagline">Clean Beauty Ethics</span></div>
                        <p style={{ color: '#777', fontSize: '0.95rem', maxWidth: 350 }}>Redefining the standard of clean beauty with products that deliver visible results without compromise.</p>
                    </div>
                    <div className="footer-col">
                        <h4>About</h4>
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
                <div className="container footer-bottom">&copy; 2026 SkinTalk Cosmetics. All rights reserved. | Website by B2U APPS</div>
            </footer>

            <div className={`sidebar-overlay ${cartOpen || authModalOpen ? 'active' : ''}`} onClick={() => { setCartOpen(false); setAuthModalOpen(false); }}></div>
            
            <div className={`sidebar ${cartOpen ? 'active' : ''}`} id="cart-sidebar">
                <div className="sidebar-header">
                    <h3>Your Beauty Cart</h3>
                    <button className="icon-btn close-cart" onClick={() => setCartOpen(false)}><FontAwesomeIcon icon={faTimes} /></button>
                </div>
                <div className="sidebar-content">
                    {cart.length === 0 ? <p className="empty-cart">Your Cart is empty.</p> : cart.map((item: any, index: number) => {
                        if (!item || !item.name) return null;
                        return (
                        <div className="cart-item" key={index}><img src={item.image} alt={item.name} className="cart-item-img" /><div className="cart-item-info"><h4>{item.name}</h4><p>LKR {(item.price || 0).toFixed(2)}</p><button onClick={() => removeFromCart(index)}>Remove</button></div></div>
                        );
                    })}
                </div>
                {cart.length > 0 && <div className="sidebar-footer"><div className="cart-total"><span>Subtotal</span><span>LKR {cartTotal.toFixed(2)}</span></div><button className="hero-cta" style={{ width: '100%' }} onClick={() => { if (user) { setCartOpen(false); router.push('/checkout'); } else { setCartOpen(false); setAuthModalOpen(true); } }}>Proceed to Checkout</button></div>}
            </div>

            {isAdmin && <motion.button className="admin-trigger" id="admin-trigger" onClick={() => router.push('/admin')} whileHover={{ rotate: 45, scale: 1.1 }} whileTap={{ scale: 0.9 }}><FontAwesomeIcon icon={faMagic} /></motion.button>}

            {showSearch && (
                <div className="search-modal-overlay" onClick={() => setShowSearch(false)}>
                    <div className="search-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="search-modal-header">
                            <h3>Search Results</h3>
                            <button className="icon-btn" onClick={() => { setShowSearch(false); setSearchQuery(''); }}><FontAwesomeIcon icon={faTimes} /></button>
                        </div>
                        <div className="search-results">
                            {searchResults.length > 0 ? (
                                <div className="products-grid">
                                    {searchResults.map((product) => (
                                        <div className="product-card" key={product.id}>
                                            <div className="product-image-container">
                                                <img 
                                                    src={product.image} 
                                                    alt={product.name} 
                                                    className="product-img" 
                                                    onClick={() => { router.push(`/products/${product.slug || product.id}`); setShowSearch(false); }}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                {(!product.quantity || product.quantity <= 0) ? (
                                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.85rem' }}>Out of Stock</div>
                                                ) : (
                                                    <button className="quick-add" onClick={() => { addToCart(product); setShowSearch(false); setSearchQuery(''); }}>Add to Cart</button>
                                                )}
                                            </div>
                                            <div className="product-info" onClick={() => { router.push(`/products/${product.slug || product.id}`); setShowSearch(false); }} style={{ cursor: 'pointer' }}>
                                                <h3>{product.name}</h3>
                                                <p className="product-price">LKR {product.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No products found for &quot;{searchQuery}&quot;</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {authModalOpen && (
                <div className="auth-modal-overlay" onClick={() => setAuthModalOpen(false)}>
                    <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="auth-close" onClick={() => setAuthModalOpen(false)}><FontAwesomeIcon icon={faTimes} /></button>
                        <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                        <p style={{ color: '#777', marginBottom: '1.5rem' }}>{authMode === 'login' ? 'Sign in to continue to checkout' : 'Create an account to place your order'}</p>
                        {authError && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '1rem' }}>{authError}</p>}
                        <div className="auth-form">
                            {authMode === 'signup' && (
                                <>
                                    <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAuth()} />
                                    <input type="tel" placeholder="Contact Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAuth()} />
                                </>
                            )}
                            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAuth()} />
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAuth()} />
                            <button className="hero-cta" onClick={handleAuth} disabled={authLoading} style={{ width: '100%' }}>{authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}</button>
                        </div>
                        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                            <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>{authMode === 'login' ? 'Sign Up' : 'Sign In'}</button>
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}