import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL!.toLowerCase();

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, data, userEmail } = body;

        const isAdmin = userEmail && userEmail.toLowerCase() === adminEmail;
        const adminActions = ['add_product', 'update_product', 'delete_product', 'update_order_status', 'add_category', 'select_merchant', 'add_announcement', 'update_announcement', 'delete_announcement', 'reorder_announcements'];

        if (adminActions.includes(action) && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
        }

        if (!userEmail) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        switch (action) {
            case 'add_product': {
                const { name, price, quantity, image, category, description, benefits, how_to_use, ingredients, short_benefit, item_code, meta_title, meta_description, slug, image_alt, sku } = data;
                const { data: product, error } = await adminClient.from('products').insert({
                    name,
                    price,
                    quantity,
                    image,
                    category,
                    description,
                    benefits,
                    how_to_use,
                    ingredients,
                    short_benefit,
                    item_code,
                    meta_title,
                    meta_description,
                    slug,
                    image_alt,
                    sku
                }).select().single();
                
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true, data: product });
            }

            case 'delete_product': {
                const { id } = data;
                const { error } = await adminClient.from('products').delete().eq('id', id);
                
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true });
            }

            case 'update_product': {
                const { id, name, price, quantity, image, category, description, benefits, how_to_use, ingredients, short_benefit, item_code, meta_title, meta_description, slug, image_alt, sku, oldImage } = data;
                
                if (oldImage && oldImage !== image && oldImage.includes('supabase')) {
                    const fileName = oldImage.split('/').pop();
                    if (fileName) {
                        await adminClient.storage.from('products').remove([fileName]);
                    }
                }
                
                const { data: product, error } = await adminClient.from('products').update({
                    name,
                    price,
                    quantity,
                    image,
                    category,
                    description,
                    benefits,
                    how_to_use,
                    ingredients,
                    short_benefit,
                    item_code,
                    meta_title,
                    meta_description,
                    slug,
                    image_alt,
                    sku
                }).eq('id', id).select().single();
                
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true, data: product });
            }

            case 'add_category': {
                const { name, image_url } = data;
                const { data: category, error } = await adminClient.from('categories').insert({ 
                    name,
                    image_url 
                }).select().single();
                
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true, data: category });
            }

            case 'get_orders': {
                const { data: orders, error } = await adminClient.from('orders').select('*').order('created_at', { ascending: false });
                
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true, data: orders });
            }

            case 'update_order_status': {
                const { id, status } = data;
                const { error } = await adminClient.from('orders').update({ status }).eq('id', id);
                
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true });
            }

            case 'place_order': {
                const { userId, items, total, shippingAddress, subtotal, shippingCost, invoiceNumber } = data;
                
                const { data: order, error: orderError } = await adminClient.from('orders').insert({
                    user_id: userId,
                    items,
                    total,
                    subtotal: subtotal || total,
                    shipping_cost: shippingCost || 0,
                    tax: 0,
                    shipping_address: shippingAddress || null,
                    status: 'pending',
                    invoice_number: invoiceNumber || null
                }).select().single();
                
                if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });
                
                // Generate QR Code
                let qrBase64 = null;
                try {
                    const qrResponse = await fetch('https://b2u-qr-worker.qr4pos.workers.dev/generate', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${process.env.QR_WORKER_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            amount: total.toFixed(2),
                            reference_number: invoiceNumber || order.id.toString(),
                            callback_url: 'https://www.skintalks.lk/api/webhooks/verify-payment'
                        })
                    });
                    const qrData: any = await qrResponse.json();
                    qrBase64 = qrData.base64;
                } catch (qrErr) {
                    console.error('QR Generation failed:', qrErr);
                }

                for (const item of items) {
                    const productId = item.product_id;
                    const { data: product } = await adminClient.from('products').select('quantity').eq('id', productId).single();
                    if (product && product.quantity > 0) {
                        await adminClient.from('products').update({ quantity: product.quantity - 1 }).eq('id', productId);
                    }
                }
                
                return NextResponse.json({ success: true, data: order, qr_base64: qrBase64 });
            }

            case 'upload_image': {
                const { imageData, fileName, bucket = 'products' } = data;
                
                // Ensure bucket exists or just try to upload
                const { data: uploadData, error } = await adminClient.storage
                    .from(bucket)
                    .upload(fileName, Buffer.from(imageData, 'base64'), {
                        contentType: 'image/*',
                        upsert: true
                    });

                if (error) return NextResponse.json({ error: error.message }, { status: 500 });

                const { data: { publicUrl } } = adminClient.storage
                    .from(bucket)
                    .getPublicUrl(fileName);

                return NextResponse.json({ success: true, url: publicUrl });
            }

            case 'save_merchant': {
                const { merchant_name, merchant_city, bank_code, qr_payload } = data;
                
                // Insert new merchant as selected
                const { data: merchant, error } = await adminClient.from('merchant_data').insert({
                    merchant_name,
                    merchant_city,
                    bank_code,
                    qr_payload,
                    selected: true
                }).select().single();
                
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });

                // Sync with external worker
                try {
                    await fetch('https://b2u-qr-worker.qr4pos.workers.dev/parse', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${process.env.QR_WORKER_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ payload: qr_payload })
                    });
                } catch (parseErr) {
                    console.error('External parse failed during save:', parseErr);
                    // We don't return error here because the DB save was successful
                }

                return NextResponse.json({ success: true, data: merchant });
            }

            case 'select_merchant': {
                const { id } = data;

                // 1. Fetch merchant to get payload
                const { data: merchantData, error: fetchError } = await adminClient
                    .from('merchant_data')
                    .select('qr_payload')
                    .eq('id', id)
                    .single();

                if (fetchError || !merchantData?.qr_payload) {
                    return NextResponse.json({ error: 'Merchant payload not found' }, { status: 404 });
                }

                // 2. Call external parse endpoint to set active state
                try {
                    const parseResponse = await fetch('https://b2u-qr-worker.qr4pos.workers.dev/parse', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${process.env.QR_WORKER_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ payload: merchantData.qr_payload })
                    });
                    
                    const parseResult: any = await parseResponse.json();
                    if (parseResult.status !== 'success' && parseResult.status !== 'ok') {
                        return NextResponse.json({ 
                            error: `External worker failed to activate merchant: ${parseResult.message || 'Unknown error'}` 
                        }, { status: 400 });
                    }
                } catch (parseErr) {
                    console.error('External parse failed:', parseErr);
                    return NextResponse.json({ error: 'Failed to notify worker of merchant switch' }, { status: 500 });
                }

                // 3. Select the new one (DB trigger handles deselecting others)
                const { error: selectError } = await adminClient
                    .from('merchant_data')
                    .update({ selected: true })
                    .eq('id', id);

                if (selectError) return NextResponse.json({ error: selectError.message }, { status: 500 });

                return NextResponse.json({ success: true });
            }

            case 'get_announcements': {
                const { data: announcements, error } = await adminClient.from('announcements').select('*').order('display_order', { ascending: true });
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true, data: announcements });
            }
            
            case 'add_announcement': {
                const { phrase, is_active, display_order } = data;
                const { data: announcement, error } = await adminClient.from('announcements').insert({
                    phrase,
                    is_active,
                    display_order: display_order || 0
                }).select().single();
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true, data: announcement });
            }
            
            case 'update_announcement': {
                const { id, phrase, is_active, display_order } = data;
                const { data: announcement, error } = await adminClient.from('announcements').update({
                    phrase,
                    is_active,
                    display_order
                }).eq('id', id).select().single();
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true, data: announcement });
            }
            
            case 'delete_announcement': {
                const { id } = data;
                const { error } = await adminClient.from('announcements').delete().eq('id', id);
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true });
            }
            
            case 'reorder_announcements': {
                const { orders } = data; // Array of {id, display_order}
                for (const item of orders) {
                    await adminClient.from('announcements').update({ display_order: item.display_order }).eq('id', item.id);
                }
                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
