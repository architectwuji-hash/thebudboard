import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { NotifyRequest } from '@/lib/types';

// Optional: wire up Twilio (text) or SendGrid (email) here.
// Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM in .env
// Set SENDGRID_API_KEY, SENDGRID_FROM in .env

export async function POST(req: NextRequest) {
  const body: NotifyRequest = await req.json();
  const { dealId, contactType, contact, productName, dispensary } = body;

  if (!contact || !contactType) {
    return NextResponse.json({ error: 'Missing contact info' }, { status: 400 });
  }

  // Log the signup to Supabase
  const { error: dbErr } = await supabase.from('deal_notifications').insert({
    deal_id:        dealId,
    contact_type:   contactType,
    contact_value:  contact,
    product_name:   productName,
    dispensary_name: dispensary,
  });

  if (dbErr) {
    console.error('[/api/notify] db error:', dbErr);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  // ── SMS via Twilio ───────────────────────────────────────
  if (contactType === 'text' && process.env.TWILIO_ACCOUNT_SID) {
    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    await twilio.messages.create({
      body: `TheBudBoard 🌿\n${productName} at ${dispensary}\nHead in and grab it! Questions? Reply STOP to unsubscribe.`,
      from: process.env.TWILIO_FROM,
      to:   contact,
    });
  }

  // ── Email via SendGrid ───────────────────────────────────
  if (contactType === 'email' && process.env.SENDGRID_API_KEY) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send({
      to:      contact,
      from:    process.env.SENDGRID_FROM ?? 'deals@thebudboard.com',
      subject: `Your deal: ${productName} @ ${dispensary}`,
      text:    `TheBudBoard 🌿\n\n${productName} is available at ${dispensary}.\n\nHead in and grab it!\n\n—TheBudBoard.com`,
    });
  }

  return NextResponse.json({ ok: true });
}
