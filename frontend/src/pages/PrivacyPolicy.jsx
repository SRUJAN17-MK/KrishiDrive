import React from 'react'
import { ShieldCheck, Eye, Database, Server, Lock, Mail, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold mb-4 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck size={14} /> Privacy Policy
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
          KrishiDrive Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: November 2026 · Version 3.0
        </p>
      </div>

      <div className="prose prose-sm max-w-none dark:prose-invert space-y-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">

        {/* Section 1 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Eye size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">1. What Data We Collect</h2>
          </div>
          <div className="space-y-3 ml-7">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Account Information</h3>
              <p>When you register, we collect your username, role (farmer / driver / admin), and a securely hashed version of your password (bcrypt). We never store your plaintext password.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Farm &amp; Location Data</h3>
              <p>When you add a farm plot, we store its name, district, state, GPS coordinates (latitude/longitude), boundary polygon coordinates, and estimated area in acres. This data is tied to your account and used only to fetch satellite telemetry for that location.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Transport &amp; Booking Data</h3>
              <p>Booking requests include pickup/drop locations, crop type, quantity, and scheduling. Trip records include status milestones, delivery OTPs (4-digit codes, cleared after delivery), and estimated earnings.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Uploaded Images</h3>
              <p>When using the AI crop disease detection feature, you may upload a leaf photograph. This image is processed server-side by an ONNX model (MobileNetV2). Images are not permanently stored after inference completes.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Usage &amp; Audit Logs</h3>
              <p>Server-side audit logs record significant actions (booking creation, driver acceptance, payment updates) for security and dispute resolution. These logs contain timestamps, user IDs, and action type — not personal message content.</p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Database size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">2. How We Store Data</h2>
          </div>
          <div className="space-y-2 ml-7">
            <p>All data is stored in a SQLite database (WAL journal mode) on the server hosting your KrishiDrive deployment. Data is not sent to any third-party cloud database or analytics service by default.</p>
            <p>Passwords are hashed with bcrypt (12 rounds). Session tokens are signed JSON Web Tokens (JWT) with a 7-day expiry.</p>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 mt-2">
              <strong>Important:</strong> KrishiDrive is an open-source project. If you self-host this application, you are responsible for securing the host server, keeping your backend <code>.env</code> file secret, and maintaining database backups.
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Server size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">3. Third-Party Services &amp; APIs</h2>
          </div>
          <div className="space-y-2 ml-7">
            <p>KrishiDrive integrates with the following external services. When these services are queried, your location coordinates or query parameters are sent to their servers per their privacy policies:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                <strong>Open-Meteo</strong> (open-meteo.com) — Latitude &amp; longitude sent to fetch weather and soil moisture telemetry.{' '}
                <a href="https://open-meteo.com/en/terms" target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5">
                  Terms <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <strong>OSRM</strong> (router.project-osrm.org) — Coordinate pairs sent to calculate road routing distance and time. No personal identifiers are included.{' '}
                <a href="https://project-osrm.org" target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5">
                  Info <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <strong>Agmarknet / data.gov.in</strong> — Commodity name, state, and district sent to query wholesale mandi prices. Only queried if the <code>AGMARKNET_API_KEY</code> is configured.
              </li>
              <li>
                <strong>Esri World Imagery</strong> — Map tile requests (satellite base layer) include tile coordinates and zoom level, not GPS position.
              </li>
            </ul>
            <p className="text-xs mt-2">We do not sell, rent, or share your personal data with any third party for advertising or analytics purposes.</p>
          </div>
        </section>

        {/* Section 4 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Lock size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">4. Your Rights</h2>
          </div>
          <div className="space-y-2 ml-7">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Access:</strong> You can view all your registered farm plots, transport bookings, and crop records within the app dashboards.</li>
              <li><strong>Deletion:</strong> You can delete farm plots from the Satellite Intelligence page. Contact your system administrator to delete your account and associated data.</li>
              <li><strong>Portability:</strong> Farm boundary data is stored as GeoJSON-compatible coordinate arrays and can be exported.</li>
              <li><strong>Correction:</strong> Farm names, states, and districts can be edited directly in the app.</li>
            </ul>
          </div>
        </section>

        {/* Section 5 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Mail size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">5. Contact</h2>
          </div>
          <div className="ml-7 space-y-2">
            <p>KrishiDrive is an open-source project. For privacy questions, data requests, or security disclosures, please open an issue on the GitHub repository:</p>
            <a
              href="https://github.com/SRUJAN17-MK/KrishiDrive"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
            >
              github.com/SRUJAN17-MK/KrishiDrive <ExternalLink size={13} />
            </a>
            <p className="text-xs text-gray-500 dark:text-gray-400">We are committed to responding to privacy inquiries within 7 business days.</p>
          </div>
        </section>

        {/* Footer links */}
        <div className="pt-6 border-t border-gray-200 dark:border-forest-800 flex gap-4 text-xs">
          <Link to="/terms" className="text-emerald-700 dark:text-emerald-400 hover:underline">Terms of Service</Link>
          <Link to="/system-status" className="text-emerald-700 dark:text-emerald-400 hover:underline">System Status</Link>
          <Link to="/" className="text-emerald-700 dark:text-emerald-400 hover:underline">Home</Link>
        </div>
      </div>
    </div>
  )
}

