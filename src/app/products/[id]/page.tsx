import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import ProductDetailClient from './ProductDetailClient';
import { cache } from 'react';

interface Props {
  params: { id: string };
}

// Remove force-dynamic to enable caching, but keep a reasonable revalidation
export const revalidate = 3600; // Revalidate every hour

// Cache the product fetch to deduplicate between generateMetadata and the Page component
const getProductBySlugOrId = cache(async (slugOrId: string) => {
  const supabase = getSupabase();
  
  // 1. Try exact slug
  let { data } = await supabase
    .from('products')
    .select('*')
    .ilike('slug', slugOrId)
    .maybeSingle();
  
  // 2. Try with leading slash if not found
  if (!data) {
    const { data: slashData } = await supabase
      .from('products')
      .select('*')
      .ilike('slug', `/${slugOrId}`)
      .maybeSingle();
    data = slashData;
  }

  // 3. Try fallback search if still not found
  if (!data) {
      const { data: searchData } = await supabase
        .from('products')
        .select('name, slug')
        .ilike('slug', `%${slugOrId}%`);
      if (searchData && searchData.length > 0) {
          const { data: fullData } = await supabase.from('products').select('*').eq('slug', searchData[0].slug).single();
          data = fullData;
      }
  }
  return data;
});

async function getRelatedProducts(category: string, excludeId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .neq('id', excludeId)
    .limit(4);
  return data || [];
}

async function getReviews(productId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('product_reviews')
    .select('*, user_profiles(name)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  return data || [];
}

async function getCategories() {
    const supabase = getSupabase();
    const { data } = await supabase.from('categories').select('*').order('name');
    return data || [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: slugOrId } = await params;
  const product = await getProductBySlugOrId(slugOrId);
  
  if (!product) {
    return {
      title: 'Product Not Found | SkinTalk',
    };
  }

  const productSlug = product.slug || product.id;
  const title = product.meta_title || `${product.name} | SkinTalk`;
  const description = product.meta_description || product.description?.substring(0, 160);
  const url = `https://skintalks.lk/products/${productSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: product.image,
          alt: product.image_alt || product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id: slugOrId } = await params;
  const product = await getProductBySlugOrId(slugOrId);

  if (!product) {
    notFound();
  }

  // Redirect if accessed via ID but has a slug
  if (slugOrId === product.id && product.slug) {
    redirect(`/products/${product.slug}`);
  }

  // Parallelize remaining fetches
  const [relatedProducts, reviews, categories] = await Promise.all([
    getRelatedProducts(product.category, product.id),
    getReviews(product.id),
    getCategories()
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    description: product.description,
    sku: product.sku || product.item_code,
    brand: {
      '@type': 'Brand',
      name: 'SkinTalk',
    },
    offers: {
      '@type': 'Offer',
      url: `https://skintalks.lk/products/${product.slug || product.id}`,
      priceCurrency: 'LKR',
      price: product.price,
      availability: product.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    aggregateRating: reviews.length > 0 ? {
        '@type': 'AggregateRating',
        ratingValue: reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length,
        reviewCount: reviews.length,
    } : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient 
        initialProduct={product} 
        initialRelatedProducts={relatedProducts}
        initialReviews={reviews}
        serverCategories={categories}
      />
    </>
  );
}
