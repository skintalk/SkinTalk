'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faShoppingBag, faDollarSign, faBox, faChartLine, faSignOutAlt, faPlus, faTrash, faImage, faCreditCard, faBars, faTimes, faMinus, faMagic } from '@fortawesome/free-solid-svg-icons';
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
    meta_title?: string;
    meta_description?: string;
    slug?: string;
    image_alt?: string;
    sku?: string;
    created_at: string;
}

interface Order {
    id: string;
    user_id: string;
    items: { product_id: string }[];
    total: number;
    subtotal?: number;
    shipping_cost?: number;
    shipping_address?: {
        fullName: string;
        street: string;
        city: string;
        state: string;
        zipCode: string;
        phone: string;
    };
    status: string;
    invoice_number?: string;
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

interface Announcement {
    id: string;
    phrase: string;
    is_active: boolean;
    display_order: number;
    created_at: string;
}

export default function AdminPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'users' | 'payment' | 'announcements'>('dashboard');
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0 });
    const [openOrderStatusId, setOpenOrderStatusId] = useState<string | null>(null);
    
    const [categories, setCategories] = useState<Category[]>([]);
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductQuantity, setNewProductQuantity] = useState('');
    const [newProductCategory, setNewProductCategory] = useState('');
    const [newProductDescription, setNewProductDescription] = useState('');
    const [newProductBenefits, setNewProductBenefits] = useState('');
    const [newProductHowToUse, setNewProductHowToUse] = useState('');
    const [newProductIngredients, setNewProductIngredients] = useState('');
    const [newProductShortBenefit, setNewProductShortBenefit] = useState('');
    const [newProductItemCode, setNewProductItemCode] = useState('');
    const [newProductMetaTitle, setNewProductMetaTitle] = useState('');
    const [newProductMetaDescription, setNewProductMetaDescription] = useState('');
    const [newProductSlug, setNewProductSlug] = useState('');
    const [newProductImageAlt, setNewProductImageAlt] = useState('');
    const [newProductSKU, setNewProductSKU] = useState('');
    const [newProductImage, setNewProductImage] = useState<File | null>(null);
    const [newProductImageName, setNewProductImageName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryImage, setNewCategoryImage] = useState<File | null>(null);
    const [newCategoryImageName, setNewCategoryImageName] = useState('');
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isAddProductExpanded, setIsAddProductExpanded] = useState(false);
    const [qrLoading, setQrLoading] = useState(false);

    useEffect(() => {
        document.body.classList.add('admin-page-body');
        return () => document.body.classList.remove('admin-page-body');
    }, []);
    const [qrError, setQrError] = useState('');
    const [qrResult, setQrResult] = useState<any>(null);
    const [savedMerchants, setSavedMerchants] = useState<any[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [newPhrase, setNewPhrase] = useState('');
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

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

        const [productsRes, usersRes, categoriesRes, announcementsRes] = await Promise.all([
            supabase.from('products').select('*').order('created_at', { ascending: false }),
            supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
            supabase.from('categories').select('*').order('name', { ascending: true }),
            supabase.from('announcements').select('*').order('display_order', { ascending: true })
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
        if (announcementsRes.data) setAnnouncements(announcementsRes.data);
        
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

    const [currentQrPayload, setCurrentQrPayload] = useState('');

    const parseQR = async (qrString: string) => {
        try {
            setCurrentQrPayload(qrString);
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
            alert('Please enter a category name');
            return;
        }
        if (!user) return;
        
        setUploading(true);
        let imageUrl = '';

        try {
            if (newCategoryImage) {
                const fileExt = newCategoryImage.name.split('.').pop();
                const fileName = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve) => {
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.readAsDataURL(newCategoryImage);
                });
                
                const base64 = await base64Promise;
                
                const uploadRes = await fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'upload_image',
                        data: { imageData: base64, fileName, bucket: 'categories' },
                        userEmail: user.email
                    })
                });
                const uploadJson = await uploadRes.json();
                
                if (uploadJson.error) {
                    alert('Error uploading category image: ' + uploadJson.error);
                    setUploading(false);
                    return;
                }
                imageUrl = uploadJson.url;
            }

            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add_category',
                    data: { name: newCategoryName.trim(), image_url: imageUrl },
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
                setNewCategoryImage(null);
                setNewCategoryImageName('');
                setShowAddCategory(false);
                loadData();
                if (json.data) setNewProductCategory(json.data.name);
            }
        } catch (err) {
            alert('An unexpected error occurred');
        } finally {
            setUploading(false);
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
                item_code: newProductItemCode,
                meta_title: newProductMetaTitle,
                meta_description: newProductMetaDescription,
                slug: newProductSlug,
                image_alt: newProductImageAlt,
                sku: newProductSKU
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
        setNewProductCategory('');
        setNewProductDescription('');
        setNewProductBenefits('');
        setNewProductHowToUse('');
        setNewProductIngredients('');
        setNewProductShortBenefit('');
        setNewProductItemCode('');
        setNewProductMetaTitle('');
        setNewProductMetaDescription('');
        setNewProductSlug('');
        setNewProductImageAlt('');
        setNewProductSKU('');
        setNewProductImage(null);
        setNewProductImageName('');
        setEditingProduct(null);
        setIsCategoryDropdownOpen(false);
        setIsAddProductExpanded(false);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setNewProductName(product.name);
        setNewProductPrice(product.price.toString());
        setNewProductQuantity(product.quantity?.toString() || '0');
        setNewProductCategory(product.category || '');
        setNewProductDescription(product.description || '');
        setNewProductBenefits(product.benefits || '');
        setNewProductHowToUse(product.how_to_use || '');
        setNewProductIngredients(product.ingredients || '');
        setNewProductShortBenefit(product.short_benefit || '');
        setNewProductItemCode(product.item_code || '');
        setNewProductMetaTitle(product.meta_title || '');
        setNewProductMetaDescription(product.meta_description || '');
        setNewProductSlug(product.slug || '');
        setNewProductImageAlt(product.image_alt || '');
        setNewProductSKU(product.sku || '');
        setNewProductImage(null);
        setNewProductImageName('');
        setIsCategoryDropdownOpen(false);
        setIsAddProductExpanded(true);
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

    const generateSEOData = () => {
        if (!newProductName) {
            alert('Please enter a product name first.');
            return;
        }

        const slugify = (text: string) => {
            return text
                .toString()
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')
                .replace(/--+/g, '-');
        };

        const cleanedName = newProductName.replace(/Skintalks\s*/gi, '').trim();
        const ingredients = newProductIngredients ? newProductIngredients.split(/[,|\n]/)[0].trim() : '';
        const benefit = newProductShortBenefit || '';

        // Meta Title: {Name} {ShortBenefit} in Sri Lanka | Skintalks
        const metaTitle = `${newProductName} ${benefit ? benefit + ' ' : ''}in Sri Lanka | Skintalks`;
        setNewProductMetaTitle(metaTitle);

        // Meta Description: Shop Skintalks {Name} in Sri Lanka for {KeyBenefit/Summary}. {Short Benefit}. Only LKR {Price}.
        const descriptionExcerpt = newProductDescription ? newProductDescription.split('.')[0] : 'natural beauty';
        const metaDesc = `Shop Skintalks ${newProductName} in Sri Lanka for ${descriptionExcerpt}. ${benefit}. Only LKR ${newProductPrice}.`;
        setNewProductMetaDescription(metaDesc);

        // Slug: {slugify(Name)}-sri-lanka
        const slug = `${slugify(newProductName)}-sri-lanka`;
        setNewProductSlug(slug.replace(/^\//, '')); // Ensure no leading slash

        // Image Alt: Skintalks {Name} for {Benefit} Sri Lanka
        const alt = `Skintalks ${newProductName} for ${benefit || 'Radiant Skin'} Sri Lanka`;
        setNewProductImageAlt(alt);

        // SKU: Initials of name + random 3-digit suffix
        if (!newProductSKU) {
            const initials = cleanedName.split(' ').map(w => w[0]).join('').toUpperCase();
            const suffix = Math.floor(100 + Math.random() * 900);
            setNewProductSKU(`${initials}${suffix}`);
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

    const handleSaveAnnouncement = async () => {
        if (!newPhrase.trim()) return;
        if (!user) return;

        const action = editingAnnouncement ? 'update_announcement' : 'add_announcement';
        const data = {
            id: editingAnnouncement?.id,
            phrase: newPhrase,
            is_active: true,
            display_order: editingAnnouncement?.display_order || announcements.length
        };

        const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, data, userEmail: user.email })
        });
        const json = await res.json();
        if (!json.error) {
            setNewPhrase('');
            setEditingAnnouncement(null);
            loadData();
        } else {
            alert(json.error);
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        if (!confirm('Are you sure?') || !user) return;
        const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_announcement', data: { id }, userEmail: user.email })
        });
        const json = await res.json();
        if (!json.error) loadData();
    };

    const toggleAnnouncementActive = async (ann: Announcement) => {
        if (!user) return;
        const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'update_announcement', 
                data: { ...ann, is_active: !ann.is_active }, 
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
                    <button className={`admin-nav-item ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => { setActiveTab('announcements'); setIsSidebarOpen(false); }}>
                        <FontAwesomeIcon icon={faMagic} /> Announcements
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
                            <div 
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isAddProductExpanded ? '1.5rem' : '0', cursor: 'pointer' }}
                                onClick={() => setIsAddProductExpanded(!isAddProductExpanded)}
                            >
                                <h3 style={{ margin: 0 }}><FontAwesomeIcon icon={isAddProductExpanded ? faMinus : faPlus} /> {editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                            </div>

                            {isAddProductExpanded && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <div className="admin-form-grid">
                                        <div className="form-group">
                                            <label>Product Name</label>
                                            <input type="text" placeholder="Product Name" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Item Code</label>
                                            <input type="text" placeholder="Item Code" value={newProductItemCode} onChange={(e) => setNewProductItemCode(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Price (LKR)</label>
                                            <input type="number" placeholder="Price" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Quantity</label>
                                            <input type="number" placeholder="Quantity" value={newProductQuantity} onChange={(e) => setNewProductQuantity(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Category</label>
                                            <div className="custom-select-wrapper">
                                                <div 
                                                    className={`admin-form-custom-select-trigger ${isCategoryDropdownOpen ? 'open' : ''}`}
                                                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                                >
                                                    {newProductCategory || 'Select Category'}
                                                </div>
                                                {isCategoryDropdownOpen && (
                                                    <div className="custom-select-dropdown">
                                                        <div 
                                                            className="custom-select-option"
                                                            onClick={() => {
                                                                setNewProductCategory('');
                                                                setIsCategoryDropdownOpen(false);
                                                            }}
                                                        >
                                                            Select Category
                                                        </div>
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
                                                                setShowAddCategory(true);
                                                                setIsCategoryDropdownOpen(false);
                                                            }}
                                                        >
                                                            + Add new category
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Product Image</label>
                                            <div className="file-input-wrapper">
                                                <label>
                                                    <FontAwesomeIcon icon={faImage} /> 
                                                    {newProductImageName ? newProductImageName : 'Upload Image'}
                                                </label>
                                                <input type="file" accept="image/*" onChange={(e) => { setNewProductImage(e.target.files?.[0] || null); setNewProductImageName(e.target.files?.[0]?.name || ''); }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem' }}>
                                            <div style={{ gridColumn: 'span 12' }}>
                                                <label>Description</label>
                                                <textarea placeholder="Product Description" value={newProductDescription} onChange={(e) => setNewProductDescription(e.target.value)} rows={4} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} />
                                            </div>
                                            <div style={{ gridColumn: 'span 12' }}>
                                                <label>Short Benefit (e.g. Clears acne)</label>
                                                <textarea placeholder="Briefly explain the main benefit" value={newProductShortBenefit} onChange={(e) => setNewProductShortBenefit(e.target.value)} rows={2} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} />
                                            </div>
                                            <div style={{ gridColumn: 'span 6' }}>
                                                <label>Key Benefits (List them...)</label>
                                                <textarea placeholder="List beneficial properties" value={newProductBenefits} onChange={(e) => setNewProductBenefits(e.target.value)} rows={4} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} />
                                            </div>
                                            <div style={{ gridColumn: 'span 6' }}>
                                                <label>How to Use (Step 1, Step 2...)</label>
                                                <textarea placeholder="Instructions for use" value={newProductHowToUse} onChange={(e) => setNewProductHowToUse(e.target.value)} rows={4} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} />
                                            </div>
                                            <div style={{ gridColumn: 'span 12' }}>
                                                <label>Ingredients</label>
                                                <textarea placeholder="List ingredients" value={newProductIngredients} onChange={(e) => setNewProductIngredients(e.target.value)} rows={3} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} />
                                            </div>

                                            {/* SEO & metadata section */}
                                            <div style={{ gridColumn: 'span 12', marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                    <h4 style={{ margin: 0, color: '#444' }}>SEO & WEB METADATA</h4>
                                                    <button 
                                                        type="button" 
                                                        className="admin-btn secondary" 
                                                        onClick={generateSEOData} 
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                    >
                                                        ✨ Auto-generate SEO
                                                    </button>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
                                                    <div style={{ gridColumn: 'span 3' }}>
                                                        <label>Search Engine Friendly URL (Slug)</label>
                                                        <input type="text" placeholder="e.g. herbal-face-wash" value={newProductSlug} onChange={(e) => setNewProductSlug(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} />
                                                    </div>
                                                    <div style={{ gridColumn: 'span 3' }}>
                                                        <label>Product SKU</label>
                                                        <input type="text" placeholder="SKU001" value={newProductSKU} onChange={(e) => setNewProductSKU(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} />
                                                    </div>
                                                    <div style={{ gridColumn: 'span 3' }}>
                                                        <label>Meta Title</label>
                                                        <input type="text" placeholder="Google search title" value={newProductMetaTitle} onChange={(e) => setNewProductMetaTitle(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} />
                                                    </div>
                                                    <div style={{ gridColumn: 'span 3' }}>
                                                        <label>Image Accessibility Text (Alt)</label>
                                                        <input type="text" placeholder="Description for screen readers" value={newProductImageAlt} onChange={(e) => setNewProductImageAlt(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} />
                                                    </div>
                                                    <div style={{ gridColumn: 'span 6' }}>
                                                        <label>Meta Description</label>
                                                        <textarea 
                                                            placeholder="Brief summary for search results" 
                                                            value={newProductMetaDescription} 
                                                            onChange={(e) => setNewProductMetaDescription(e.target.value)}
                                                            rows={2}
                                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                                        <button className="admin-btn primary" onClick={handleSaveProduct} disabled={uploading}>
                                            {uploading ? (editingProduct ? 'Updating...' : 'Adding...') : (editingProduct ? 'Update Product' : 'Add Product')}
                                        </button>
                                        <button className="admin-btn secondary" onClick={resetForm}>Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="admin-table-container" style={{ marginTop: '2rem' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Img</th>
                                        <th>Name</th>
                                        <th>Item Code</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(product => (
                                        <tr key={product.id}>
                                            <td>{product.image && <img src={product.image} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}</td>
                                            <td style={{ fontWeight: 500 }}>{product.name}</td>
                                            <td style={{ color: '#666', fontSize: '0.9rem' }}>{product.item_code || '-'}</td>
                                            <td>{product.category}</td>
                                            <td>LKR {product.price.toFixed(2)}</td>
                                            <td>{product.quantity}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="admin-btn secondary" style={{ padding: '0.4rem' }} onClick={() => handleEditProduct(product)}>Edit</button>
                                                    <button className="admin-btn secondary" style={{ padding: '0.4rem', color: '#d9534f' }} onClick={() => handleDeleteProduct(product.id)}><FontAwesomeIcon icon={faTrash} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {showAddCategory && (
                            <div className="admin-modal-overlay">
                                <div className="admin-modal">
                                    <div className="admin-modal-header">
                                        <h3>Add New Category</h3>
                                        <button className="close-btn" onClick={() => { setShowAddCategory(false); setNewCategoryName(''); setNewCategoryImage(null); setNewCategoryImageName(''); }}>
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>
                                    <div className="admin-modal-body">
                                        <div className="admin-form-group">
                                            <label>Category Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="Enter category name" 
                                                value={newCategoryName} 
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="admin-form-group">
                                            <label>Category Image</label>
                                            <div className="file-input-wrapper">
                                                <label>
                                                    <FontAwesomeIcon icon={faImage} /> 
                                                    {newCategoryImageName ? newCategoryImageName : 'Upload Category Image'}
                                                </label>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={(e) => { 
                                                        setNewCategoryImage(e.target.files?.[0] || null); 
                                                        setNewCategoryImageName(e.target.files?.[0]?.name || ''); 
                                                    }} 
                                                />
                                            </div>
                                            {newCategoryImage && (
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                                                    Selected: {newCategoryImageName}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="admin-modal-footer">
                                        <button className="admin-btn" onClick={() => { setShowAddCategory(false); setNewCategoryName(''); setNewCategoryImage(null); setNewCategoryImageName(''); }} style={{ background: '#eee', color: '#333' }}>
                                            Cancel
                                        </button>
                                        <button className="admin-btn primary" onClick={handleAddCategory} disabled={uploading}>
                                            {uploading ? 'Adding...' : 'Add Category'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'orders' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1>Orders Management</h1>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '15%' }}>Customer</th>
                                        <th style={{ width: '25%' }}>Shipping Details</th>
                                        <th style={{ width: '20%' }}>Items</th>
                                        <th style={{ width: '10%' }}>Total</th>
                                        <th style={{ width: '10%' }}>Status</th>
                                        <th style={{ width: '10%' }}>Date</th>
                                        <th style={{ width: '10%' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id}>
                                            <td>{order.customer_email}</td>
                                            <td>
                                                {order.shipping_address ? (
                                                    <div style={{ fontSize: '0.82rem', lineHeight: '1.5', wordBreak: 'break-word' }}>
                                                        <span style={{ fontWeight: 600 }}>{order.shipping_address.fullName}</span>, 
                                                        <span> {order.shipping_address.street}</span>, 
                                                        <span> {order.shipping_address.city}{order.shipping_address.state ? `, ${order.shipping_address.state}` : ''}</span>. 
                                                        <span style={{ fontWeight: 500, color: 'var(--accent)', marginLeft: '4px' }}>{order.shipping_address.phone}</span>
                                                    </div>
                                                ) : <span style={{ color: '#999' }}>No address</span>}
                                            </td>
                                            <td>{order.items_detail?.map((item, i) => <div key={i}>{item.name}</div>)}</td>
                                            <td>LKR {order.total.toFixed(2)}</td>
                                            <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                                            <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className="custom-select-wrapper" style={{ minWidth: '110px' }}>
                                                    <div 
                                                        className={`admin-form-custom-select-trigger ${openOrderStatusId === order.id ? 'open' : ''}`}
                                                        style={{ padding: '0.4rem 1.8rem 0.4rem 0.6rem', fontSize: '0.8rem' }}
                                                        onClick={() => setOpenOrderStatusId(openOrderStatusId === order.id ? null : order.id)}
                                                    >
                                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                    </div>
                                                    {openOrderStatusId === order.id && (
                                                        <div className="custom-select-dropdown" style={{ minWidth: '110px' }}>
                                                            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                                                                <div 
                                                                    key={status}
                                                                    className="custom-select-option"
                                                                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                                                                    onClick={() => {
                                                                        handleStatusChange(order.id, status);
                                                                        setOpenOrderStatusId(null);
                                                                    }}
                                                                >
                                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
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
                        <h1>Payment Setup</h1>
                        <div className="admin-card">
                            <h3>LankaQR Integration</h3>
                            <p style={{ color: '#666', marginBottom: '1.5rem' }}>Configure your merchant details for LankaQR payments.</p>
                            
                            <div className="admin-form-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)', gap: '1.5rem' }}>
                                <div className="file-input-wrapper">
                                    <label>
                                        <FontAwesomeIcon icon={faImage} /> {qrLoading ? 'Parsing...' : 'Upload QR Image to Auto-Fill'}
                                    </label>
                                    <input type="file" accept="image/*" onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setQrLoading(true);
                                            setQrError('');
                                            try {
                                                const qrText = await readQRFromFile(file);
                                                if (qrText) await parseQR(qrText);
                                                else setQrError('No QR code found in image');
                                            } catch (err) {
                                                setQrError('Failed to read QR image');
                                            } finally {
                                                setQrLoading(false);
                                            }
                                        }
                                    }} />
                                </div>
                                {qrError && <p style={{ color: '#d9534f', fontSize: '0.85rem' }}>{qrError}</p>}
                                
                                {qrResult && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f8f8', borderRadius: '8px', border: '1px solid #eee' }}>
                                        <h4 style={{ marginBottom: '1rem' }}>Merchant Details Found:</h4>
                                        <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#666' }}>Name:</span>
                                                <span style={{ fontWeight: 600 }}>{qrResult.merchant_name}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#666' }}>City:</span>
                                                <span>{qrResult.merchant_city}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#666' }}>Bank Code:</span>
                                                <span>{qrResult.bank_code}</span>
                                            </div>
                                        </div>
                                        <button 
                                            className="admin-btn primary" 
                                            style={{ marginTop: '1rem', width: '100%' }}
                                            onClick={async () => {
                                                if (!user) return;
                                                const res = await fetch('/api/admin', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ 
                                                        action: 'save_merchant', 
                                                        data: {
                                                            merchant_name: qrResult.merchant_name,
                                                            merchant_city: qrResult.merchant_city,
                                                            bank_code: qrResult.bank_code,
                                                            qr_payload: currentQrPayload
                                                        }, 
                                                        userEmail: user.email 
                                                    })
                                                });
                                                const json = await res.json();
                                                if (json.success) {
                                                    setQrResult(null);
                                                    setCurrentQrPayload('');
                                                    loadSavedMerchant();
                                                } else {
                                                    alert(json.error);
                                                }
                                            }}
                                        >
                                            Save Merchant
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="admin-card" style={{ marginTop: '2rem' }}>
                            <h3>Saved Merchants</h3>
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Merchant Name</th>
                                            <th>City</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {savedMerchants.map(m => (
                                            <tr key={m.id}>
                                                <td style={{ fontWeight: 500 }}>{m.merchant_name}</td>
                                                <td>{m.merchant_city}</td>
                                                <td>
                                                    <span className={`status-badge ${m.selected ? 'completed' : 'pending'}`}>
                                                        {m.selected ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {!m.selected && (
                                                        <button 
                                                            className="admin-btn secondary" 
                                                            onClick={async () => {
                                                                if (!user) return;
                                                                const res = await fetch('/api/admin', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ action: 'select_merchant', data: { id: m.id }, userEmail: user.email })
                                                                });
                                                                const json = await res.json();
                                                                if (!json.error) loadSavedMerchant();
                                                            }}
                                                        >
                                                            Select
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'announcements' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1>Announcement Bar</h1>
                        <div className="admin-card">
                            <h3>{editingAnnouncement ? 'Edit Phrase' : 'Add New Phrase'}</h3>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <input 
                                    type="text" 
                                    placeholder="Enter announcement text (e.g. Free shipping over LKR 5000)" 
                                    value={newPhrase} 
                                    onChange={(e) => setNewPhrase(e.target.value)}
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                                <button className="admin-btn primary" onClick={handleSaveAnnouncement}>
                                    {editingAnnouncement ? 'Update' : 'Add Phrase'}
                                </button>
                                {editingAnnouncement && (
                                    <button className="admin-btn secondary" onClick={() => { setEditingAnnouncement(null); setNewPhrase(''); }}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="admin-card" style={{ marginTop: '2rem' }}>
                            <h3>Manage Phrases</h3>
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Phrase</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {announcements.map(ann => (
                                            <tr key={ann.id}>
                                                <td>{ann.phrase}</td>
                                                <td>
                                                    <button 
                                                        onClick={() => toggleAnnouncementActive(ann)}
                                                        className={`status-badge ${ann.is_active ? 'completed' : 'cancelled'}`}
                                                        style={{ border: 'none', cursor: 'pointer' }}
                                                    >
                                                        {ann.is_active ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="admin-btn secondary" style={{ padding: '0.4rem' }} onClick={() => { setEditingAnnouncement(ann); setNewPhrase(ann.phrase); }}>
                                                            Edit
                                                        </button>
                                                        <button className="admin-btn secondary" style={{ padding: '0.4rem', color: '#d9534f' }} onClick={() => handleDeleteAnnouncement(ann.id)}>
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {announcements.length === 0 && (
                                            <tr>
                                                <td colSpan={3} style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No announcements found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
