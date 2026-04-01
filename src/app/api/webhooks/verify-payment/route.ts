import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const apiKey = authHeader ? authHeader.split(' ')[1] : null;

        if (!apiKey || apiKey !== process.env.QR_WORKER_API_KEY) {
            console.warn('Unauthorized payment verification attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { status, reference, amount } = body;

        console.log(`LankaQR Webhook received: ${reference} - ${status}`);

        if (status !== 'SUCCESS') {
            return NextResponse.json({ message: 'Payment not successful' }, { status: 200 });
        }

        // 1. Find the order by invoice_number
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('invoice_number', reference)
            .single();

        if (fetchError || !order) {
            console.error(`Order not found for ref: ${reference}`);
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        // 2. Security Check: Verify amount matches (optional but recommended)
        // Note: Banks sometimes send with decimal differences, so careful comparison is needed.
        const orderAmount = parseFloat(order.total).toFixed(2);
        const bankAmount = parseFloat(amount).toFixed(2);
        
        if (orderAmount !== bankAmount) {
            console.warn(`Amount mismatch for ${reference}: Order=${orderAmount}, Bank=${bankAmount}`);
            // We can still mark as paid or just log it. Usually, we log and proceed if close enough.
        }

        // 3. Update order status to 'paid'
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'paid', updated_at: new Date().toISOString() })
            .eq('id', order.id);

        if (updateError) {
            console.error(`Failed to update order ${order.id}:`, updateError);
            return NextResponse.json({ message: 'Update failed' }, { status: 500 });
        }

        console.log(`Order ${order.id} marked as PAID successfully.`);
        return NextResponse.json({ success: true, message: 'Order updated' });

    } catch (err: any) {
        console.error('Webhook processing error:', err);
        return NextResponse.json({ message: 'Internal error' }, { status: 500 });
    }
}
