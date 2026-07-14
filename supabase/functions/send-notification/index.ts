import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!supabaseUrl || !supabaseServiceKey || !twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { type, userId, propertyId } = await req.json()

    if (!type || !userId || !propertyId) {
      throw new Error('Missing required fields: type, userId, propertyId')
    }

    // Fetch user details
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .eq('id', userId)
      .single()

    if (userError || !userProfile?.phone) {
      throw new Error('User not found or phone number missing')
    }

    // Fetch property details
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('title')
      .eq('id', propertyId)
      .single()

    if (propError || !property) {
      throw new Error('Property not found')
    }

    let messageBody = ''
    if (type === 'booking_confirmation') {
      messageBody = `Hi ${userProfile.full_name}, your visit request for ${property.title} has been confirmed. / नमस्ते ${userProfile.full_name}, ${property.title} के लिए आपका विज़िट अनुरोध कन्फर्म हो गया है। - GoEazy`
    } else if (type === 'payment_success') {
      messageBody = `Hi ${userProfile.full_name}, your ₹9 payment to unlock contact details for ${property.title} was successful. / नमस्ते ${userProfile.full_name}, ${property.title} का विवरण देखने के लिए आपका ₹9 का भुगतान सफल रहा। - GoEazy`
    } else {
      throw new Error('Invalid notification type')
    }

    // Determine To number format (WhatsApp or SMS based on Twilio config, usually determined by sender format)
    // If TWILIO_PHONE_NUMBER starts with "whatsapp:", then "To" should also have it.
    let toNumber = userProfile.phone
    if (twilioPhoneNumber.startsWith('whatsapp:') && !toNumber.startsWith('whatsapp:')) {
      // Basic formatting, assumes phone is in E.164 format. 
      // If not, it should be validated on the frontend.
      toNumber = `whatsapp:${toNumber}`
    }

    // Call Twilio API
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)
    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${twilioAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: toNumber,
          From: twilioPhoneNumber,
          Body: messageBody,
        }),
      }
    )

    const twilioData = await twilioRes.json()
    const status = twilioRes.ok ? 'sent' : 'failed'

    // Log notification
    await supabase.from('notifications_log').insert({
      user_id: userId,
      type: type,
      status: status,
      recipient_phone: userProfile.phone,
      message_body: messageBody,
    })

    if (!twilioRes.ok) {
      console.error('Twilio Error:', twilioData)
      throw new Error(`Twilio API failed: ${twilioData.message || 'Unknown error'}`)
    }

    return new Response(JSON.stringify({ success: true, messageId: twilioData.sid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Send Notification Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
