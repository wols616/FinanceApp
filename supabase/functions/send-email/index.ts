import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as postmark from 'https://esm.sh/postmark'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  type?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, type }: EmailRequest = await req.json()

    // Validación básica
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos: to, subject, html' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseClient = createClient(
      'https://xlhuozhevoicqpyiynhp.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsaHVvemhldm9pY3FweWl5bmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTMyOTksImV4cCI6MjA2NTIyOTI5OX0.3rmWeLAe_1hBU2PYN-B4QmcZuf8f2lUPJoIOLrinxjE',
      { 
        global: { 
          headers: { 
            Authorization: req.headers.get('Authorization')! 
          } 
        } 
      }
    )

    const { data, error } = await supabaseClient.functions.invoke('email', {
      body: {
        to,
        subject,
        html,
        from: 'FinanceApp <no-reply@financeapp.com>',
      }
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent via Supabase',
        supabaseData: data,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error completo al enviar email:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack,
        message: 'Failed to send email using all methods'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})