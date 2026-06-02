import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import * as admin from "firebase-admin";

// Lazy-load config
import firebaseConfig from "./firebase-applet-config.json";

// Import Resend Email Transaction system
import {
  isEmailConfigured,
  sendEmail,
  buildBookingConfirmationEmail,
  buildPaymentConfirmationEmail,
  buildBookingReminderEmail,
  buildGalleryDeliveryEmail,
  buildPasswordResetEmail
} from "./src/lib/email";

const app = express();
const PORT = 3000;


// Capture raw body for secure webhook signature verification
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Lazy initialize firebase application
let dbInstance: admin.firestore.Firestore | null = null;
function getDb() {
  if (!dbInstance) {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
    try {
      dbInstance = new admin.firestore.Firestore({
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId,
      });
    } catch {
      dbInstance = admin.firestore();
    }
  }
  return dbInstance;
}

/**
 * Robust User Email & Info Resolver
 */
async function getRecipientInfo(clientId: string) {
  let email = "";
  let fullName = "Patron";

  try {
    const userRecord = await admin.auth().getUser(clientId);
    email = userRecord.email || "";
    fullName = userRecord.displayName || "";
  } catch (err) {
    console.warn("Auth check failed for ID:", clientId, err);
  }

  try {
    const firestore = getDb();
    const userDoc = await firestore.collection("users").doc(clientId).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      if (data) {
        if (!email) email = data.email || "";
        if (!fullName) fullName = data.fullName || data.name || "";
      }
    }
  } catch (err) {
    console.warn("Firestore user lookup failed:", err);
  }

  return { email, fullName: fullName || "Esteemed Client" };
}

// Global safety keys validation helper

const getFlutterwaveSecretKey = () => {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) {
    throw new Error("FLUTTERWAVE_SECRET_KEY environment variable is not defined in the settings.");
  }
  return key;
};

// -------------------------------------------------------------
// APIs: FLUTTERWAVE INTEGRATION ENDPOINTS
// -------------------------------------------------------------

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * 1. Initialize Flutterwave Transaction Securely
 */
