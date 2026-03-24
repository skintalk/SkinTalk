'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faCreditCard, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { getSupabase } from '@/lib/supabase';
import Link from 'next/link';
import './globals.css';

interface CartItem {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    quantity: number;
}

interface Address {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
}

export default function CheckoutPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [address, setAddress] = useState<Address>({
        fullName: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [showQR, setShowQR] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/');
            return;
        }
        setUser(user);
        await loadCart(user.id);
        setInitialLoading(false);
    };

    const loadCart = async (userId: string) => {
        const supabase = getSupabase();
        const { data } = await supabase.from('carts').select('items').eq('user_id', userId).single();
        if (data?.items && data.items.length > 0) {
            const productIds = data.items.map((item: any) => item.product_id).filter(Boolean);
            if (productIds.length > 0) {
                const { data: productsData } = await supabase.from('products').select('*').in('id', productIds);
                const cartWithProducts: any[] = [];
                for (const item of data.items) {
                    const product = productsData?.find(p => p.id === item.product_id);
                    if (product) cartWithProducts.push(product);
                }
                setCart(cartWithProducts);
            }
        } else {
            router.push('/');
        }
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
    const shippingCost = cartTotal > 5000 ? 0 : 500;
    const tax = cartTotal * 0.08;
    const grandTotal = cartTotal + shippingCost + tax;

    const handlePlaceOrder = async () => {
        if (!user || !address.fullName || !address.street || !address.city || !address.phone) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);
        const orderItems = cart.map(item => ({ product_id: item.id }));

        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'place_order',
                    data: {
                        userId: user.id,
                        items: orderItems,
                        total: grandTotal,
                        shippingAddress: address,
                        subtotal: cartTotal,
                        shippingCost,
                        tax
                    },
                    userEmail: user.email
                })
            });
            const json = await res.json();

            if (json.error) {
                alert('Error placing order: ' + json.error);
                setLoading(false);
                return;
            }

            const supabase = getSupabase();
            await supabase.from('carts').upsert({
                user_id: user.id,
                items: [],
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

            setOrderPlaced(true);
            setShowQR(true);
        } catch (err) {
            alert('Error placing order');
        }
        setLoading(false);
    };

    if (initialLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <header className="checkout-header">
                <div className="container">
                    <Link href="/" className="back-link">
                        <FontAwesomeIcon icon={faArrowLeft} /> Back to Shop
                    </Link>
                    <h1>Checkout</h1>
                </div>
            </header>

            <div className="container checkout-content">
                <div className={`checkout-grid ${showQR ? 'with-qr' : ''}`}>
                    <div className="checkout-form-section">
                        <div className="form-card">
                            <h3><FontAwesomeIcon icon={faMapMarkerAlt} /> Shipping Address</h3>
                            {orderPlaced ? (
                                <div className="address-plaintext" style={{ padding: '0.5rem 0', lineHeight: '1.8', color: '#444' }}>
                                    <p style={{ fontWeight: 600, fontSize: '1.2rem', color: '#111', margin: '0 0 0.5rem 0' }}>{address.fullName}</p>
                                    <p style={{ margin: '0' }}>{address.street}</p>
                                    <p style={{ margin: '0' }}>{address.city}, {address.state} {address.zipCode}</p>
                                    <p style={{ margin: '0.5rem 0 0 0', fontWeight: 500 }}>{address.phone}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label>Full Name *</label>
                                        <input 
                                            type="text" 
                                            value={address.fullName}
                                            onChange={(e) => setAddress({...address, fullName: e.target.value})}
                                            disabled={orderPlaced}
                                            required
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Street Address *</label>
                                        <input 
                                            type="text" 
                                            value={address.street}
                                            onChange={(e) => setAddress({...address, street: e.target.value})}
                                            disabled={orderPlaced}
                                            required
                                            placeholder="123 Main St, Apt 4"
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>City *</label>
                                            <input 
                                                type="text" 
                                                value={address.city}
                                                onChange={(e) => setAddress({...address, city: e.target.value})}
                                                disabled={orderPlaced}
                                                required
                                                placeholder="Colombo"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Province *</label>
                                            <input 
                                                type="text" 
                                                value={address.state}
                                                onChange={(e) => setAddress({...address, state: e.target.value})}
                                                disabled={orderPlaced}
                                                required
                                                placeholder="Western"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Postal Code</label>
                                            <input 
                                                type="text" 
                                                value={address.zipCode}
                                                onChange={(e) => setAddress({...address, zipCode: e.target.value})}
                                                disabled={orderPlaced}
                                                placeholder="00100"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number *</label>
                                        <input 
                                            type="tel" 
                                            value={address.phone}
                                            onChange={(e) => setAddress({...address, phone: e.target.value})}
                                            disabled={orderPlaced}
                                            required
                                            placeholder="0771234567"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="checkout-summary-section">
                        <div className="summary-card">
                            <h3>Order Summary</h3>
                            <div className="order-items">
                                {cart.map((item, index) => (
                                    <div key={index} className="order-item">
                                        <img src={item.image} alt={item.name} />
                                        <div>
                                            <p className="item-name">{item.name}</p>
                                            <p className="item-price">LKR {item.price.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bill-summary">
                                <div className="bill-row">
                                    <span>Subtotal</span>
                                    <span>LKR {cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="bill-row">
                                    <span>Shipping</span>
                                    <span>{shippingCost === 0 ? 'Free' : `LKR ${shippingCost.toFixed(2)}`}</span>
                                </div>
                                <div className="bill-row">
                                    <span>Tax (8%)</span>
                                    <span>LKR {tax.toFixed(2)}</span>
                                </div>
                                <div className="bill-row total">
                                    <span>Total</span>
                                    <span>LKR {grandTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {!orderPlaced ? (
                                <button 
                                    className="hero-cta" 
                                    style={{ width: '100%', marginTop: '1.5rem' }}
                                    onClick={handlePlaceOrder}
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : `Place Order - LKR ${grandTotal.toFixed(2)}`}
                                </button>
                            ) : (
                                <button 
                                    className="hero-cta" 
                                    style={{ width: '100%', marginTop: '1.5rem', background: '#28a745' }}
                                    onClick={() => router.push('/')}
                                >
                                    Continue Shopping
                                </button>
                            )}
                        </div>
                    </div>

                    {showQR && (
                        <div className="checkout-qr-section">
                            <div className="qr-card">
                                <h3>Scan to Pay</h3>
                                <p className="qr-subtitle">Scan the QR code with your bank app to complete payment</p>
                                <div className="qr-code">
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=skintalk-payment" alt="Payment QR Code" />
                                </div>
                                <p className="qr-amount">LKR {grandTotal.toFixed(2)}</p>
                                <p className="qr-note">Show this QR code to complete your payment</p>
                                <div className="order-success">
                                    <p>Order placed successfully!</p>
                                    <p className="success-note">Complete payment to confirm your order</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
