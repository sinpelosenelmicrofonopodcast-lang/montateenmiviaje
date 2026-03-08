"use client";

import { useMemo, useState } from "react";
import { RaffleEntryForm } from "@/components/custom/raffle-entry-form";
import { RaffleNumberPicker } from "@/components/custom/raffle-number-picker";
import { PaymentMethodLinks } from "@/components/payment-method-links";
import { PaymentMethodLink } from "@/lib/payment-links";
import { RafflePaymentMethodConfig } from "@/lib/types";

interface RaffleConversionFlowProps {
  raffleId: string;
  isFree: boolean;
  paymentInstructions: string;
  paymentLinks: PaymentMethodLink[];
  paymentMethods: RafflePaymentMethodConfig[];
  paymentNote?: string;
  initialAvailableNumbers: number[];
  prefilledEmail?: string;
  isAuthenticated?: boolean;
}

const preferredOrder = ["paypal", "cashapp", "zelle", "ath_movil", "cash", "other"];

export function RaffleConversionFlow({
  raffleId,
  isFree,
  paymentInstructions,
  paymentLinks,
  paymentMethods,
  paymentNote,
  initialAvailableNumbers,
  prefilledEmail,
  isAuthenticated
}: RaffleConversionFlowProps) {
  const [availableNumbers, setAvailableNumbers] = useState(initialAvailableNumbers);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  const quickPaymentMethods = useMemo(() => {
    if (!paymentLinks.length) return [];
    return [...paymentLinks]
      .sort((a, b) => preferredOrder.indexOf(a.key) - preferredOrder.indexOf(b.key))
      .filter((item, index, list) => list.findIndex((current) => current.key === item.key) === index);
  }, [paymentLinks]);

  return (
    <>
      <RaffleNumberPicker
        availableNumbers={availableNumbers}
        selectedNumbers={selectedNumbers}
        onSelectedNumbersChange={setSelectedNumbers}
      />

      {!isFree && quickPaymentMethods.length > 0 ? (
        <PaymentMethodLinks
          methods={quickPaymentMethods}
          note={paymentNote}
          title="Métodos de pago"
        />
      ) : null}

      <section id="participar" className="card">
        <h3>Confirma tu participación</h3>
        <RaffleEntryForm
          raffleId={raffleId}
          isFree={isFree}
          paymentInstructions={paymentInstructions}
          paymentMethods={paymentMethods}
          paymentLinks={quickPaymentMethods}
          paymentNote={paymentNote}
          initialAvailableNumbers={availableNumbers}
          prefilledEmail={prefilledEmail}
          isAuthenticated={isAuthenticated}
          showNumberSelection={false}
          compact
          selectedNumbers={selectedNumbers}
          onSelectedNumbersChange={setSelectedNumbers}
          onEntriesCreated={(numbers) => {
            setAvailableNumbers((current) => current.filter((value) => !numbers.includes(value)));
          }}
        />
      </section>
    </>
  );
}
