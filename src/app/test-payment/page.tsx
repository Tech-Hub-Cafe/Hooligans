"use client";

import React, { useState } from "react";
import SquarePaymentForm from "@/components/checkout/SquarePaymentForm";

export default function TestPaymentPage() {
    const [status, setStatus] = useState<string>("Ready");

    return (
        <div className="min-h-screen bg-white p-8 font-sans">
            <h1 className="text-2xl font-bold mb-8">Square Payment Isolation Test</h1>

            <div className="max-w-md mx-auto border p-6 rounded-lg shadow-sm">
                <div className="mb-4 p-4 bg-gray-100 rounded text-sm">
                    <p><strong>Status:</strong> {status}</p>
                </div>

                <SquarePaymentForm
                    amount={100} // $1.00
                    onPaymentSuccess={(token) => setStatus(`Success! Token: ${token.substring(0, 10)}...`)}
                    onPaymentError={(err) => setStatus(`Error: ${err}`)}
                    isProcessing={false}
                    setIsProcessing={(process) => console.log("Processing:", process)}
                />
            </div>
        </div>
    );
}
