'use client';

import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faShoppingBag, faTimes, faBars, faMagic, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { motion, useInView } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getSupabase, isAdminEmail } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import Image from 'next/image';
const Header = dynamic(() => import('@/components/Header'), { ssr: false });
import Footer from '@/components/Footer';

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    quantity: number;
    slug?: string;
}

interface CartItem {
    product_id: string;
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "0px" });
    return (
        <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }} transition={{ duration: 0.8, delay, ease: [0.25, 0.25, 0.25, 0.75] }}>
            {children}
        </motion.div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)' }}>Loading...</div>}>
            <ProductsPageContent />
        </Suspense>
    );
}

function ProductsPageContent() {
    const router = useRouter();
    const [cartOpen, setCartOpen] = useState(false);
    const [cart, setCart] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
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
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get('category');

    useEffect(() => {
        if (categoryParam && products.length > 0) {
            const targetId = `category-${categoryParam.toLowerCase()}`;
            const element = document.getElementById(targetId);
            if (element) {
                setTimeout(() => {
                    const yOffset = -100;
                    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }, 500);
            }
        } else if (!categoryParam) {
            window.scrollTo(0, 0);
        }
    }, [categoryParam, products]);


    useEffect(() => {
        sessionStorage.setItem('fromProducts', 'true');
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

    const loadProducts = async () => {
        const supabase = getSupabase();
        const { data } = await supabase.from('products').select('*').order('name');
        if (data) setProducts(data);
    };

    const loadCategories = async () => {
        const supabase = getSupabase();
        const { data } = await supabase.from('categories').select('*').order('name');
        if (data) setCategories(data);
    };

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    const addToCart = (product: Product) => {
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
        if (user) {
            const dbCart = newCart.map(item => ({ product_id: (item as any).id }));
            saveCartToDb(user.id, dbCart);
        }
    };

    const cartTotal = cart.reduce((sum, item) => sum + ((item as any).price || 0), 0);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            setSearchResults(products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())));
            setShowSearch(true);
        }
    };

    const groupedProducts = products.reduce((acc, product) => {
        const cat = product.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(product);
        return acc;
    }, {} as Record<string, Product[]>);

    return (
        <div>
            <Header 
                user={user}
                cartCount={cart.length}
                onLogout={handleLogout}
                onLoginClick={() => setAuthModalOpen(true)}
                onCartClick={() => setCartOpen(true)}
                onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
                categories={categories}
            />

            <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
                <nav className="mobile-nav">
                    <a onClick={() => { router.push('/'); setMobileMenuOpen(false); }} className="mobile-nav-link" style={{ cursor: 'pointer' }}>Home</a>
                    <a onClick={() => { router.push('/products'); setMobileMenuOpen(false); }} className="mobile-nav-link" style={{ cursor: 'pointer' }}>Shop</a>
                </nav>
            </div>

            <section className="products" style={{ minHeight: '80vh', padding: '20px 0' }}>
                <div className="container">
                    <FadeIn><h1 className="section-title" style={{ marginBottom: '2rem' }}>Our Collection</h1></FadeIn>
                    
                    {Object.keys(groupedProducts).length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999', marginTop: '4rem' }}>Loading our products...</p>
                    ) : (
                        Object.keys(groupedProducts).map((category, catIndex) => (
                            <div key={category} id={`category-${category.toLowerCase()}`} style={{ marginBottom: '3rem' }}>
                                <FadeIn delay={catIndex * 0.1}>
                                    <h2 style={{ 
                                        fontSize: '1.8rem', 
                                        fontFamily: 'var(--font-serif)', 
                                        marginBottom: '1.5rem', 
                                        paddingBottom: '1rem', 
                                        borderBottom: '1px solid #f1f1f1' 
                                    }}>
                                        {category}
                                    </h2>
                                </FadeIn>
                                <div className="products-grid">
                                    {groupedProducts[category].map((product, pIndex) => (
                                        <FadeIn key={product.id} delay={pIndex * 0.05}>
                                            <motion.div className="product-card" whileHover={{ y: -10 }} transition={{ duration: 0.3 }}>
                                                <div className="product-image-container" style={{ position: 'relative' }}>
                                                    <Image 
                                                        src={product.image} 
                                                        alt={product.name} 
                                                        fill
                                                        style={{ objectFit: 'cover', cursor: 'pointer' }}
                                                        onClick={() => router.push(`/products/${product.slug || product.id}`)}
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    />
                                                    {(!product.quantity || product.quantity <= 0) && (
                                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.85rem', zIndex: 1 }}>Out of Stock</div>
                                                    )}
                                                </div>
                                                <div className="product-info" style={{ cursor: 'pointer' }}>
                                                    <div onClick={() => router.push(`/products/${product.slug || product.id}`)}>
                                                        <h3>{product.name}</h3>
                                                        <p className="product-price">LKR {product.price.toFixed(2)}</p>
                                                    </div>
                                                    {(product.quantity && product.quantity > 0) && (
                                                        <motion.button className="quick-add" onClick={() => addToCart(product)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Add to Cart</motion.button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </FadeIn>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <Footer />

            <div className={`sidebar-overlay ${cartOpen || authModalOpen ? 'active' : ''}`} onClick={() => { setCartOpen(false); setAuthModalOpen(false); }}></div>
            
            <div className={`sidebar ${cartOpen ? 'active' : ''}`} id="cart-sidebar">
                <div className="sidebar-header">
                    <h3>Your Beauty Cart</h3>
                    <button className="icon-btn close-cart" onClick={() => setCartOpen(false)}><FontAwesomeIcon icon={faTimes} /></button>
                </div>
                <div className="sidebar-content">
                    {cart.length === 0 ? <p className="empty-cart">Your Cart is empty.</p> : cart.map((item: any, index: number) => (
                        <div className="cart-item" key={index}><img src={item.image} alt={item.name} className="cart-item-img" /><div className="cart-item-info"><h4>{item.name}</h4><p>LKR {(item.price || 0).toFixed(2)}</p><button onClick={() => removeFromCart(index)}>Remove</button></div></div>
                    ))}
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
                                                <img src={product.image} alt={product.name} className="product-img" />
                                                {(!product.quantity || product.quantity <= 0) ? (
                                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.85rem' }}>Out of Stock</div>
                                                ) : (
                                                    <button className="quick-add" onClick={() => { addToCart(product); setShowSearch(false); setSearchQuery(''); }}>Add to Cart</button>
                                                )}
                                            </div>
                                            <div className="product-info"><h3>{product.name}</h3><p className="product-price">LKR {product.price.toFixed(2)}</p></div>
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
