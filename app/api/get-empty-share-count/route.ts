import { NextResponse } from "next/server";
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    // Query total empty shares
    const { data, error } = await supabaseAdmin
      .from("sacrifice_animals")
      .select("empty_share");

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch empty shares" },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          }  
        }
      );
    }

    // Calculate total empty shares
    const totalEmptyShares = data.reduce(
      (sum, item) => sum + (item.empty_share || 0),
      0
    );
    
    // Return response with cache control headers
    return NextResponse.json(
      { totalEmptyShares },
      {
        headers: {
          // Prevent caching to ensure fresh data
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  }
} 