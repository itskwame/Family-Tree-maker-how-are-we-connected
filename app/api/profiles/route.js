import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '../../../lib/supabaseServer';

export async function GET() {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from('profiles').select('id, full_name, headline, city').limit(12);
    if (error) throw error;
    return NextResponse.json({ profiles: data ?? [] });
  } catch (error) {
    console.error('Profiles GET error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        full_name: body.full_name,
        headline: body.headline,
        city: body.city,
      })
      .select('id, full_name, headline, city')
      .single();

    if (error) throw error;
    return NextResponse.json({ profile: data }, { status: 201 });
  } catch (error) {
    console.error('Profiles POST error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
