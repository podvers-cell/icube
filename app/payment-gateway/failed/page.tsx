import type { Metadata } from "next";
import { PaymentActionLink, PaymentResultCard, VerifiedBookingSummary } from "@/components/payment/PaymentResultCard";
import { CONTACT_EMAIL } from "@/constants/contact";
import { WHATSAPP_URL } from "@/constants/whatsapp";
import { getRetryUrl, verifyPaymentRecord } from "@/lib/paymentVerification";

export const metadata: Metadata = {
  title: "Payment Not Completed",
  description: "Your ICUBE payment was not completed.",
};

type Props = {
  searchParams: Promise<{
    booking_id?: string;
    enrollment_id?: string;
    intent_id?: string;
    type?: string;
  }>;
};

export default async function PaymentFailedPage({ searchParams }: Props) {
  const params = await searchParams;
  const bookingType = params.type?.trim();

  const record = await verifyPaymentRecord({
    bookingId: params.booking_id,
    enrollmentId: params.enrollment_id,
    intentId: params.intent_id,
  });

  const retryUrl = getRetryUrl(bookingType, record);
  const packagesUrl = bookingType === "studio" ? "/#studio" : bookingType === "workshop" ? "/#workshops" : "/packages";

  return (
    <PaymentResultCard
      icon="✕"
      iconWrapClassName="border-red-400/50 bg-red-500/15 text-red-300"
      title="Payment not completed"
      actions={
        <>
          <PaymentActionLink href={packagesUrl}>Back to packages</PaymentActionLink>
          <PaymentActionLink href={retryUrl} variant="secondary">
            Try again
          </PaymentActionLink>
          <PaymentActionLink href={WHATSAPP_URL} variant="secondary" external>
            WhatsApp support
          </PaymentActionLink>
        </>
      }
    >
      <p>Your payment was not completed. No booking has been confirmed.</p>
      <p className="text-xs text-gray-500">
        If you were charged or need help completing your booking, contact us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-icube-gold hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
      {record ? (
        <VerifiedBookingSummary
          label={record.label}
          amountAed={record.amountAed}
          bookingDate={record.bookingDate}
          timeSlot={record.timeSlot}
        />
      ) : null}
    </PaymentResultCard>
  );
}
