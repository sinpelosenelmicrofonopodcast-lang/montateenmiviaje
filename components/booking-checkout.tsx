"use client";

import { useMemo, useState } from "react";
import { PaypalButton } from "@/components/paypal-button";
import { Trip } from "@/lib/types";
import { formatMoney } from "@/lib/format";

interface BookingCheckoutProps {
  trip: Trip;
}

export function BookingCheckout({ trip }: BookingCheckoutProps) {
  const defaultPackage = trip.packages[0];
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [roomType, setRoomType] = useState(defaultPackage.roomType);
  const [travelers, setTravelers] = useState(1);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paidOrderId, setPaidOrderId] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const selectedPackage = useMemo(
    () => trip.packages.find((pkg) => pkg.roomType === roomType) ?? defaultPackage,
    [defaultPackage, roomType, trip.packages]
  );

  const total = selectedPackage.pricePerPerson * travelers;
  const deposit = selectedPackage.deposit * travelers;

  async function handleCreateBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPaidOrderId(null);

    if (!customerName.trim() || !customerEmail.trim()) {
      setError("Completa nombre y correo para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          tripSlug: trip.slug,
          roomType,
          travelers,
          amount: deposit
        })
      });

      const payload = (await response.json()) as {
        bookingId?: string;
        amount?: number;
        totalAmount?: number;
        balanceAmount?: number;
        message?: string;
      };

      if (!response.ok || !payload.bookingId || !payload.amount) {
        throw new Error(payload.message ?? "No se pudo crear la reserva.");
      }

      setBookingId(payload.bookingId);
      setCheckoutAmount(payload.amount);
      setTotalAmount(payload.totalAmount ?? total);
      setBalanceAmount(payload.balanceAmount ?? Math.max(total - deposit, 0));
    } catch (bookingError) {
      const message = bookingError instanceof Error ? bookingError.message : "Error inesperado";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="booking-shell">
      <section className="card">
        <h2>Reserva tu cupo</h2>
        <p className="muted">
          Para confirmar el viaje se procesa un depósito con PayPal. El saldo restante se gestiona en
          dashboard.
        </p>

        <form onSubmit={handleCreateBooking}>
          <label>
            Nombre completo
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
          </label>
          <label>
            Correo electrónico
            <input
              type="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Tipo de habitación
            <select value={roomType} onChange={(event) => setRoomType(event.target.value as typeof roomType)}>
              {trip.packages.map((pkg) => (
                <option key={pkg.roomType} value={pkg.roomType}>
                  {pkg.roomType} - {formatMoney(pkg.pricePerPerson)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Número de viajeros
            <input
              type="number"
              min={1}
              max={4}
              value={travelers}
              onChange={(event) => setTravelers(Number(event.target.value) || 1)}
            />
          </label>
          <label>
            Código de descuento
            <input
              value={discountCode}
              onChange={(event) => setDiscountCode(event.target.value)}
              placeholder="Opcional"
            />
          </label>
          <label>
            Código referido
            <input
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value)}
              placeholder="Opcional"
            />
          </label>
          <button className="button-dark" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Generando reserva..." : "Continuar al pago PayPal"}
          </button>
        </form>

        {error ? <p className="error">{error}</p> : null}
        {bookingId ? (
          <PaypalButton bookingId={bookingId} amount={checkoutAmount} onPaid={(orderId) => setPaidOrderId(orderId)} />
        ) : null}
        {paidOrderId ? <p className="success">Pago confirmado. Orden PayPal: {paidOrderId}</p> : null}
      </section>

      <aside className="card">
        <h3>Resumen</h3>
        <p>
          <strong>Viaje:</strong> {trip.title}
        </p>
        <p>
          <strong>Destino:</strong> {trip.destination}
        </p>
        <p>
          <strong>Tarifa por persona:</strong> {formatMoney(selectedPackage.pricePerPerson)}
        </p>
        <p>
          <strong>Total viaje:</strong> {formatMoney(total)}
        </p>
        <p>
          <strong>Depósito hoy:</strong> {formatMoney(deposit)}
        </p>
        {bookingId ? (
          <p>
            <strong>Balance restante:</strong> {formatMoney(balanceAmount)}
          </p>
        ) : null}
        {bookingId ? (
          <p>
            <strong>Total de la reserva:</strong> {formatMoney(totalAmount)}
          </p>
        ) : null}
        <p className="muted">Plan: {selectedPackage.paymentPlan}</p>
      </aside>
    </div>
  );
}