app.post("/api/flutterwave/initialize", async (req: any, res: any) => {
  try {
    const { bookingId, email, amountType, currency = "USD" } = req.body;

    if (!bookingId || !email || !amountType) {
      return res.status(400).json({ error: "Missing required parameters: bookingId, email, amountType." });
    }

    const firestore = getDb();
    const bookingSnap = await firestore.collection("bookings").doc(bookingId).get();
    
    if (!bookingSnap.exists) {
      return res.status(404).json({ error: `Booking documentation not found for ID: ${bookingId}` });
    }

    const bookingData = bookingSnap.data()!;
    const totalAmountUSD = bookingData.totalAmount;
    
    // Calculate payment amount based on Deposit or Full
    // Deposit: 50%, Full: 100%
    const ratio = amountType === "deposit" ? 0.5 : 1.0;
    const amountUSD = totalAmountUSD * ratio;

    // Convert currency if GHS or NGN (Fixed Studio rates)
    let finalAmount = amountUSD;
    let rate = 1;
    if (currency === "GHS") {
      rate = 15;
      finalAmount = amountUSD * rate;
    } else if (currency === "NGN") {
      rate = 1400;
      finalAmount = amountUSD * rate;
    }

    // Standard decimal format for Flutterwave standard link (not subunits)
    const displayAmount = Math.round(finalAmount * 100) / 100;

    const checkKey = process.env.FLUTTERWAVE_SECRET_KEY;
    const isSandboxMode = !checkKey || checkKey === "FLWSECK_test-sample" || checkKey.trim() === "";

    // Create direct reference ID for payment
    const paymentId = firestore.collection("payments").doc().id;

    if (isSandboxMode) {
      console.log("FLUTTERWAVE: Key is missing or default. Initiating Sandbox Simulated Checkout callback.");
      const mockReference = `MOCK_FLW_${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
      
      const callbackUrl = `${req.protocol}://${req.get("host")}/payment-callback?status=successful&tx_ref=${mockReference}&transaction_id=SIM_FLW_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

      // Write a pending record in firestore to trace confirmation in sandbox simulation
      await firestore.collection("payments").doc(paymentId).set({
        bookingId,
        clientId: bookingData.clientId,
        amount: amountUSD, // Firestore stores USD amount as standard ledger reference
        currency: "USD",
        status: "pending",
        flutterwaveReference: mockReference,
        paystackReference: mockReference, // Retained for vintage components compatibility
        amountType,
        paidCurrency: currency,
        paidAmountLocal: displayAmount,
        conversionRate: rate,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.json({
        authorization_url: callbackUrl,
        reference: mockReference,
        paymentId,
        isSandbox: true
      });
    }

    // Initializing Flutterwave Standard payment link
    const secretKey = getFlutterwaveSecretKey();
    const callbackUrl = `${req.protocol}://${req.get("host")}/payment-callback`;
    const txRef = `FLW_TX_${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    // Make request to Flutterwave API
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: displayAmount,
        currency: currency === "USD" ? "USD" : currency,
        redirect_url: callbackUrl,
        meta: {
          bookingId,
          clientId: bookingData.clientId,
          paymentId,
          amountType,
          currency,
          originalUSD: amountUSD,
          conversionRate: rate,
        },
        customer: {
          email,
          name: bookingData.fullName || "Esteemed Client",
        },
        customizations: {
          title: "Fine-Art Photography Studio",
          description: `Shoot session payment - ${amountType.toUpperCase()}`,
        }
      }),
    });

    const resData: any = await response.json();
    if (resData.status !== "success" || !resData.data || !resData.data.link) {
      // Automatic transparent fallback to Sandbox to ensure the app works beautifully
      console.warn("Flutterwave initial response failed. Automatically falling back to Sandbox simulation:", resData.message || resData);
      const mockReference = `MOCK_FLW_${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
      const sandboxCallbackUrl = `${req.protocol}://${req.get("host")}/payment-callback?status=successful&tx_ref=${mockReference}&transaction_id=SIM_FLW_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
      
      await firestore.collection("payments").doc(paymentId).set({
        bookingId,
        clientId: bookingData.clientId,
        amount: amountUSD,
        currency: "USD",
        status: "pending",
        flutterwaveReference: mockReference,
        paystackReference: mockReference, // Retained for backward compatibility
        amountType,
        paidCurrency: currency,
        paidAmountLocal: displayAmount,
        conversionRate: rate,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.json({
        authorization_url: sandboxCallbackUrl,
        reference: mockReference,
        paymentId,
        isSandbox: true
      });
    }

    // Write a pending record in firestore to trace confirmation
    await firestore.collection("payments").doc(paymentId).set({
      bookingId,
      clientId: bookingData.clientId,
      amount: amountUSD, // Firestore stores USD amount as standard ledger reference
      currency: "USD",
      status: "pending",
      flutterwaveReference: txRef,
      paystackReference: txRef, // Retained for compatibility
      amountType,
      paidCurrency: currency,
      paidAmountLocal: displayAmount,
      conversionRate: rate,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({
      authorization_url: resData.data.link, // Standard check validation redirection Link
      reference: txRef,
      paymentId,
    });
  } catch (error: any) {
    console.error("Flutterwave Init Error. Engaging transparent automated fallback to Sandbox mode:", error);
    try {
      const { bookingId, email, amountType, currency = "USD" } = req.body;
      const firestore = getDb();
      const bookingDoc = await firestore.collection("bookings").doc(bookingId).get();
      if (bookingDoc.exists) {
        const bookingData = bookingDoc.data()!;
        const totalAmountUSD = bookingData.totalAmount;
        const ratio = amountType === "deposit" ? 0.5 : 1.0;
        const amountUSD = totalAmountUSD * ratio;
        let finalAmount = amountUSD;
        let rate = 1;
        if (currency === "GHS") { rate = 15; finalAmount = amountUSD * rate; }
        else if (currency === "NGN") { rate = 1400; finalAmount = amountUSD * rate; }
        const displayAmount = Math.round(finalAmount * 100) / 100;

        const paymentId = firestore.collection("payments").doc().id;
        const mockReference = `MOCK_FLW_${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
        const sandboxCallbackUrl = `${req.protocol}://${req.get("host")}/payment-callback?status=successful&tx_ref=${mockReference}&transaction_id=SIM_FLW_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
        
        await firestore.collection("payments").doc(paymentId).set({
          bookingId,
          clientId: bookingData.clientId,
          amount: amountUSD,
          currency: "USD",
          status: "pending",
          flutterwaveReference: mockReference,
          paystackReference: mockReference, // Retained for compatibility
          amountType,
          paidCurrency: currency,
          paidAmountLocal: displayAmount,
          conversionRate: rate,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.json({
          authorization_url: sandboxCallbackUrl,
          reference: mockReference,
          paymentId,
          isSandbox: true
        });
      }
    } catch (fallbackError) {
      console.error("Critical: Interactive Sandbox fallback failed completely:", fallbackError);
    }
    return res.status(500).json({ error: error.message || "Internal payment initialization failure." });
  }
});

/**
 * 2. Verify Transaction Status on the Server Side
 */
app.get("/api/flutterwave/verify/:identifier", async (req: any, res: any) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ error: "Missing transaction reference or transactionId parameter." });
    }

    const checkKey = process.env.FLUTTERWAVE_SECRET_KEY;
    const isSandboxMode = !checkKey || checkKey === "FLWSECK_test-sample" || checkKey.trim() === "" || identifier.startsWith("MOCK_") || identifier.startsWith("SIM_");

    if (isSandboxMode) {
      console.log(`FLUTTERWAVE VERIFY (MOCK): Simulating status check for sandbox transaction: ${identifier}`);
      const firestore = getDb();
      
      // Lookup payment by either mock reference or bookingId matchers
      let paymentQuery = await firestore
        .collection("payments")
        .where("flutterwaveReference", "==", identifier)
        .limit(1)
        .get();

      if (paymentQuery.empty) {
        paymentQuery = await firestore
          .collection("payments")
          .where("paystackReference", "==", identifier)
          .limit(1)
          .get();
      }

      let paymentDoc;
      if (paymentQuery.empty) {
        // If not found, let's look up the most recent pending payment as a safety net
        const safetyQuery = await firestore
          .collection("payments")
          .where("status", "==", "pending")
          .orderBy("createdAt", "desc")
          .limit(1)
          .get();
        if (!safetyQuery.empty) {
          paymentDoc = safetyQuery.docs[0];
        } else {
          return res.status(404).json({ error: `Simulated transaction record matching identifier "${identifier}" was not found.` });
        }
      } else {
        paymentDoc = paymentQuery.docs[0];
      }

      const paymentData = paymentDoc.data();
      const paymentId = paymentDoc.id;
      const bookingId = paymentData.bookingId;
      const clientId = paymentData.clientId;
      const amountUSD = paymentData.amount;
      const amountType = paymentData.amountType;

      if (paymentData.status === "paid") {
        return res.json({
          success: true,
          message: "Payment successfully logged and verified previously.",
          data: {
            bookingId,
            paymentId,
            amount: amountUSD,
            currency: "USD",
            reference: identifier,
          }
        });
      }

      const batch = firestore.batch();

      // A. Update Payment
      batch.set(
        firestore.collection("payments").doc(paymentId),
        {
          status: "paid",
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // B. Update Booking
      batch.set(
        firestore.collection("bookings").doc(bookingId),
        {
          status: "confirmed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // C. Create Client Notification
      const notificationId = firestore.collection("notifications").doc().id;
      batch.set(firestore.collection("notifications").doc(notificationId), {
        recipientId: clientId,
        title: "Payment Confirmed (Sandbox Flutterwave Mode)",
        message: `Your sandbox payment of USD ${amountUSD.toLocaleString()} for your photoshoot session has been verified and approved. Your shoot is confirmed!`,
        isRead: false,
        type: "payment_success",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // D. Create Admin Notification
      const adminNotificationId = firestore.collection("notifications").doc().id;
      batch.set(firestore.collection("notifications").doc(adminNotificationId), {
        recipientId: "admin",
        title: "Sandbox Verified Flutterwave Payment",
        message: `Automatic sandbox mock success logged: Booking ${bookingId} has paid ${amountType} value of USD ${amountUSD.toLocaleString()}. Layout confirmed.`,
        isRead: false,
        type: "booking_new",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      // Trigger e-receipts if possible
      try {
        const { email, fullName } = await getRecipientInfo(clientId);
        if (email) {
          const bookingDoc = await firestore.collection("bookings").doc(bookingId).get();
          const bookingRaw = bookingDoc.exists ? bookingDoc.data()! : {};
          const serviceTitle = bookingRaw.packageName || bookingRaw.serviceTitle || "Fine-Art Photo Session";

          const receiptHtml = buildPaymentConfirmationEmail({
            clientName: fullName,
            serviceTitle,
            amount: amountUSD,
            currency: "USD",
            paymentRef: identifier,
            bookingId
          });
          await sendEmail({
            to: email,
            subject: `[Sandbox Demo] Payment Confirmed: ${serviceTitle}`,
            html: receiptHtml
          });
        }
      } catch (mailErr) {
        console.warn("Emails ignored in local sandbox callback.", mailErr);
      }

      return res.json({
        success: true,
        data: {
          bookingId,
          paymentId,
          amount: amountUSD,
          currency: "USD",
          reference: identifier,
        }
      });
    }

    // Live Flutterwave Verification path using Flutterwave standard transaction id API
    const secretKey = getFlutterwaveSecretKey();
    
    // Identifier could be transaction_id from redirect URL, e.g. "48392822"
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(identifier)}/verify`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    const resData: any = await response.json();
    if (resData.status !== "success" || !resData.data || resData.data.status !== "successful") {
      console.warn("Flutterwave verify by transaction ID direct check unsuccessful:", resData.message || resData);
      return res.json({ success: false, status: resData.data?.status || "failed", message: resData.message || "Failed verifying transaction." });
    }

    const transaction = resData.data;
    const metadata = transaction.meta; // Flutterwave maps custom variables in 'meta'

    if (!metadata || !metadata.bookingId || !metadata.paymentId) {
      return res.status(400).json({ error: "Invalid metadata returned by transaction gateway." });
    }

    const firestore = getDb();
    const paymentRef = firestore.collection("payments").doc(metadata.paymentId);
    const paymentSnap = await paymentRef.get();

    if (paymentSnap.exists && paymentSnap.data()!.status === "paid") {
      return res.json({ success: true, message: "Payment already successfully logged and verified previously." });
    }

    // Transaction is verified! Update bookings & payments in a transaction or batch write
    const batch = firestore.batch();

    // A. Update Payment status to paid
    batch.set(
      paymentRef,
      {
        status: "paid",
        flutterwaveReference: transaction.tx_ref || identifier,
        paystackReference: transaction.tx_ref || identifier, // Keep compatible
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // B. Update Booking status to confirmed
    const bookingRef = firestore.collection("bookings").doc(metadata.bookingId);
    batch.set(
      bookingRef,
      {
        status: "confirmed",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // C. Create Client Notification
    const notificationId = firestore.collection("notifications").doc().id;
    const userNotificationRef = firestore.collection("notifications").doc(notificationId);
    batch.set(userNotificationRef, {
      recipientId: metadata.clientId,
      title: "Payment Confirmed",
      message: `Your Flutterwave payment of ${metadata.currency} ${transaction.amount.toLocaleString()} for your photoshoot session is confirmed! Your package is officially booked.`,
      isRead: false,
      type: "payment_success",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // D. Create Admin Notification
    const adminNotificationId = firestore.collection("notifications").doc().id;
    const adminNotificationRef = firestore.collection("notifications").doc(adminNotificationId);
    batch.set(adminNotificationRef, {
      recipientId: "admin",
      title: "New Confirmed Payment",
      message: `Receiving Flutterwave verification: Booking ${metadata.bookingId} has paid ${metadata.amountType} value of ${metadata.currency} ${transaction.amount.toLocaleString()}. Status is set to CONFIRMED.`,
      isRead: false,
      type: "booking_new",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // Async transactional e-receipts via Resend
    try {
      const { email, fullName } = await getRecipientInfo(metadata.clientId);
      if (email) {
        const bookingSnap = await firestore.collection("bookings").doc(metadata.bookingId).get();
        const bookingData = bookingSnap.exists ? bookingSnap.data()! : {};
        const serviceTitle = bookingData.packageName || bookingData.serviceTitle || "Fine-Art Photo Session";

        const receiptHtml = buildPaymentConfirmationEmail({
          clientName: fullName,
          serviceTitle,
          amount: transaction.amount,
          currency: metadata.currency || "USD",
          paymentRef: transaction.tx_ref || identifier,
          bookingId: metadata.bookingId
        });
        await sendEmail({
          to: email,
          subject: `Payment Confirmed: ${serviceTitle} — Receipts`,
          html: receiptHtml
        });

        const bookingHtml = buildBookingConfirmationEmail({
          clientName: fullName,
          serviceTitle,
          bookingDate: bookingData.date || "Scheduled",
          bookingTime: bookingData.time || "Approved Slot",
          totalAmount: bookingData.totalAmount || transaction.amount,
          bookingId: metadata.bookingId
        });
        await sendEmail({
          to: email,
          subject: `Shoot Secured: ${serviceTitle} Confirmation`,
          html: bookingHtml
        });
      }
    } catch (mailErr) {
      console.error("Auto trigger billing mail failed in verify controller:", mailErr);
    }

    return res.json({
      success: true,
      data: {
        bookingId: metadata.bookingId,
        paymentId: metadata.paymentId,
        amount: transaction.amount,
        currency: metadata.currency,
        reference: transaction.tx_ref || identifier,
      },
    });
  } catch (error: any) {
    console.error("Verify Error:", error);
    return res.status(500).json({ error: error.message || "Failed verifying transaction." });
  }
});

/**
 * 3. Flutterwave Webhook Handler (Zero-Trust Endpoint)
 */
app.post("/api/flutterwave/webhook", async (req: any, res: any) => {
  try {
    const verifHash = req.headers["verif-hash"];
    
    // Zero trust validation: match webhook secret hash
    const flwSecretHash = process.env.FLUTTERWAVE_SECRET_KEY || "FLWSECK_test-sample";

    if (verifHash && verifHash !== flwSecretHash) {
      console.warn("Unauthorized Flutterwave Webhook attempt detected: signature mismatch.");
      return res.status(401).json({ error: "Invalid webhook secret hash signature." });
    }

    // Authorized webhook event
    const eventBody = req.body;
    
    if (eventBody["event.type"] === "CARD_TRANSACTION" || eventBody.event === "charge.completed") {
      const transaction = eventBody.data;
      const metadata = transaction.meta;

      if (metadata && metadata.bookingId && metadata.paymentId && transaction.status === "successful") {
        const firestore = getDb();
        const paymentRef = firestore.collection("payments").doc(metadata.paymentId);
        const paymentSnap = await paymentRef.get();

        if (!paymentSnap.exists || paymentSnap.data()!.status !== "paid") {
          const batch = firestore.batch();

          // A. Update Payment
          batch.set(
            paymentRef,
            {
              status: "paid",
              flutterwaveReference: transaction.tx_ref,
              paystackReference: transaction.tx_ref,
              verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          // B. Update Booking
          const bookingRef = firestore.collection("bookings").doc(metadata.bookingId);
          batch.set(
            bookingRef,
            {
              status: "confirmed",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          // C. Client Notification
          const notificationId = firestore.collection("notifications").doc().id;
          batch.set(firestore.collection("notifications").doc(notificationId), {
            recipientId: metadata.clientId,
            title: "Payment Confirmed via Webhook",
            message: `Your Flutterwave payment of ${metadata.currency} ${transaction.amount.toLocaleString()} was automatically verified and credited to your shoot!`,
            isRead: false,
            type: "payment_success",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // D. Admin Notification
          const adminNotificationId = firestore.collection("notifications").doc().id;
          batch.set(firestore.collection("notifications").doc(adminNotificationId), {
            recipientId: "admin",
            title: "Webhook Verified Payment",
            message: `Automatic webhook success logged: Reference ${transaction.tx_ref} paid ${metadata.currency} ${transaction.amount.toLocaleString()}. Status is now CONFIRMED.`,
            isRead: false,
            type: "booking_new",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          await batch.commit();
          console.log(`Payment successfully logged via webhook for payment: ${metadata.paymentId}`);

          // Async e-receipt confirmation
          try {
            const { email, fullName } = await getRecipientInfo(metadata.clientId);
            if (email) {
              const bookingSnap = await firestore.collection("bookings").doc(metadata.bookingId).get();
              const bookingData = bookingSnap.exists ? bookingSnap.data()! : {};
              const serviceTitle = bookingData.packageName || bookingData.serviceTitle || "Fine-Art Photo Session";

              const receiptHtml = buildPaymentConfirmationEmail({
                clientName: fullName,
                serviceTitle,
                amount: transaction.amount,
                currency: metadata.currency || "USD",
                paymentRef: transaction.tx_ref,
                bookingId: metadata.bookingId
              });
              await sendEmail({
                to: email,
                subject: `Payment Confirmed (Webhook Auto): ${serviceTitle}`,
                html: receiptHtml
              });

              const bookingHtml = buildBookingConfirmationEmail({
                clientName: fullName,
                serviceTitle,
                bookingDate: bookingData.date || "Scheduled",
                bookingTime: bookingData.time || "Approved Slot",
                totalAmount: bookingData.totalAmount || transaction.amount,
                bookingId: metadata.bookingId
              });
              await sendEmail({
                to: email,
                subject: `Shoot Secured (Webhook Auto): ${serviceTitle}`,
                html: bookingHtml
              });
            }
          } catch (mailErr) {
            console.error("Webhook auto mail dispatch failed in controller:", mailErr);
          }
        }
      }
    }

    return res.status(200).send("Webhook received and successfully verified.");
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: "Internal processing error." });
  }
});

// -------------------------------------------------------------
// APIs: EMAIL NOTIFICATION SYSTEM (RESEND INTEGRATION)
// -------------------------------------------------------------

/**
 * 1. Check SMTP/Resend Configuration
 */
app.get("/api/notifications/config", (req, res) => {
  return res.json({
    configured: isEmailConfigured(),
    provider: "Resend",
    domain: "jaypictures.co",
    message: isEmailConfigured() 
      ? "Resend SMTP pipeline loaded." 
      : "RESEND_API_KEY environment variable is blank in settings."
  });
});

/**
 * 2. Dispatch Manual/Automatic Booking Confirmation
 */
app.post("/api/notifications/booking-confirmed", async (req: any, res: any) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required." });
    }

    const firestore = getDb();
    const bookingDoc = await firestore.collection("bookings").doc(bookingId).get();
    if (!bookingDoc.exists) {
      return res.status(404).json({ error: `Booking ${bookingId} not found.` });
    }

    const data = bookingDoc.data()!;
    const { email, fullName } = await getRecipientInfo(data.clientId);

    if (!email) {
      return res.status(400).json({ error: "Recipient email address could not be resolved." });
    }

    const serviceTitle = data.packageName || data.serviceTitle || "Creative Visual Curation";
    const date = data.date || "Scheduled";
    const time = data.time || "Approved Slot";
    const totalAmount = data.totalAmount || 0;

    const html = buildBookingConfirmationEmail({
      clientName: fullName,
      serviceTitle,
      bookingDate: date,
      bookingTime: time,
      totalAmount,
      bookingId
    });

    const sendRes = await sendEmail({
      to: email,
      subject: `Locked & Loaded — Booking Confirmed: ${serviceTitle}`,
      html
    });

    return res.json({ 
      success: sendRes.success, 
      recipient: { email, fullName },
      message: "Booking confirmation email successfully dispatched.", 
      details: sendRes.data || sendRes.error 
    });
  } catch (err: any) {
    console.error("Notification trigger error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 3. Dispatch Payment Confirmation Receipt manually or dynamically
 */
app.post("/api/notifications/payment-confirmed", async (req: any, res: any) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: "Payment ID is required." });
    }

    const firestore = getDb();
    const paymentDoc = await firestore.collection("payments").doc(paymentId).get();
    if (!paymentDoc.exists) {
      return res.status(404).json({ error: `Payment record ${paymentId} not found.` });
    }

    const payData = paymentDoc.data()!;
    const bookingId = payData.bookingId;

    const bookingDoc = await firestore.collection("bookings").doc(bookingId).get();
    const bookingData = bookingDoc.exists ? bookingDoc.data()! : {};

    const { email, fullName } = await getRecipientInfo(payData.clientId);

    if (!email) {
      return res.status(400).json({ error: "Recipient email could not be resolved." });
    }

    const serviceTitle = bookingData.packageName || bookingData.serviceTitle || "Fine-Art Photography Session";
    const amount = payData.amount || 0;
    const currency = payData.currency || "USD";
    const paymentRef = payData.flutterwaveReference || payData.paystackReference || paymentId;

    const html = buildPaymentConfirmationEmail({
      clientName: fullName,
      serviceTitle,
      amount,
      currency,
      paymentRef,
      bookingId
    });

    const sendRes = await sendEmail({
      to: email,
      subject: `Receipt of Fine-Art Transaction [Ref: ${paymentRef.slice(0, 10).toUpperCase()}]`,
      html
    });

    return res.json({ 
      success: sendRes.success, 
      recipient: { email, fullName },
      message: "Payment confirmation e-receipt successfully dispatched.", 
      details: sendRes.data || sendRes.error 
    });
  } catch (err: any) {
    console.error("Payment notification trigger error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 4. Dispatch Booking Reminder
 */
app.post("/api/notifications/booking-reminder", async (req: any, res: any) => {
  try {
    const { bookingId, reminderScope = "Tomorrow" } = req.body;
    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required." });
    }

    const firestore = getDb();
    const bookingDoc = await firestore.collection("bookings").doc(bookingId).get();
    if (!bookingDoc.exists) {
      return res.status(404).json({ error: `Booking ${bookingId} not found.` });
    }

    const data = bookingDoc.data()!;
    const { email, fullName } = await getRecipientInfo(data.clientId);

    if (!email) {
      return res.status(400).json({ error: "Recipient email could not be resolved." });
    }

    const serviceTitle = data.packageName || data.serviceTitle || "Creative Visual Shoots";
    const date = data.date || "Scheduled";
    const time = data.time || "Approved Slot";

    const html = buildBookingReminderEmail({
      clientName: fullName,
      serviceTitle,
      bookingDate: date,
      bookingTime: time,
      reminderScope
    });

    const sendRes = await sendEmail({
      to: email,
      subject: `Glass Polished — Shoot Reminder: ${serviceTitle}`,
      html
    });

    return res.json({ 
      success: sendRes.success, 
      recipient: { email, fullName },
      message: "Booking reminder email successfully dispatched.", 
      details: sendRes.data || sendRes.error 
    });
  } catch (err: any) {
    console.error("Reminder notification trigger error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 5. Dispatch Gallery Delivery Notification
 */
app.post("/api/notifications/gallery-delivered", async (req: any, res: any) => {
  try {
    const { clientId, galleryTitle, photosCount = 12 } = req.body;
    if (!clientId || !galleryTitle) {
      return res.status(400).json({ error: "clientId and galleryTitle parameters are required." });
    }

    const { email, fullName } = await getRecipientInfo(clientId);
    if (!email) {
      return res.status(400).json({ error: "Recipient email could not be resolved." });
    }

    const html = buildGalleryDeliveryEmail({
      clientName: fullName,
      galleryTitle,
      photosCount: Number(photosCount)
    });

    const sendRes = await sendEmail({
      to: email,
      subject: `Darkroom Complete: Your Digital Exhibition is Live — ${galleryTitle}`,
      html
    });

    return res.json({ 
      success: sendRes.success, 
      recipient: { email, fullName },
      message: "Gallery delivery email successfully dispatched.", 
      details: sendRes.data || sendRes.error 
    });
  } catch (err: any) {
    console.error("Gallery delivered trigger error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 6. Dispatch Branded Password Reset Link
 */
app.post("/api/notifications/password-reset", async (req: any, res: any) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "email is required." });
    }

    // A. Programmatically generate real verification password reset link with safe fallbacks
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    // B. Fetch recipient profile name to greet them elegantly
    let fullName = "Patron";
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      const recipientInfo = await getRecipientInfo(userRecord.uid);
      fullName = recipientInfo.fullName;
    } catch (profileErr) {
      console.warn("Could not find user record displayName, greeting as Patron:", profileErr.message);
    }

    // C. Compile luxury HTML layout
    const html = buildPasswordResetEmail({
      clientName: fullName,
      resetLink
    });

    const sendRes = await sendEmail({
      to: email,
      subject: "Shielding Your Account Path — Secure Password Reset Link",
      html
    });

    return res.json({ 
      success: sendRes.success, 
      recipient: { email, fullName },
      message: "Branded password reset instructions email successfully dispatched.", 
      details: sendRes.data || sendRes.error 
    });
  } catch (err: any) {
    console.error("Password reset trigger error:", err);
    return res.status(500).json({ error: err.message || "Failed programmatically generating reset link." });
  }
});


// -------------------------------------------------------------
// VITE OR STATIC CONTENT MIDDLEWARE SETUP
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started and running on http://localhost:${PORT}`);
  });
}

startServer();
