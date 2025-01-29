import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabaseClient'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { sacrifice_id, form_count } = data

    // Önce güncel empty_share değerini al
    const { data: currentSacrifice, error: fetchError } = await supabase
      .from('sacrifice_animals')
      .select('empty_share')
      .eq('sacrifice_id', sacrifice_id)
      .single()

    if (fetchError || !currentSacrifice) {
      throw fetchError || new Error('Sacrifice not found')
    }

    // Yeni empty_share değerini hesapla ve güncelle
    const { error: updateError } = await supabase
      .from('sacrifice_animals')
      .update({ empty_share: currentSacrifice.empty_share + form_count })
      .eq('sacrifice_id', sacrifice_id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update sacrifice error:', error)
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
} 