import Stripe from "stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
      apiVersion: "2025-03-31.basil",
    });
  }
  return _stripe;
}

const FREE_TIER_LIMIT = 2;

export async function canGenerateUpdate(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return false;
  if (user.subscriptionStatus === "active") return true;

  return (user.updatesGenerated ?? 0) < FREE_TIER_LIMIT;
}

export async function incrementUpdateCount(userId: string): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (user) {
    await db
      .update(users)
      .set({ updatesGenerated: (user.updatesGenerated ?? 0) + 1 })
      .where(eq(users.id, userId));
  }
}

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
): Promise<string> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  let customerId = user?.stripeCustomerId;

  if (!customerId) {
    const customer = await getStripe().customers.create({ email: userEmail });
    customerId = customer.id;
    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId));
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?billing=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?billing=cancelled`,
  });

  return session.url ?? "";
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.customer) {
        await db
          .update(users)
          .set({ subscriptionStatus: "active" })
          .where(eq(users.stripeCustomerId, session.customer as string));
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.customer) {
        await db
          .update(users)
          .set({ subscriptionStatus: "cancelled" })
          .where(eq(users.stripeCustomerId, subscription.customer as string));
      }
      break;
    }
  }
}
