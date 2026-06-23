/**
 * Stripe Webhook — rejestruje zakupy terapeutów w tabeli `purchases`.
 *
 * Wymagane zmienne środowiskowe (Supabase Dashboard → Edge Functions → Secrets):
 *   STRIPE_WEBHOOK_SECRET   — sekret podpisujący webhooki (whsec_...)
 *   SUPABASE_URL            — URL projektu (automatycznie dostępny)
 *   SUPABASE_SERVICE_ROLE_KEY — klucz service_role (automatycznie dostępny)
 *
 * W dashboardzie Stripe skonfiguruj endpoint:
 *   URL: https://<project>.supabase.co/functions/v1/stripe-webhook
 *   Events: checkout.session.completed
 *
 * Parametr `client_reference_id` w Stripe Payment Link musi zawierać user_id.
 * Dodaj go do Payment Link: Products → Link → Advanced → Client reference ID → {user_id}
 * lub przekazuj go przez query param: ?client_reference_id={user_id}
 *
 * Parametr `metadata.therapist_id` musi być ustawiony w Payment Link:
 *   Products → Link → Advanced → Metadata → therapist_id: neurobiolog
 */

import { createClient } from 'npm:@supabase/supabase-js@^2'
import Stripe from 'npm:stripe@^17'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2025-05-28.basil',
})

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // --- Weryfikacja podpisu Stripe ---
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!sig || !webhookSecret) {
    return new Response('Missing stripe-signature or webhook secret', { status: 400 })
  }

  let event: Stripe.Event
  try {
    const body = await req.text()
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret)
  } catch (err) {
    console.error('Stripe signature verification failed:', err)
    return new Response(`Webhook signature verification failed: ${err}`, { status: 400 })
  }

  // --- Obsługuj tylko checkout.session.completed ---
  if (event.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const session = event.data.object as Stripe.Checkout.Session

  // Wymagane pola
  const userId = session.client_reference_id
  const therapistId = session.metadata?.therapist_id

  if (!userId || !therapistId) {
    console.error('Missing client_reference_id or metadata.therapist_id', {
      userId,
      therapistId,
      sessionId: session.id,
    })
    // Zwróć 200 żeby Stripe nie próbował ponownie — logujemy błąd konfiguracji
    return new Response(JSON.stringify({ received: true, warning: 'missing fields' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // --- Zapisz zakup w bazie (service_role omija RLS) ---
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { error } = await supabase
    .from('purchases')
    .upsert(
      {
        user_id: userId,
        therapist_id: therapistId,
        stripe_session_id: session.id,
      },
      { onConflict: 'stripe_session_id' }, // idempotentność — wielokrotne dostarczenie webhooka jest bezpieczne
    )

  if (error) {
    console.error('Failed to save purchase:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`Purchase saved: user=${userId}, therapist=${therapistId}, session=${session.id}`)

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
