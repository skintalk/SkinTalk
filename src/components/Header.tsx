'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faBars, faUser, faSignOutAlt, faChevronLeft, faChevronRight, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
    id: string;
    name: string;
}

interface HeaderProps {
    user: any;
    cartCount: number;
    onLogout: () => void;
    onLoginClick: () => void;
    onCartClick: () => void;
    onMobileMenuToggle: () => void;
    categories: Category[];
}

export default function Header({ user, cartCount, onLogout, onLoginClick, onCartClick, onMobileMenuToggle, categories }: HeaderProps) {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setScrolled(window.scrollY > 100);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
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

                <Link href="/" className="logo-container" style={{ cursor: 'pointer' }}>
                    <img src="/logo.png" alt="SkinTalk" className="logo-img" />
                </Link>

                <div className="header-actions">
                    {user ? (
                        <button className="header-action-btn" onClick={onLogout} title="Logout">
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                    ) : (
                        <button className="header-action-btn" onClick={onLoginClick} title="Login">
                            <FontAwesomeIcon icon={faUser} />
                        </button>
                    )}
                    <button className="header-action-btn cart-trigger" onClick={onCartClick} style={{ position: 'relative' }}>
                        <FontAwesomeIcon icon={faShoppingCart} />
                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    </button>
                    <button className="header-action-btn mobile-menu-trigger" onClick={onMobileMenuToggle}>
                        <FontAwesomeIcon icon={faBars} />
                    </button>
                </div>
            </div>

            <div className="sub-header">
                <nav className="cat-nav">
                    {mounted && (
                        <ul className="cat-nav-links">
                            <li><Link href="/" className="cat-nav-link">Home</Link></li>
                            <li><Link href="/about" className="cat-nav-link">Our Story</Link></li>
                            <li><Link href="/products" className="cat-nav-link">Shop</Link></li>
                            <li><Link href="/#collections" className="cat-nav-link">Collection</Link></li>
                            {categories.map((cat) => (
                                <li key={cat.id}>
                                    <Link 
                                        href={`/products?category=${encodeURIComponent(cat.name)}`}
                                        className="cat-nav-link"
                                    >
                                        {cat.name}
                                    </Link>
                                </li>
                            ))}
                            <li><Link href="/#about" className="cat-nav-link">About Us</Link></li>
                        </ul>
                    )}
                </nav>
            </div>
        </motion.header>
    );
}
