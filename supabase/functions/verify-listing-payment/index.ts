import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts"

let fontBytes: Uint8Array | null = null;
async function getFont() {
  if (fontBytes) return fontBytes;
  const res = await fetch('https://fastly.jsdelivr.net/gh/google/fonts@master/ofl/inter/static/Inter-Bold.ttf');
  if (!res.ok) throw new Error('Failed to load font for watermark');
  fontBytes = new Uint8Array(await res.arrayBuffer());
  return fontBytes;
}

const ALLOWED_ORIGINS = [
  'https://goeazy.in', 'https://www.goeazy.in',
  'https://goeazy.vercel.app', 'https://goeazy.app', 'https://www.goeazy.app',
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const isLocalhost = origin.startsWith('http://localhost:')
  const allowed = (ALLOWED_ORIGINS.includes(origin) || isLocalhost) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const encoder = new TextEncoder()
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)
  let diff = 0
  for (let i = 0; i < aBytes.length; i++) { diff |= aBytes[i] ^ bBytes[i] }
  return diff === 0
}

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  const text = `${orderId}|${paymentId}`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(text))
  const hashHex = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  return timingSafeEqual(hashHex, signature)
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, property_data } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !property_data) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      })
    }

    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!

    // Use service role key to validate ES256 JWTs
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !authData?.user) {
      console.error('Auth failed:', authError?.message)
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      })
    }

    const user = authData.user

    // 2. Verify HMAC signature (timing-safe)
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, secret)
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      })
    }

    // 3. Cross-validate with Razorpay API — ensure amount is exactly ₹199
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!
    const auth = btoa(`${keyId}:${secret}`)
    const payResp = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { Authorization: `Basic ${auth}` }
    })

    if (!payResp.ok) {
      return new Response(JSON.stringify({ error: 'Could not validate payment with Razorpay' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502,
      })
    }

    const payment = await payResp.json()
    if (payment.order_id !== razorpay_order_id) {
      return new Response(JSON.stringify({ error: 'Order ID mismatch' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      })
    }
    // In test mode, status is 'authorized'; in live mode, it's 'captured'
    if (!['captured', 'authorized'].includes(payment.status)) {
      return new Response(JSON.stringify({ error: `Payment not completed: ${payment.status}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      })
    }
    if (payment.amount !== 19900) {
      return new Response(JSON.stringify({ error: 'Amount tampered' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      })
    }

    // 4. All checks pass — optimize and watermark images
    const watermarkedUrls = [];
    try {
      const font = await getFont();
      for (const imageUrl of property_data.images) {
        if (!imageUrl.includes('/property-images/')) {
          watermarkedUrls.push(imageUrl);
          continue;
        }

        // Fetch image bytes
        const imgResp = await fetch(imageUrl);
        if (!imgResp.ok) throw new Error(`Failed to fetch image ${imageUrl}`);
        const imgBytes = new Uint8Array(await imgResp.arrayBuffer());

        // Decode using imagescript
        const img = await Image.decode(imgBytes);

        // Resize down to 1200px max width to compress payload size
        if (img.width > 1200) {
          img.resize(1200, Image.RESIZE_AUTO);
        }

        // Render and draw watermark text (2.5% of width, semi-transparent white)
        const scale = Math.max(16, Math.round(img.width * 0.025));
        const textImage = await Image.renderText(font, scale, "GoEazy Verified", 0xffffff80);
        const padding = 20;
        img.composite(textImage, img.width - textImage.width - padding, img.height - textImage.height - padding);

        // Encode back to highly-optimized WebP
        const webpBytes = await img.encodeWEBP(80);

        // Parse relative path to maintain folder hierarchy in bucket
        const urlObj = new URL(imageUrl);
        const pathParts = urlObj.pathname.split('/storage/v1/object/public/property-images/');
        if (pathParts.length < 2) {
          watermarkedUrls.push(imageUrl);
          continue;
        }

        const relativePath = decodeURIComponent(pathParts[1]);
        const parts = relativePath.split('/');
        const userId = parts[0];
        const filename = parts.slice(1).join('/');
        const baseFilename = filename.substring(0, filename.lastIndexOf('.')) || filename;
        const targetPath = `${userId}/watermarked_${baseFilename}.webp`;

        // Upload processed WebP image
        const { error: uploadError } = await supabaseAdmin.storage
          .from('property-images')
          .upload(targetPath, webpBytes, {
            contentType: 'image/webp',
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload error for watermarked image:`, uploadError);
          watermarkedUrls.push(imageUrl); // fallback to original
        } else {
          const { data: { publicUrl } } = supabaseAdmin.storage.from('property-images').getPublicUrl(targetPath);
          watermarkedUrls.push(publicUrl);
        }
      }
      property_data.images = watermarkedUrls;
    } catch (wmError: any) {
      console.error("Watermark processing failed, falling back to original images:", wmError.message);
    }

    // 5. Create the property listing inside the DB pointing to the processed images
    const { data: property, error: insertError } = await supabaseAdmin
      .from('properties')
      .insert({
        ...property_data,
        landlord_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert property:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to create listing: ' + insertError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
      })
    }

    return new Response(JSON.stringify({ success: true, property }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })

  } catch (error: any) {
    console.error('Unexpected error in verify-listing-payment:', error.message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500,
    })
  }
})
