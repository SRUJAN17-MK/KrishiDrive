import React from 'react'
import { FileText, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold mb-4 border border-blue-200 dark:border-blue-800">
          <FileText size={14} /> Terms of Service
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
          KrishiDrive Terms of Service
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: November 2026 · Version 3.0
        </p>
      </div>

      <div className="space-y-8 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
          <p>By registering for or using KrishiDrive ("the Service"), you agree to these Terms of Service. If you do not agree to these terms, do not use the Service.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">2. Description of Service</h2>
          <p>KrishiDrive is an open-source agricultural logistics and crop intelligence platform that provides:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
            <li>Transport booking and tracking for agricultural produce</li>
            <li>Satellite-based environmental telemetry and crop suitability recommendations</li>
            <li>Wholesale mandi price data sourced from government APMC records</li>
            <li>AI-based crop disease detection (CPU inference, MobileNetV2 / PlantVillage)</li>
            <li>Real road-distance routing via OSRM</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">3. User Obligations</h2>
          <div className="space-y-3">
            <p>You agree to:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Provide accurate registration information and keep it updated</li>
              <li>Use the Service only for lawful agricultural and logistics purposes</li>
              <li>Not attempt to reverse-engineer, exploit, or disrupt the Service</li>
              <li>Not upload fraudulent transport bookings or misrepresent delivery status</li>
              <li>Keep your account credentials confidential and not share your session with others</li>
            </ul>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-amber-900 dark:text-amber-200 mb-2">4. AI &amp; Data Accuracy Disclaimer</h2>
              <div className="space-y-2 text-xs text-amber-800 dark:text-amber-300">
                <p><strong>Crop Disease Detection:</strong> The AI model (MobileNetV2, PlantVillage-trained) is a decision-support tool, not a certified diagnostic instrument. Confidence scores reflect model probability on 38 plant classes under controlled photographic conditions. Always verify AI recommendations with a qualified agronomist or crop protection specialist before applying treatments.</p>
                <p><strong>Satellite Intelligence:</strong> Soil moisture telemetry is derived from Copernicus land-surface reanalysis models (ECMWF via Open-Meteo), not from direct chemical analysis. Optical satellite data cannot measure soil NPK or pH. Recommendations are agronomic heuristics based on regional climate and elevation — consult local soil health cards.</p>
                <p><strong>Mandi Prices:</strong> Prices are as reported by APMC markets via Agmarknet/data.gov.in. Modal price is not a guaranteed rate. Prices change daily. Always confirm current rates directly with the mandi before transporting produce.</p>
                <p><strong>Route Distance &amp; Freight:</strong> Road distance and estimated freight costs are calculated from OSRM routing. Actual costs may vary with fuel prices, vehicle type, and negotiated rates.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">5. Transport Bookings &amp; Delivery OTP</h2>
          <div className="space-y-2 text-xs">
            <p>The 4-digit Delivery OTP is a simple verification mechanism to confirm produce handover. It is not a legally binding receipt and does not constitute insurance for goods in transit. Users are responsible for arranging appropriate transit insurance for high-value produce.</p>
            <p>KrishiDrive is not a party to any transport agreement between farmers and drivers. We provide the platform to connect them.</p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">6. Open-Source License</h2>
          <div className="space-y-2">
            <p>KrishiDrive is released under the MIT License. You are free to fork, modify, and self-host the codebase subject to the license terms. The source code is available at:</p>
            <a
              href="https://github.com/SRUJAN17-MK/KrishiDrive"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold hover:underline text-xs"
            >
              github.com/SRUJAN17-MK/KrishiDrive <ExternalLink size={11} />
            </a>
          </div>
        </section>

        <section>
          <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-emerald-900 dark:text-emerald-200 mb-2">7. What We Promise</h2>
              <ul className="text-xs text-emerald-800 dark:text-emerald-300 list-disc list-inside space-y-1">
                <li>We will never display fabricated live prices or simulated AI confidence scores</li>
                <li>When an external API is unavailable, we will clearly label data as "Unavailable" — not substitute fake data</li>
                <li>AI inference execution provider (CPU / NPU) will be accurately reported</li>
                <li>Your password will always be stored hashed — never in plain text</li>
                <li>We will not sell your farm location or crop data to third parties</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">8. Limitation of Liability</h2>
          <p className="text-xs">KrishiDrive is provided "as is" without warranty of any kind. The maintainers and contributors are not liable for any financial loss arising from transport arrangements, crop decisions, or mandi price changes made in reliance on information displayed by this platform.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">9. Changes to Terms</h2>
          <p className="text-xs">We may update these terms to reflect platform changes. Continued use of the Service after updates constitutes acceptance of the revised terms. The "Last updated" date above will be changed to reflect any modifications.</p>
        </section>

        {/* Footer links */}
        <div className="pt-6 border-t border-gray-200 dark:border-forest-800 flex gap-4 text-xs">
          <Link to="/privacy" className="text-emerald-700 dark:text-emerald-400 hover:underline">Privacy Policy</Link>
          <Link to="/system-status" className="text-emerald-700 dark:text-emerald-400 hover:underline">System Status</Link>
          <Link to="/" className="text-emerald-700 dark:text-emerald-400 hover:underline">Home</Link>
        </div>
      </div>
    </div>
  )
}
