import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

function getStripeClient(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }
  
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }
  
  stripeInstance = new Stripe(secretKey, {
    apiVersion: '2023-10-16',
  });
  return stripeInstance;
}

export async function createCheckoutSession(
  tripId: string,
  tripName: string,
  priceInCents: number = 4900,
  successUrl: string,
  cancelUrl: string
) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Group Trip: ${tripName}`,
            description: 'One-time payment for group trip planning',
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tripId,
    },
  });

  return session;
}

export async function retrieveCheckoutSession(sessionId: string) {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId);
}
