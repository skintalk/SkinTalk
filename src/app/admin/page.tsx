'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faShoppingBag, faDollarSign, faBox, faChartLine, faSignOutAlt, faPlus, faTrash, faImage, faCreditCard, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { getSupabase, isAdminEmail, getAdminClient } from '@/lib/supabase';
import { readQRFromFile } from '@/lib/qr';

const bankCodeItems: Record<string, string> = {
  "16852": "Alliance Finance Company PLC",
  "16463": "Amana Bank PLC",
  "16472": "Axis Bank",
  "16010": "Bank of Ceylon",
  "16481": "Cargills Bank Limited",
  "16004": "Central Bank of Sri Lanka",
  "16825": "Central Finance PLC",
  "16047": "Citi Bank",
  "16746": "Citizen Development Business Finance PLC",
  "16056": "Commercial Bank PLC",
  "16870": "Commercial Credit & Finance PLC",
  "16807": "Commercial Leasing and Finance",
  "16205": "Deutsche Bank",
  "16454": "DFCC Bank PLC",
  "16074": "Habib Bank Ltd",
  "16083": "Hatton National Bank PLC",
  "16737": "HDFC Bank",
  "16092": "Hongkong Shanghai Bank",
  "16384": "ICICI Bank Ltd",
  "16108": "Indian Bank",
  "16117": "Indian Overseas Bank",
  "16834": "Kanrich Finance Limited",
  "16861": "Lanka Orix Finance PLC",
  "16773": "LB Finance PLC",
  "16269": "MCB Bank Ltd",
  "16913": "Mercantile Investment and Finance PLC",
  "16898": "Merchant Bank of Sri Lanka & Finance PLC",
  "16214": "National Development Bank PLC",
  "16719": "National Savings Bank",
  "16162": "Nations Trust Bank PLC",
  "16311": "Pan Asia Banking Corporation PLC",
  "16135": "Peoples Bank",
  "16922": "People's Leasing & Finance PLC",
  "16296": "Public Bank",
  "16755": "Regional Development Bank",
  "16278": "Sampath Bank PLC",
  "16728": "Sanasa Development Bank",
  "16782": "Senkadagala Finance PLC",
  "16287": "Seylan Bank PLC",
  "16038": "Standard Chartered Bank",
  "16144": "State Bank of India",
  "16764": "State Mortgage & Investment Bank",
  "16302": "Union Bank of Colombo PLC",
  "16716": "Vallibel Finance PLC",
};

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
    description: string;
    benefits?: string;
    how_to_use?: string;
    ingredients?: string;
    short_benefit?: string;
    item_code?: string;
    created_at: string;
}

interface Order {
    id: string;
    user_id: string;
    items: { product_id: string }[];
    total: number;
    status: string;
    created_at: string;
    items_detail?: { name: string; price: number; image: string }[];
    customer_email?: string;
}

interface UserProfile {
    id: string;
    email: string;
    name?: string;
    contact_number?: string;
    created_at: string;
    total_spent?: number;
}

