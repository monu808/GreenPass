import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { paymentService } from '@/lib/paymentService';
import { logger } from '@/lib/logger';

/**
 * Webhook handler for payment gateway callbacks
 * Supports both Razorpay and Stripe webhooks
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature') ||
      request.headers.get('stripe-signature') || '';

    // Determine gateway from signature header
    const isRazorpay = request.headers.has('x-razorpay-signature');
    const isStripe = request.headers.has('stripe-signature');

    if (isRazorpay) {
      return handleRazorpayWebhook(body, signature);
    } else if (isStripe) {
      return handleStripeWebhook(body, signature);
    } else {
      return NextResponse.json(
        { error: 'Invalid webhook source' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    logger.error(
      'Webhook error',
      error,
      { component: 'payments-webhook-route', operation: 'handleWebhook' }
    );
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Timing-safe comparison for webhook signatures
 */
function timingSafeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    // If lengths differ, we still do a comparison to avoid timing leaks
    if (bufA.length !== bufB.length) {
      // Compare against itself to maintain constant time
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Handle Razorpay webhook
 */
async function handleRazorpayWebhook(body: string, signature: string) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error(
        'Razorpay webhook secret not configured',
        null,
        { component: 'payments-webhook-route', operation: 'razorpayWebhook' }
      );
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Verify signature using timing-safe compare
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (!timingSafeEqual(signature, expectedSignature)) {
      logger.error(
        'Invalid Razorpay webhook signature',
        null,
        { component: 'payments-webhook-route', operation: 'razorpayWebhook', metadata: { signaturePresent: true, signatureLength: signature?.length || 0 } }
      );
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const event = JSON.parse(body);
    const { event: eventType, payload } = event;

    console.log('Razorpay webhook event:', eventType);

    // Handle different event types
    switch (eventType) {
      case 'payment.authorized':
      case 'payment.captured':
        await paymentService.handlePaymentWebhook(
          payload.payment.entity.id,
          'succeeded',
          payload.payment.entity.method
        );
        break;

      case 'payment.failed':
        await paymentService.handlePaymentWebhook(
          payload.payment.entity.id,
          'failed'
        );
        break;

      case 'refund.created':
      case 'refund.processed':
        // Refund webhook handling
        console.log('Refund processed:', payload.refund.entity.id);
        break;

      default:
        console.log('Unhandled Razorpay event type:', eventType);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error(
      'Razorpay webhook error',
      error,
      { component: 'payments-webhook-route', operation: 'razorpayWebhook' }
    );
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle Stripe webhook
 */
async function handleStripeWebhook(body: string, signature: string) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!webhookSecret) {
      logger.error(
        'Stripe webhook secret not configured',
        null,
        { component: 'payments-webhook-route', operation: 'stripeWebhook' }
      );
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    if (!stripeSecretKey) {
      logger.error(
        'Stripe secret key not configured',
        null,
        { component: 'payments-webhook-route', operation: 'stripeWebhook' }
      );
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const Stripe = await import('stripe').then(m => m.default);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    });

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      logger.error(
        'Invalid Stripe signature',
        new Error(err.message),
        { component: 'payments-webhook-route', operation: 'stripeWebhook', metadata: { errorMessage: err.message } }
      );
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('Stripe webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await paymentService.handlePaymentWebhook(
          paymentIntent.id,
          'succeeded',
          paymentIntent.payment_method_types?.[0]
        );
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        await paymentService.handlePaymentWebhook(
          failedIntent.id,
          'failed'
        );
        break;

      case 'payment_intent.canceled':
        const canceledIntent = event.data.object;
        await paymentService.handlePaymentWebhook(
          canceledIntent.id,
          'cancelled'
        );
        break;

      case 'payment_intent.requires_action':
        const actionIntent = event.data.object;
        await paymentService.handlePaymentWebhook(
          actionIntent.id,
          'requires_action'
        );
        break;

      case 'charge.refunded':
        // Refund webhook handling
        const refund = event.data.object;
        console.log('Refund processed:', refund.id);
        break;

      default:
        console.log('Unhandled Stripe event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error(
      'Stripe webhook error',
      error,
      { component: 'payments-webhook-route', operation: 'stripeWebhook' }
    );
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Disable body parsing, need raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};