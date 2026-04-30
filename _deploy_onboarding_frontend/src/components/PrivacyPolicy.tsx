import { ChevronLeft } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mt-2">Last updated: February 9, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Falisha Manpower ("we," "our," or "us") operates a recruitment automation portal that connects 
              job seekers with employment opportunities. This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our services, including our website, 
              WhatsApp Business integration, and application forms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2.1 Personal Information</h3>
                <p className="text-gray-700 leading-relaxed mb-2">When you apply for jobs or use our services, we may collect:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Full name, contact information (email, phone number, WhatsApp number)</li>
                  <li>Date of birth, nationality, passport details</li>
                  <li>National ID/CNIC details</li>
                  <li>Driving license information</li>
                  <li>Educational background and qualifications</li>
                  <li>Work history and professional experience</li>
                  <li>Skills, certifications, and training records</li>
                  <li>Photographs for identification purposes</li>
                  <li>Country of interest for employment</li>
                  <li>Salary expectations</li>
                  <li>Police clearance certificates</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2.2 Documents</h3>
                <p className="text-gray-700 leading-relaxed">
                  We collect and process various documents including CVs/resumes, passports, national IDs, 
                  educational certificates, police clearance certificates, and driving licenses submitted 
                  through our portal or WhatsApp Business channel.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2.3 Communication Data</h3>
                <p className="text-gray-700 leading-relaxed">
                  We collect messages, attachments, and interaction history when you communicate with us 
                  via WhatsApp, email, or through our inbox system.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2.4 Technical Information</h3>
                <p className="text-gray-700 leading-relaxed">
                  We automatically collect certain technical data including IP addresses, browser type, 
                  device information, and usage patterns when you access our services.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-2">We use collected information to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Process and manage your job applications</li>
              <li>Match your qualifications with suitable employment opportunities</li>
              <li>Communicate with you regarding job opportunities and application status</li>
              <li>Verify your identity and credentials</li>
              <li>Generate professional CVs and profiles for employer presentation</li>
              <li>Detect and prevent duplicate applications</li>
              <li>Request missing information or documents necessary for job placement</li>
              <li>Maintain records for compliance with employment regulations</li>
              <li>Improve our recruitment processes and services</li>
              <li>Send automated alerts and notifications about application status</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">4.1 With Employers</h3>
                <p className="text-gray-700 leading-relaxed">
                  We share your profile, CV, and relevant documents with potential employers who have 
                  job openings matching your qualifications. This is essential for our recruitment services.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">4.2 Service Providers</h3>
                <p className="text-gray-700 leading-relaxed">
                  We use third-party service providers including Supabase (database), OpenAI (document processing), 
                  Meta WhatsApp Business API (communication), Railway (hosting), and Brevo (email services). 
                  These providers have access to your information only to perform tasks on our behalf.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">4.3 Legal Requirements</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may disclose your information when required by law, to comply with legal processes, 
                  protect our rights, or ensure the safety of our users and services.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your 
              personal information against unauthorized access, alteration, disclosure, or destruction. 
              This includes encryption, secure authentication, access controls, and regular security assessments. 
              However, no method of transmission over the internet is 100% secure, and we cannot guarantee 
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information for as long as necessary to fulfill the purposes outlined 
              in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. 
              Candidate profiles and applications are typically retained for active recruitment purposes and for 
              a reasonable period thereafter to maintain historical records.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-2">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Access your personal information we hold</li>
              <li>Request correction of inaccurate or incomplete data</li>
              <li>Request deletion of your personal information (subject to legal obligations)</li>
              <li>Withdraw consent for data processing where applicable</li>
              <li>Object to processing of your personal information</li>
              <li>Request data portability</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:falishamanpower4035@gmail.com" className="text-blue-600 hover:underline">
                falishamanpower4035@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. WhatsApp Communication</h2>
            <p className="text-gray-700 leading-relaxed">
              When you communicate with us via WhatsApp Business, your messages and attachments are processed 
              through Meta's WhatsApp Business API. By using our WhatsApp channel, you consent to this processing. 
              WhatsApp messages are governed by both this Privacy Policy and Meta's privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed">
              Our website may use cookies and similar tracking technologies to enhance user experience, 
              analyze usage patterns, and improve our services. You can control cookie settings through 
              your browser preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of 
              residence. We ensure appropriate safeguards are in place to protect your information in accordance 
              with this Privacy Policy and applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect 
              personal information from children. If we become aware that we have collected information from 
              a child, we will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. The updated version will be indicated by 
              an updated "Last updated" date at the top of this policy. We encourage you to review this 
              Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, 
              please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-gray-700">
                <strong>Falisha Manpower</strong>
              </p>
              <p className="text-gray-700">
                Email:{' '}
                <a href="mailto:falishamanpower4035@gmail.com" className="text-blue-600 hover:underline">
                  falishamanpower4035@gmail.com
                </a>
              </p>
              <p className="text-gray-700">
                WhatsApp: +92 (984) 284-498-105-275
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Consent</h2>
            <p className="text-gray-700 leading-relaxed">
              By using our services, submitting your information, or communicating with us through our 
              channels (website, WhatsApp, email), you acknowledge that you have read and understood this 
              Privacy Policy and consent to the collection, use, and disclosure of your information as 
              described herein.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>© 2026 Falisha Manpower. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