export default function AdminPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'users' | 'payment'>('dashboard');
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0 });
    
    const [categories, setCategories] = useState<Category[]>([]);
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductQuantity, setNewProductQuantity] = useState('');
    const [newProductCategory, setNewProductCategory] = useState('General');
    const [newProductDescription, setNewProductDescription] = useState('');
    const [newProductBenefits, setNewProductBenefits] = useState('');
    const [newProductHowToUse, setNewProductHowToUse] = useState('');
    const [newProductIngredients, setNewProductIngredients] = useState('');
    const [newProductShortBenefit, setNewProductShortBenefit] = useState('');
    const [newProductItemCode, setNewProductItemCode] = useState('');
    const [newProductImage, setNewProductImage] = useState<File | null>(null);
    const [newProductImageName, setNewProductImageName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [qrLoading, setQrLoading] = useState(false);
    const [qrError, setQrError] = useState('');
    const [qrResult, setQrResult] = useState<any>(null);
    const [savedMerchants, setSavedMerchants] = useState<any[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (isAdmin) {
            loadData();
        }
    }, [isAdmin]);

    useEffect(() => {
        if (activeTab === 'payment') {
            loadSavedMerchant();
        }
    }, [activeTab]);

    const loadSavedMerchant = async () => {
        const supabase = getSupabase();
        const { data } = await supabase.from('merchant_data').select('*').order('created_at', { ascending: false });
        if (data) setSavedMerchants(data);
    };

    const checkAuth = async () => {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser({ id: user.id, email: user.email || '', created_at: '' });
            if (isAdminEmail(user.email)) {
                setIsAdmin(true);
            } else {
                router.push('/');
            }
        } else {
            router.push('/');
        }
        setLoading(false);
    };

    const loadData = async () => {
        const supabase = getSupabase();

        const [productsRes, usersRes, categoriesRes] = await Promise.all([
            supabase.from('products').select('*').order('created_at', { ascending: false }),
            supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
            supabase.from('categories').select('*').order('name', { ascending: true })
        ]);

        let ordersRes: any = { data: [] };
        if (user) {
            const ordersApiRes = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_orders', userEmail: user.email })
            });
            ordersRes = await ordersApiRes.json();
        }

        console.log('productsRes:', productsRes.data?.length);
        console.log('ordersRes:', ordersRes);
        console.log('ordersRes.error:', ordersRes.error);

        if (productsRes.data) setProducts(productsRes.data);
        if (ordersRes.data && ordersRes.data.length > 0) {
            const ordersWithDetails = ordersRes.data.map((order: any) => {
                let itemsDetail: any[] = [];
                if (order.items && Array.isArray(order.items)) {
                    itemsDetail = order.items.map((item: any) => {
                        if (item.product_id) {
                            const product = productsRes.data?.find(p => p.id === item.product_id);
                            return product ? { name: product.name, price: product.price, image: product.image } : null;
                        } else if (item.name) {
                            return { name: item.name, price: item.price, image: item.image };
                        }
                        return null;
                    }).filter(Boolean);
                }
                const customer = usersRes.data?.find(u => u.id === order.user_id);
                return { ...order, items_detail: itemsDetail, customer_email: customer?.email || 'Unknown' };
            });
            console.log('ordersWithDetails:', ordersWithDetails);
            setOrders(ordersWithDetails);
        }
        if (categoriesRes.data) setCategories(categoriesRes.data);
        
        if (usersRes.data && ordersRes.data) {
            const usersWithSpent = usersRes.data.map((u: any) => {
                const userOrders = ordersRes.data?.filter((o: any) => o.user_id === u.id) || [];
                const totalSpent = userOrders.reduce((sum: number, o: any) => {
                    if (o.status !== 'cancelled' && o.status !== 'Cancelled') {
                        return sum + (o.total || 0);
                    }
                    return sum;
                }, 0);
                return { ...u, total_spent: totalSpent };
            });
            console.log('usersWithSpent:', usersWithSpent);
            setUsers(usersWithSpent);
        }

        const totalRevenue = ordersRes.data?.reduce((sum: number, o: any) => {
            if (o.status !== 'cancelled' && o.status !== 'Cancelled') {
                return sum + o.total;
            }
            return sum;
        }, 0) || 0;
        setStats({
            totalRevenue,
            totalOrders: ordersRes.data?.length || 0,
            totalUsers: usersRes.data?.length || 0,
            totalProducts: productsRes.data?.length || 0
        });
    };

    const handleLogout = async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        router.push('/');
    };

    const parseQR = async (qrString: string) => {
        try {
            const response = await fetch('/api/parse-qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload: qrString })
            });
            const result = await response.json();
            
            if (result.error) {
                setQrError(result.error);
                return;
            }
            
            if (result.data) {
                setQrResult(result.data);
            }
        } catch (err) {
            setQrError('Error parsing QR code');
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            return;
        }
        if (!user) return;
        
        const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'add_category',
                data: { name: newCategoryName.trim() },
                userEmail: user.email
            })
        });
        const json = await res.json();
        
        if (json.error) {
            if (json.error.includes('duplicate')) {
                alert('Category already exists');
            } else {
                alert('Error adding category: ' + json.error);
            }
        } else {
            setNewCategoryName('');
            setShowAddCategory(false);
            loadData();
            if (json.data) setNewProductCategory(json.data.name);
        }
    };

    const handleSaveProduct = async () => {
        if (!newProductName || !newProductPrice || !newProductQuantity) {
            alert('Please enter product name, price and quantity');
            return;
        }
        if (!user) {
            alert('Please login first');
            return;
        }

        setUploading(true);
        let imageUrl = editingProduct?.image || '/WhatsApp Image 2026-03-23 at 9.10.39 AM.jpeg';
        const oldImage = editingProduct?.image;

        const saveProduct = async (imgUrl: string) => {
            const action = editingProduct ? 'update_product' : 'add_product';
            const data: any = {
                name: newProductName,
                price: parseFloat(newProductPrice),
                quantity: parseInt(newProductQuantity) || 0,
                image: imgUrl,
                category: newProductCategory,
                description: newProductDescription,
                benefits: newProductBenefits,
                how_to_use: newProductHowToUse,
                ingredients: newProductIngredients,
                short_benefit: newProductShortBenefit,
                item_code: newProductItemCode
            };
            if (editingProduct) {
                data.id = editingProduct.id;
                data.oldImage = oldImage;
            }

            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, data, userEmail: user.email })
            });
            const json = await res.json();
            
            if (json.error) {
                alert(`Error ${editingProduct ? 'updating' : 'adding'} product: ` + json.error);
            } else {
                resetForm();
                loadData();
                alert(editingProduct ? 'Product updated!' : 'Product added!');
            }
            setUploading(false);
        };

        if (newProductImage) {
            const fileExt = newProductImage.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            
            const reader = new FileReader();
            reader.readAsDataURL(newProductImage);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                
                const uploadRes = await fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'upload_image',
                        data: { imageData: base64, fileName },
                        userEmail: user.email
                    })
                });
                const uploadJson = await uploadRes.json();
                
                if (uploadJson.error) {
                    alert('Error uploading image: ' + uploadJson.error);
                    setUploading(false);
                    return;
                }
                
                saveProduct(uploadJson.url);
            };
        } else {
            saveProduct(imageUrl);
        }
    };

    const resetForm = () => {
        setNewProductName('');
        setNewProductPrice('');
        setNewProductQuantity('');
        setNewProductCategory('General');
        setNewProductDescription('');
        setNewProductBenefits('');
        setNewProductHowToUse('');
        setNewProductIngredients('');
        setNewProductShortBenefit('');
        setNewProductItemCode('');
        setNewProductImage(null);
        setNewProductImageName('');
        setEditingProduct(null);
        setIsCategoryDropdownOpen(false);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setNewProductName(product.name);
        setNewProductPrice(product.price.toString());
        setNewProductQuantity(product.quantity?.toString() || '0');
        setNewProductCategory(product.category || 'General');
        setNewProductDescription(product.description || '');
        setNewProductBenefits(product.benefits || '');
        setNewProductHowToUse(product.how_to_use || '');
        setNewProductIngredients(product.ingredients || '');
        setNewProductShortBenefit(product.short_benefit || '');
        setNewProductItemCode(product.item_code || '');
        setNewProductImage(null);
        setNewProductImageName('');
        setIsCategoryDropdownOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        if (!user) return;
        
        const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete_product',
                data: { id: productId },
                userEmail: user.email
            })
        });
        const json = await res.json();
        
        if (json.error) {
            alert('Error: ' + json.error);
        } else {
            loadData();
            alert('Product deleted!');
        }
    };

    const handleStatusChange = async (orderId: string, status: string) => {
        if (!user) return;
        
        const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_order_status',
                data: { id: orderId, status },
                userEmail: user.email
            })
        });
        const json = await res.json();
        
        if (!json.error) loadData();
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    if (!isAdmin) return null;

    return (
        <div className={`admin-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            <aside className="admin-sidebar">
                <button className="admin-sidebar-close" onClick={() => setIsSidebarOpen(false)}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>

                <div className="admin-sidebar-header">
                    <h2>SkinTalk Admin</h2>
                    <p>Merchant Dashboard</p>
                </div>
                <nav className="admin-nav">
                    <button className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}>
                        <FontAwesomeIcon icon={faChartLine} /> Dashboard
                    </button>
                    <button className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }}>
                        <FontAwesomeIcon icon={faBox} /> Products
                    </button>
                    <button className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}>
                        <FontAwesomeIcon icon={faShoppingBag} /> Orders
                    </button>
                    <button className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}>
                        <FontAwesomeIcon icon={faUsers} /> Users
                    </button>
                    <button className={`admin-nav-item ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => { setActiveTab('payment'); setIsSidebarOpen(false); }}>
                        <FontAwesomeIcon icon={faCreditCard} /> Payment Setup
                    </button>
                    <button className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} style={{ display: 'none' }}>
                        Dashboard
                    </button>
                </nav>
                <div className="admin-sidebar-footer">
                    <button className="admin-nav-item" onClick={handleLogout}>
                        <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-mobile-header">
                    <button className="admin-menu-toggle" onClick={() => setIsSidebarOpen(true)}>
                        <FontAwesomeIcon icon={faBars} />
                    </button>
                    <h1>SkinTalk Admin</h1>
                </header>

                {activeTab === 'dashboard' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1>Dashboard Overview</h1>
                        <div className="admin-stats-grid">
                            <div className="admin-stat-card">
                                <div className="stat-icon"><FontAwesomeIcon icon={faDollarSign} /></div>
                                <div className="stat-content">
                                    <h3>Total Revenue</h3>
                                    <p className="stat-value">LKR {stats.totalRevenue.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="admin-stat-card">
                                <div className="stat-icon"><FontAwesomeIcon icon={faShoppingBag} /></div>
                                <div className="stat-content">
                                    <h3>Total Orders</h3>
                                    <p className="stat-value">{stats.totalOrders}</p>
                                </div>
                            </div>
                            <div className="admin-stat-card">
                                <div className="stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
                                <div className="stat-content">
                                    <h3>Total Users</h3>
                                    <p className="stat-value">{stats.totalUsers}</p>
                                </div>
                            </div>
                            <div className="admin-stat-card">
                                <div className="stat-icon"><FontAwesomeIcon icon={faBox} /></div>
                                <div className="stat-content">
                                    <h3>Total Products</h3>
                                    <p className="stat-value">{stats.totalProducts}</p>
                                </div>
                            </div>
                        </div>
                        
                        <h2 style={{ marginTop: '2rem' }}>Recent Orders</h2>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.slice(0, 5).map(order => (
                                        <tr key={order.id}>
                                            <td>{order.customer_email || 'Unknown'}</td>
                                            <td>{order.items?.length || 0} items</td>
                                            <td>LKR {order.total.toFixed(2)}</td>
                                            <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                                            <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'products' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1>Product Management</h1>
                        
                        <div className="admin-card">
                            <h3><FontAwesomeIcon icon={faPlus} /> {editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                            <div className="admin-form-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                                <input type="text" placeholder="Product Name" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
                                <input type="text" placeholder="Item Code" value={newProductItemCode} onChange={(e) => setNewProductItemCode(e.target.value)} />
                                <input type="number" placeholder="Price" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} />
                                <input type="number" placeholder="Quantity" value={newProductQuantity} onChange={(e) => setNewProductQuantity(e.target.value)} />
                                {categories.length === 0 ? (
                                    <input type="text" placeholder="Category" value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)} />
                                ) : !showAddCategory ? (
                                    <div className="custom-select-wrapper" style={{ position: 'relative' }}>
                                        <div 
                                            className={`admin-form-custom-select-trigger ${isCategoryDropdownOpen ? 'open' : ''}`}
                                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                        >
                                            {newProductCategory}
                                        </div>
                                        {isCategoryDropdownOpen && (
                                            <div className="custom-select-dropdown">
                                                {categories.map(cat => (
                                                    <div 
                                                        key={cat.id}
                                                        className="custom-select-option"
                                                        onClick={() => {
                                                            setNewProductCategory(cat.name);
                                                            setIsCategoryDropdownOpen(false);
                                                        }}
                                                    >
                                                        {cat.name}
                                                    </div>
                                                ))}
                                                <div 
                                                    className="custom-select-option add-new"
                                                    onClick={() => {
                                                        setTimeout(() => setShowAddCategory(true), 10);
                                                        setIsCategoryDropdownOpen(false);
                                                    }}
                                                >
                                                    + Add new category
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input 
                                            type="text" 
                                            placeholder="New category name" 
                                            value={newCategoryName} 
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                            autoFocus
                                            style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.95rem', flex: 1 }}
                                        />
                                        <button className="admin-btn primary" onClick={handleAddCategory}>Add</button>
                                        <button className="admin-btn" onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }} style={{ background: '#ddd', color: '#333' }}>Cancel</button>
                                    </div>
                                )}
                                <div className="file-input-wrapper">
                                    <label>
                                        <FontAwesomeIcon icon={faImage} /> 
                                        {newProductImageName ? newProductImageName : 'Upload Image'}
                                    </label>
                                    <input type="file" accept="image/*" onChange={(e) => { setNewProductImage(e.target.files?.[0] || null); setNewProductImageName(e.target.files?.[0]?.name || ''); }} />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Short Benefit (e.g. Clears acne)" 
                                    value={newProductShortBenefit} 
                                    onChange={(e) => setNewProductShortBenefit(e.target.value)}
                                    style={{ gridColumn: 'span 6', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', width: '100%' }}
                                />
                                <textarea 
                                    placeholder="Product Description" 
                                    value={newProductDescription} 
                                    onChange={(e) => setNewProductDescription(e.target.value)}
                                    style={{ gridColumn: 'span 6', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px', width: '100%' }}
                                />
                                <textarea 
                                    placeholder="Key Benefits (List them...)" 
                                    value={newProductBenefits} 
                                    onChange={(e) => setNewProductBenefits(e.target.value)}
                                    style={{ gridColumn: 'span 6', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px', width: '100%' }}
                                />
                                <textarea 
                                    placeholder="How to Use (Step 1, Step 2...)" 
                                    value={newProductHowToUse} 
                                    onChange={(e) => setNewProductHowToUse(e.target.value)}
                                    style={{ gridColumn: 'span 6', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px', width: '100%' }}
                                />
                                <textarea 
                                    placeholder="Ingredients" 
                                    value={newProductIngredients} 
                                    onChange={(e) => setNewProductIngredients(e.target.value)}
                                    style={{ gridColumn: 'span 6', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px', width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button className="admin-btn primary" onClick={handleSaveProduct} disabled={uploading}>
                                    {uploading ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
                                </button>
                                {editingProduct && (
                                    <button className="admin-btn" onClick={resetForm} style={{ background: '#ddd' }}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>

                        <h2 style={{ marginTop: '2rem' }}>All Products</h2>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Code</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Qty</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(product => (
                                        <tr key={product.id} onClick={() => handleEditProduct(product)} style={{ cursor: 'pointer' }}>
                                            <td><img src={product.image} alt={product.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} /></td>
                                            <td style={{ fontWeight: 600 }}>{product.item_code || '-'}</td>
                                            <td>{product.name}</td>
                                            <td>{product.category}</td>
                                            <td>LKR {product.price.toFixed(2)}</td>
                                            <td>{product.quantity || 0}</td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <button className="admin-btn danger" onClick={() => handleDeleteProduct(product.id)}>
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'orders' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1>Orders Management</h1>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id}>
                                            <td>{order.customer_email}</td>
                                            <td>{order.items_detail?.map((item, i) => <div key={i}>{item.name}</div>)}</td>
                                            <td>LKR {order.total.toFixed(2)}</td>
                                            <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                                            <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} style={{ padding: '4px' }}>
                                                    <option value="pending">Pending</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1>User Management</h1>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Contact</th>
                                        <th>Joined</th>
                                        <th>Total Spent</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td style={{ fontWeight: 500 }}>{user.name || '-'}</td>
                                            <td>{user.email}</td>
                                            <td>{user.contact_number || '-'}</td>
                                            <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--accent)' }}>LKR {(user.total_spent || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'payment' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1>My QRs</h1>
                        <div className="admin-card">
                            <h3>Scan or Upload QR Code</h3>
                            <p style={{ color: '#666', marginBottom: '1rem' }}>Upload a QR code image to verify payment details</p>
                            
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    padding: '2rem', 
                                    border: '2px dashed #ddd', 
                                    borderRadius: '12px', 
                                    cursor: 'pointer',
                                    background: '#fafafa',
                                    transition: 'all 0.2s'
                                }}>
                                    <FontAwesomeIcon icon={faImage} style={{ fontSize: '2rem', color: '#ccc', marginBottom: '0.5rem' }} />
                                    <span style={{ color: '#666', fontWeight: 500 }}>Click to upload QR image</span>
                                    <span style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.25rem' }}>PNG, JPG up to 10MB</span>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            
                                            setQrLoading(true);
                                            setQrError('');
                                            setQrResult(null);
                                            
                                            try {
                                                const qrString = await readQRFromFile(file);
                                                
                                                if (qrString) {
                                                    await parseQR(qrString);
                                                } else {
                                                    setQrError('Could not read QR code from image');
                                                }
                                            } catch (err) {
                                                setQrError('Error reading QR code');
                                            }
                                            setQrLoading(false);
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                            
                            {qrLoading && <p style={{ marginTop: '1rem', color: 'var(--accent)' }}>Verifying QR code...</p>}
                            
                            {qrError && <p style={{ marginTop: '1rem', color: 'red' }}>{qrError}</p>}
                            
                            {qrResult && (
                                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                                    <h4 style={{ marginBottom: '1rem' }}>Merchant Details</h4>
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#666' }}>Merchant Name:</span>
                                            <strong>{qrResult.merchant_name || 'N/A'}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#666' }}>City:</span>
                                            <span>{qrResult.merchant_city || 'N/A'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#666' }}>Bank:</span>
                                            <span>{bankCodeItems[qrResult.bank_code] || qrResult.bank_code || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                        <button 
                                            onClick={async () => {
                                                if (!qrResult) return;
                                                try {
                                                    const response = await fetch('/api/admin', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            action: 'save_merchant',
                                                            data: qrResult,
                                                            userEmail: user?.email
                                                        })
                                                    });
                                                    const result = await response.json();
                                                    if (result.success) {
                                                        alert('Merchant data saved successfully!');
                                                        setQrResult(null);
                                                        loadSavedMerchant();
                                                    } else {
                                                        alert('Error saving merchant: ' + result.error);
                                                    }
                                                } catch (err) {
                                                    alert('Error saving merchant data');
                                                }
                                            }}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                background: 'var(--accent)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 500
                                            }}
                                        >
                                            Save Merchant Data
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {savedMerchants.length > 0 && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <h3>Saved Merchants</h3>
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                                    gap: '1.25rem',
                                    marginTop: '1rem'
                                }}>
                                    {savedMerchants.map((merchant) => (
                                        <div 
                                            key={merchant.id} 
                                            className="admin-card" 
                                            style={{ 
                                                padding: '1.5rem', 
                                                cursor: 'pointer',
                                                border: merchant.selected ? '2px solid var(--accent)' : '2px solid transparent',
                                                transition: 'all 0.2s ease',
                                                boxShadow: merchant.selected ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
                                            }}
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch('/api/admin', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            action: 'select_merchant',
                                                            data: { id: merchant.id },
                                                            userEmail: user?.email
                                                        })
                                                    });
                                                    const result = await response.json();
                                                    if (result.success) {
                                                        loadSavedMerchant();
                                                    } else {
                                                        alert('Error selecting merchant: ' + result.error);
                                                    }
                                                } catch (err) {
                                                    alert('Error selecting merchant');
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                <input 
                                                    type="radio" 
                                                    checked={merchant.selected || false} 
                                                    onChange={() => {}}
                                                    style={{ accentColor: 'var(--accent)', width: '20px', height: '20px' }}
                                                />
                                                <strong style={{ fontSize: '1.1rem', color: '#333' }}>
                                                    {bankCodeItems[merchant.bank_code] || merchant.bank_code || 'N/A'}
                                                </strong>
                                            </div>
                                            <div style={{ color: '#666', marginLeft: '2rem', fontSize: '0.95rem' }}>
                                                <div style={{ fontWeight: 500, color: 'var(--accent)', marginBottom: '0.25rem' }}>
                                                    {merchant.merchant_name || 'N/A'}
                                                </div>
                                                <div style={{ opacity: 0.8 }}>
                                                    {merchant.merchant_city || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </main>
        </div>
    );
}
