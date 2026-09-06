import type { Metadata } from "next";
import {
  PaymentActionLink,
  PaymentResultCard,
  VerifiedBookingSummary,
} from "@/components/payment/PaymentResultCard";
import { CONTACT_EMAIL } from "@/constants/contact";
import { WHATSAPP_URL } from "@/constants/whatsapp";
import {
  getContinueUrl,
  getPaymentPageOutcome,
  getRetryUrl,
  verifyPaymentRecord,
} from "@/lib/paymentVerification";

export const metadata: Metadata = {
  title: "Payment Status",
  description: "View your ICUBE booking payment status.",
};

type Props = {
  searchParams: Promise<{
    booking_id?: string;
    enrollment_id?: string;
    intent_id?: string;
    type?: string;
  }>;
};

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const bookingType = params.type?.trim();

  const record = await verifyPaymentRecord({
    bookingId: params.booking_id,
    enrollmentId: params.enrollment_id,
    intentId: params.intent_id,
  });

  const outcome = getPaymentPageOutcome(record);
  const continueUrl = getContinueUrl(bookingType, record);
  const retryUrl = getRetryUrl(bookingType, record);

  if (outcome === "not_found") {
    return (
      <PaymentResultCard
        icon="?"
        iconWrapClassName="border-white/20 bg-white/5 text-gray-300"
        title="Payment status unavailable"
        actions={
          <>
            <PaymentActionLink href="/">Back to home</PaymentActionLink>
            <PaymentActionLink href={`mailto:${CONTACT_EMAIL}`} variant="secondary">
              Contact support
            </PaymentActionLink>
          </>
        }
      >
        <p>
          We could not find a booking linked to this payment session. If you completed a payment, please
          contact us and we will help confirm your booking.
        </p>
      </PaymentResultCard>
    );
  }

  const summary = record ? (
    <VerifiedBookingSummary
      label={record.label}
      amountAed={record.amountAed}
      bookingDate={record.bookingDate}
      timeSlot={record.timeSlot}
    />
  ) : null;

  if (outcome === "success") {
    return (
      <PaymentResultCard
        icon="✓"
        iconWrapClassName="border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
        title="Payment confirmed"
        actions={<PaymentActionLink href={continueUrl}>Continue</PaymentActionLink>}
      >
        <p>Your payment was received and your booking is confirmed.</p>
        <p className="text-xs text-gray-500">A confirmation email will arrive shortly if you have not received one already.</p>
        {summary}
      </PaymentResultCard>
    );
  }

  if (outcome === "processing") {
    return (
      <PaymentResultCard
        icon="…"
        iconWrapClassName="border-amber-400/50 bg-amber-500/15 text-amber-300"
        title="Payment is being processed"
        actions={
          <>
            <PaymentActionLink href={continueUrl}>Back to site</PaymentActionLink>
            <PaymentActionLink href={`mailto:${CONTACT_EMAIL}`} variant="secondary">
              Contact support
            </PaymentActionLink>
          </>
        }
      >
        <p>Payment is being processed. We will confirm by email shortly.</p>
        <p className="text-xs text-gray-500">This page will update once your payment is fully confirmed in our system.</p>
        {summary}
      </PaymentResultCard>
    );
  }

  return (
    <PaymentResultCard
      icon="✕"
      iconWrapClassName="border-red-400/50 bg-red-500/15 text-red-300"
      title="Payment not completed"
      actions={
        <>
          <PaymentActionLink href={retryUrl}>Try again</PaymentActionLink>
          <PaymentActionLink href={WHATSAPP_URL} variant="secondary" external>
            WhatsApp support
          </PaymentActionLink>
        </>
      }
    >
      <p>Your payment was not completed or this booking was cancelled. No booking has been confirmed.</p>
      {summary}
    </PaymentResultCard>
  );
}
