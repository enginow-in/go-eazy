import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

serve(async () => {
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

    // Calculate time window (e.g., visits happening within the next 24 hours, since frontend only sends date)
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Fetch pending visits for the window
    const { data: visits, error: visitsError } = await supabase
      .from('site_visits')
      .select(`
        id, 
        visit_date, 
        user_id, 
        landlord_id,
        property_id,
        properties(title)
      `)
      .eq('status', 'pending')
      .gte('visit_date', now.toISOString().split('T')[0])
      .lte('visit_date', tomorrow.toISOString().split('T')[0])

    if (visitsError) throw visitsError

    if (!visits || visits.length === 0) {
      return new Response(JSON.stringify({ message: 'No upcoming visits' }), { status: 200 })
    }

    const sentCount = 0
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)

    for (const visit of visits) {
      // Check if we already sent a reminder for this visit today
      const { data: existingLogs } = await supabase
        .from('notifications_log')
        .select('id')
        .eq('user_id', visit.user_id)
        .eq('type', 'visit_reminder')
        .gte('created_at', now.toISOString().split('T')[0])
      
      if (existingLogs && existingLogs.length > 0) {
        continue; // Already sent
      }

      // Fetch tenant and landlord profiles
      const { data: tenant } = await supabase.from('profiles').select('phone, full_name').eq('id', visit.user_id).single()
      const { data: landlord } = await supabase.from('profiles').select('phone, full_name').eq('id', visit.landlord_id).single()

      const propertyTitle = visit.properties?.title || 'the property'
      
      const sendTwilio = async (phone, message, userId) => {
        if (!phone) return
        let toNumber = phone
        if (twilioPhoneNumber.startsWith('whatsapp:') && !toNumber.startsWith('whatsapp:')) {
          toNumber = `whatsapp:${toNumber}`
        }

        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: toNumber, From: twilioPhoneNumber, Body: message })
        })
        
        await supabase.from('notifications_log').insert({
          user_id: userId,
          type: 'visit_reminder',
          status: res.ok ? 'sent' : 'failed',
          recipient_phone: phone,
          message_body: message,
        })
      }

      // Send to Tenant
      if (tenant?.phone) {
        const msg = `Reminder: You have a scheduled visit for ${propertyTitle} on ${visit.visit_date}. / अनुस्मारक: ${propertyTitle} के लिए आपकी विज़िट ${visit.visit_date} को निर्धारित है।`
        await sendTwilio(tenant.phone, msg, visit.user_id)
      }

      // Send to Landlord
      if (landlord?.phone) {
        const msg = `Reminder: You have a tenant visit scheduled for ${propertyTitle} on ${visit.visit_date}. / अनुस्मारक: ${propertyTitle} के लिए किरायेदार की विज़िट ${visit.visit_date} को निर्धारित है।`
        await sendTwilio(landlord.phone, msg, visit.landlord_id)
      }
    }

    return new Response(JSON.stringify({ success: true, processed: visits.length }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Visit Reminders Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
