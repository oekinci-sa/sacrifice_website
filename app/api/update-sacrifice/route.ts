import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const {
            sacrifice_id,
            sacrifice_no,
            sacrifice_time,
            share_weight,
            share_price,
            empty_share,
            notes,
            last_edited_by,
            last_edited_time
        } = body;

        if (!sacrifice_id) {
            return NextResponse.json({ error: 'Sacrifice ID is required' }, { status: 400 });
        }

        // Update the sacrifice record in the database using supabaseAdmin
        const { data: updatedSacrifice, error } = await supabaseAdmin
            .from('sacrifice_animals')
            .update({
                sacrifice_no,
                sacrifice_time,
                share_weight,
                share_price,
                empty_share,
                notes,
                last_edited_by,
                last_edited_time: last_edited_time || new Date().toISOString()
            })
            .eq('sacrifice_id', sacrifice_id)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: 'Failed to update sacrifice: ' + error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Sacrifice updated successfully',
            data: updatedSacrifice
        });
    } catch (error) {
        console.error('Error updating sacrifice:', error);
        return NextResponse.json(
            { error: 'Failed to update sacrifice' },
            { status: 500 }
        );
    }
} 