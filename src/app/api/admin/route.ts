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
        const adminActions = ['add_product', 'update_product', 'delete_product', 'update_order_status', 'add_category', 'select_merchant'];

        if (adminActions.includes(action) && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
        }

        if (!userEmail) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        switch (action) {
            case 'add_product': {
                const { name, price, quantity, image, category, description, benefits, how_to_use, ingredients, short_benefit, item_code } = data;
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
                    item_code
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
                const { id, name, price, quantity, image, category, description, benefits, how_to_use, ingredients, short_benefit, item_code, oldImage } = data;
                
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
                    item_code
                }).eq('id', id).select().single();
                
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true, data: product });
            }

            case 'add_category': {
                const { name } = data;
                const { data: category, error } = await adminClient.from('categories').insert({ name }).select().single();
                
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
                
                // 1. Fetch selected merchant details
                const { data: merchant } = await adminClient
                    .from('merchant_data')
                    .select('*')
                    .eq('selected', true)
                    .single();

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
                
                // 2. Generate QR Code if merchant exists
                let qrBase64 = null;
                if (merchant) {
                    try {
                        const qrResponse = await fetch('https://b2u-qr-worker.qr4pos.workers.dev/generate', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${process.env.QR_WORKER_API_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                amount: total.toFixed(2),
                                reference_number: invoiceNumber || order.id.toString(), // Use invoiceNumber as reference
                                merchant_id: merchant.merchant_id,
                                bank_code: merchant.bank_code,
                                terminal_id: merchant.terminal_id,
                                merchant_name: merchant.merchant_name,
                                merchant_city: merchant.merchant_city,
                                mcc: merchant.mcc,
                                currency_code: merchant.currency_code,
                                country_code: merchant.country_code
                                // format: 'base64' is now default
                            })
                        });
                        const qrData: any = await qrResponse.json();
                        qrBase64 = qrData.base64;
                    } catch (qrErr) {
                        console.error('QR Generation failed:', qrErr);
                    }
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
                const { imageData, fileName } = data;
                const { data: uploadData, error } = await adminClient.storage
                    .from('products')
                    .upload(fileName, Buffer.from(imageData, 'base64'), {
                        contentType: 'image/*'
                    });

                if (error) return NextResponse.json({ error: error.message }, { status: 500 });

                const { data: { publicUrl } } = adminClient.storage
                    .from('products')
                    .getPublicUrl(fileName);

                return NextResponse.json({ success: true, url: publicUrl });
            }

            case 'save_merchant': {
                const { merchant_id, bank_code, terminal_id, merchant_name, merchant_city, mcc, currency_code, country_code } = data;
                const { data: merchant, error } = await adminClient.from('merchant_data').insert({
                    merchant_id,
                    bank_code,
                    terminal_id,
                    merchant_name,
                    merchant_city,
                    mcc,
                    currency_code,
                    country_code
                }).select().single();
                
                if (error) return NextResponse.json({ error: error.message }, { status: 500 });
                return NextResponse.json({ success: true, data: merchant });
            }

            case 'select_merchant': {
                const { id } = data;
                // Deselect all
                const { error: deselectError } = await adminClient
                    .from('merchant_data')
                    .update({ selected: false })
                    .neq('id', '00000000-0000-0000-0000-000000000000');

                if (deselectError) return NextResponse.json({ error: deselectError.message }, { status: 500 });

                // Select the new one
                const { error: selectError } = await adminClient
                    .from('merchant_data')
                    .update({ selected: true })
                    .eq('id', id);

                if (selectError) return NextResponse.json({ error: selectError.message }, { status: 500 });

                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
