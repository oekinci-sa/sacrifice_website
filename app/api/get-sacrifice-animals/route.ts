import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

// ✅ Force Node.js runtime to access process.env
export const runtime = "nodejs";

// This is a server-side API endpoint (Route Handler)
// It will be accessible at /api/get-sacrifice-animals
export async function GET() {
  try {
    // Use supabaseAdmin client with service role to fetch data
    const { data, error } = await supabaseAdmin
      .from('sacrifice_animals')
      .select('*')
      .order('sacrifice_no', { ascending: true });

    if (error) {
      console.error('Supabase sorgu hatası:', error);
      return NextResponse.json(
        { error: `Veritabanı hatası: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Beklenmeyen hata:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası oluştu' },
      { status: 500 }
    );
  }
} 