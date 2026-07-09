// Setup type definitions for built-in Supabase Runtime APIs
import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Note: For a true production Parquet file, we would use a WebAssembly 
// binding like `parquet-wasm`. For this hackathon prototype, we will 
// aggregate the data into a columnar JSON array and compress it, which 
// accurately simulates the Extract, Transform, Load (ETL) pipeline.

serve(async (req) => {
  // Ensure we only accept POST requests from pg_cron
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Authorize via Service Role Key
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // 1. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // 2. EXTRACT: Fetch all telemetry older than 72 hours
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - 72);

    const { data: oldViews, error: fetchError } = await supabaseAdmin
      .from('property_views')
      .select('id, property_id, viewed_at')
      .lt('viewed_at', thresholdDate.toISOString())

    if (fetchError) throw fetchError;

    if (!oldViews || oldViews.length === 0) {
      return new Response('No old telemetry to archive.', { status: 200 })
    }

    // 3. TRANSFORM: Aggregate data by property_id and date
    const aggregatedData = {};
    const processedIds = [];

    for (const view of oldViews) {
      processedIds.push(view.id);
      
      const date = new Date(view.viewed_at).toISOString().split('T')[0];
      const key = `${view.property_id}_${date}`;
      
      if (!aggregatedData[key]) {
        aggregatedData[key] = {
          property_id: view.property_id,
          date: date,
          total_views: 0
        };
      }
      aggregatedData[key].total_views += 1;
    }

    // Convert to a simulated Columnar Format (like Parquet)
    const columnarBuffer = {
      property_ids: [],
      dates: [],
      total_views: []
    };

    Object.values(aggregatedData).forEach(row => {
      columnarBuffer.property_ids.push(row.property_id);
      columnarBuffer.dates.push(row.date);
      columnarBuffer.total_views.push(row.total_views);
    });

    const fileBuffer = new TextEncoder().encode(JSON.stringify(columnarBuffer));
    
    // Generate a unique filename for the batch
    const filename = `telemetry_archive_${new Date().toISOString().split('T')[0]}_${Date.now()}.parquet`;

    // 4. LOAD: Upload to S3 Cold Storage Bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('telemetry_cold_storage')
      .upload(filename, fileBuffer, {
        contentType: 'application/octet-stream',
        upsert: false
      });

    // 5. PRUNE: Only execute the DELETE if the upload was absolutely successful (200 OK equivalent)
    if (uploadError) {
      console.error('Storage Upload Failed. Aborting DELETE to prevent data loss.', uploadError);
      throw uploadError;
    }

    if (uploadData) {
      console.log(`Successfully uploaded ${filename}. Proceeding to prune primary database...`);

      // Safe Deletion: We only delete the EXACT row IDs we successfully aggregated and archived.
      const { error: deleteError } = await supabaseAdmin
        .from('property_views')
        .delete()
        .in('id', processedIds)

      if (deleteError) {
        // Edge case: Upload succeeded, but delete failed. We log it. It will be re-archived next run 
        // (which is fine, idempotency can handle duplicates in cold storage later)
        console.error('Failed to prune database after successful upload', deleteError);
        throw deleteError;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Archived ${processedIds.length} rows to ${filename}` 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('ETL Pipeline Failed', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
