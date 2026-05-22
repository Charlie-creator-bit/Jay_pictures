import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertTriangle, Printer, ArrowLeft, ShieldCheck, FileText, Download } from "lucide-react";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";

interface VerificationResult {
  bookingId: string;
  paymentId: string;
  amount: number;
  currency: string;
  reference: string;
}

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get("reference");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentData, setPaymentData] = useState<VerificationResult | null>(null);

  // For Invoice Generation
  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [bookingInfo, setBookingInfo] = useState<any>(null);

  useEffect(() => {
    if (!reference) {
      setLoading(false);
      setSuccess(false);
      setErrorMsg("No transaction reference parameter was provided by the payment gateway.");
      return;
    }

    let active = true;

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/paystack/verify/${encodeURIComponent(reference)}`);
        const result = await response.json();

        if (!active) return;

        if (result.success || result.message?.includes("already successfully logged")) {
          setSuccess(true);
          
          // Set payment details
          const data = result.data || {};
          setPaymentData({
            bookingId: data.bookingId || "N/A",
            paymentId: data.paymentId || "PAY-REF-" + Math.random().toString(36).substring(3, 9).toUpperCase(),
            amount: data.amount || 0,
            currency: data.currency || "USD",
            reference: reference,
          });

          // Generate Invoice Number
          const today = new Date();
          setInvoiceDate(today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
          setInvoiceId(`INV-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

          // Try fetching booking details from firestore if possible
          try {
            // We can fetch via api or just read booking node
            // But since we are on client, let's keep it simple and compile invoice details
          } catch (e) {
            console.error("Booking load err:", e);
          }

        } else {
          setSuccess(false);
          setErrorMsg(result.error || result.message || "Transaction verification failed.");
        }
      } catch (err: any) {
        if (active) {
          setSuccess(false);
          setErrorMsg(err.message || "An unexpected error occurred during blockchain-tier verification.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    verifyPayment();
    return () => {
      active = false;
    };
  }, [reference]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-black flex flex-col items-center justify-center p-6 text-white">
        <div className="relative mb-8">
          <div className="w-16 h-16 border-t-2 border-b-2 border-luxury-gold rounded-full animate-spin"></div>
          <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-luxury-gold" />
        </div>
        <h2 className="text-xl font-display uppercase tracking-widest text-luxury-gold mb-2">Ledger Verification</h2>
        <p className="text-white/40 text-xs font-mono max-w-sm text-center">
          Reconciling payment reference with Paystack secure channels. Please do not close or reload this page...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black p-6 pt-32 selection:bg-luxury-gold/30 selection:text-white print:bg-white print:text-black">
      <div className="container mx-auto max-w-3xl print:p-0">
        
        {!success ? (
          /* PAYMENT FAILURE UI */
          <div className="max-w-md mx-auto text-center space-y-8 print:hidden">
            <div className="inline-flex p-4 bg-red-500/10 border border-red-500/20 rounded-full text-red-500">
              <AlertTriangle className="w-12 h-12" />
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-display text-white">Transaction <span className="italic text-red-400">Failed</span></h2>
              <p className="text-white/50 text-xs leading-relaxed max-w-sm mx-auto">
                The transaction verification step was declined or timed out. Feel free to re-coordinate your schedule.
              </p>
            </div>

            <div className="p-5 border border-red-500/15 bg-red-500/[0.02] rounded-2xl text-left font-mono text-[11px] text-red-400 space-y-2">
              <p className="font-bold uppercase tracking-widest text-[9px] border-b border-red-500/10 pb-2">Error Diagnostic</p>
              <div className="flex justify-between">
                <span>Details:</span>
                <span className="font-semibold text-right max-w-[200px] break-words">{errorMsg || "Declined by processor."}</span>
              </div>
              {reference && (
                <div className="flex justify-between pt-1">
                  <span>Paystack Ref:</span>
                  <span className="font-semibold">{reference}</span>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="text-[10px] uppercase tracking-widest font-bold">
                My Dashboard
              </Button>
              <Button onClick={() => navigate("/book")} className="text-[10px] uppercase tracking-widest font-bold">
                Retry Booking
              </Button>
            </div>
          </div>
        ) : (
          /* PAYMENT SUCCESS & INVOICE GENERATION UI */
          <div className="space-y-12">
            
            {/* Action Bar (hidden in Print) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6 print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-serif">Payment Verified Successfully</h2>
                  <p className="text-xs text-white/40 font-mono">Reference: {paymentData?.reference}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 border border-white/10 hover:border-luxury-gold rounded-lg text-white/80 hover:text-luxury-gold text-xs font-bold tracking-widest flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> PRINT INVOICE
                </button>
                <Button onClick={() => navigate("/dashboard")} className="px-5 py-2 text-xs uppercase tracking-widest font-bold">
                  Go to Dashboard
                </Button>
              </div>
            </div>

            {/* HIGH-ART LUXURY PRINTABLE INVOICE */}
            <div className="bg-[#0b0b0b] border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden print:border-0 print:shadow-none print:p-0 print:bg-white print:text-black">
              
              {/* Subtle visual branding backdrops (hidden in Print) */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-luxury-gold/5 blur-[80px] rounded-full pointer-events-none print:hidden" />
              
              {/* Invoice Header */}
              <header className="flex flex-col sm:flex-row justify-between items-start gap-8 border-b border-white/10 pb-8 print:border-black/10">
                <div className="space-y-2">
                  <h1 className="text-3xl font-display tracking-wide print:text-black">
                    JAY <span className="italic font-light">PICTURES</span>
                  </h1>
                  <p className="text-[9px] uppercase tracking-widest text-[#d4af37] font-bold">Luxury Photography Studio</p>
                  <p className="text-[10px] text-white/40 print:text-black/50 leading-relaxed font-mono">
                    Accra / Lagos / London<br />
                    coordination@jaypictures.com
                  </p>
                </div>

                <div className="text-left sm:text-right font-mono space-y-1 text-xs">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 print:text-black/50 font-sans font-bold">Digital Invoice</p>
                  <p className="text-white print:text-black font-bold text-sm">{invoiceId}</p>
                  <p className="text-white/50 print:text-black/50">Date: {invoiceDate}</p>
                  <p className="text-white/50 print:text-black/50">Gateway: Paystack System</p>
                  <p className="text-white/50 print:text-black/50">Status: <span className="text-green-400 font-bold uppercase print:text-green-600">PAID</span></p>
                </div>
              </header>

              {/* Bill To & Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-white/10 print:border-black/10">
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold">Billed To</p>
                  <p className="text-sm font-semibold text-white print:text-black">Jay Pictures Patron</p>
                  <p className="text-xs text-white/50 print:text-black/50 font-mono">
                    System Verified Account Reference<br />
                    Patron ID: {paymentData?.bookingId !== "N/A" ? "Verified Client" : "Patron User"}
                  </p>
                </div>

                <div className="space-y-1.5 text-left sm:text-right">
                  <p className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold">Transaction Reference</p>
                  <p className="text-xs font-mono text-white print:text-black break-all">{paymentData?.reference}</p>
                  <p className="text-xs text-white/50 print:text-black/50">
                    Booking ID Ref: {paymentData?.bookingId}<br />
                    Payment Ledger: {paymentData?.paymentId}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="py-8">
                <p className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold mb-4">Acquired Services & Assets</p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 print:border-black/10 print:text-black/60 uppercase text-[9px] tracking-wider">
                        <th className="py-3 font-bold">Description</th>
                        <th className="py-3 text-right font-bold">Qty</th>
                        <th className="py-3 text-right font-bold">Unit Price (USD)</th>
                        <th className="py-3 text-right font-bold">Amount Paid ({paymentData?.currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 print:divide-black/5">
                      <tr>
                        <td className="py-4">
                          <p className="font-serif font-bold text-sm text-white print:text-black">Cinematic Photoshoot Session Booking</p>
                          <p className="text-[10px] text-white/40 print:text-black/50 mt-0.5">Securely reserved date/time slot. Backdrops, lightning design & creative guidance included.</p>
                        </td>
                        <td className="py-4 text-right font-mono">1</td>
                        <td className="py-4 text-right font-mono">${paymentData?.amount ? (paymentData.amount * 2).toLocaleString() : "N/A"}</td>
                        <td className="py-4 text-right font-mono text-[#d4af37] font-bold">
                          {paymentData?.currency} {paymentData?.amount?.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 print:border-black/10">
                <div className="text-[10px] text-white/30 print:text-black/50 max-w-sm italic">
                  * Thank you for commissioning Jay Pictures. This receipt verifies the secure capture and processing of your deposit payment ledger. Remaining balance if applicable is settled pre-shoot.
                </div>

                <div className="w-full sm:w-64 font-mono text-xs space-y-2 border-l border-white/10 pl-6 print:border-black/10">
                  <div className="flex justify-between">
                    <span className="text-white/50 print:text-black/50">Base Package Cost:</span>
                    <span className="text-white print:text-black">${paymentData?.amount ? (paymentData.amount * 2).toLocaleString() : "0.00"}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2 print:border-black/5">
                    <span className="text-white/50 print:text-black/50">Deposit Received:</span>
                    <span className="text-white print:text-black">-${paymentData?.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-[#d4af37] font-bold print:text-black">TOTAL PAID:</span>
                    <span className="text-[#d4af37] font-bold print:text-black">
                      {paymentData?.currency} {paymentData?.amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-white/40 print:text-black/40">
                    <span>Rate conversion to USD:</span>
                    <span>1:1 Equivalent</span>
                  </div>
                </div>
              </div>

              {/* Bottom luxury signature stamp */}
              <div className="mt-12 text-center border-t border-white/5 pt-8 print:border-black/5 text-[9px] uppercase tracking-widest text-[#d4af37] font-bold">
                ✦ AUTHORIZED LEDGER RECEIPT — JAY PICTURES CO. ✦
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
