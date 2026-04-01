import { Suspense } from 'react';
import { getSupabase } from '@/lib/supabase';
import ProductsClient from './ProductsClient';

export const revalidate = 3600; // Revalidate every hour

async function getProducts() {
    const supabase = getSupabase();
    const { data } = await supabase.from('products').select('*').order('name');
    return data || [];
}

async function getCategories() {
    const supabase = getSupabase();
    const { data } = await supabase.from('categories').select('*').order('name');
    return data || [];
}

export default async function ProductsPage() {
    // Parallelize data fetching on the server
    const [products, categories] = await Promise.all([
        getProducts(),
        getCategories()
    ]);

    return (
        <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)' }}>Loading products...</div>}>
            <ProductsClient 
                initialProducts={products} 
                initialCategories={categories} 
            />
        </Suspense>
    );
}
