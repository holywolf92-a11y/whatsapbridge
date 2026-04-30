import { useState } from 'react';
import { MessageSquare, Mail, Send, Copy, Edit2, Trash2, Plus, Eye, CheckCircle, Smartphone, Settings } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  type: 'WhatsApp' | 'Email' | 'SMS';
  trigger: 'CV Received' | 'Interview Scheduled' | 'Offer Letter' | 'Rejection' | 'Manual';
  subject?: string;
  message: string;
  variables: string[];
  autoSend: boolean;
  active: boolean;
  usageCount: number;
}

const mockTemplates: Template[] = [
  {
    id: 'tmpl-001',
    name: 'CV Received - WhatsApp',
    type: 'WhatsApp',
    trigger: 'CV Received',
    message: `✅ Thank you {name}!

We have received your CV for the position of {position}.

📋 Your application details:
• Name: {name}
• Position: {position}
• Country of Interest: {country}

Our team will review your profile and contact you within 2-3 business days.

🌐 Track your application: falisha.com/track/{id}

Best regards,
Falisha Manpower`,
    variables: ['name', 'position', 'country', 'id'],
    autoSend: true,
    active: true,
    usageCount: 1247
  },
  {
    id: 'tmpl-002',
    name: 'CV Received - Email',
    type: 'Email',
    trigger: 'CV Received',
    subject: 'Application Received - {position} Position',
    message: `Dear {name},

Thank you for applying to Falisha Manpower for the position of {position}.

We have successfully received your CV and it is now under review by our recruitment team.

Application Details:
- Position Applied: {position}
- Country of Interest: {country}
- Application Date: {date}
- Application ID: {id}

What happens next?
1. Our team will review your profile within 2-3 business days
2. If shortlisted, we will contact you for an interview
3. You can track your application status at: https://falisha.com/track/{id}

If you have any questions, feel free to contact us:
📞 Phone: +92 300 1234567
📧 Email: info@falisha.com

Best regards,
Recruitment Team
Falisha Manpower`,
    variables: ['name', 'position', 'country', 'date', 'id'],
    autoSend: true,
    active: true,
    usageCount: 892
  },
  {
    id: 'tmpl-003',
    name: 'Interview Scheduled - WhatsApp',
    type: 'WhatsApp',
    trigger: 'Interview Scheduled',
    message: `🎉 Great news {name}!

You have been shortlisted for the {position} position.

📅 Interview Details:
• Date: {interview_date}
• Time: {interview_time}
• Location: {interview_location}

📋 Please bring:
✓ Original passport
✓ Educational certificates
✓ Experience letters
✓ 2 passport size photos

Reply "CONFIRM" to confirm your attendance.

Good luck!
Falisha Manpower`,
    variables: ['name', 'position', 'interview_date', 'interview_time', 'interview_location'],
    autoSend: false,
    active: true,
    usageCount: 156
  },
  {
    id: 'tmpl-004',
    name: 'Interview Scheduled - Email',
    type: 'Email',
    trigger: 'Interview Scheduled',
    subject: 'Interview Invitation - {position} Position at Falisha Manpower',
    message: `Dear {name},

Congratulations! You have been shortlisted for the {position} position.

Interview Details:
------------------
Date: {interview_date}
Time: {interview_time}
Location: {interview_location}
Duration: Approximately 30-45 minutes

Documents Required:
-------------------
1. Original Passport (valid for at least 2 years)
2. Educational Certificates (attested copies)
3. Experience Letters from previous employers
4. Professional Certificates/Licenses
5. Two recent passport-size photographs
6. Copy of this email

Interview Format:
-----------------
The interview will consist of:
- Skills assessment
- Language proficiency test
- Personal interview with HR
- Medical fitness check (if applicable)

Important Notes:
---------------
• Please arrive 15 minutes before your scheduled time
• Dress code: Business casual
• Bring all original documents for verification
• Reply to this email to confirm your attendance

If you need to reschedule, please contact us at least 24 hours in advance.

We look forward to meeting you!

Best regards,
{recruiter_name}
Falisha Manpower
Phone: {office_phone}
Email: {office_email}`,
    variables: ['name', 'position', 'interview_date', 'interview_time', 'interview_location', 'recruiter_name', 'office_phone', 'office_email'],
    autoSend: false,
    active: true,
    usageCount: 134
  },
  {
    id: 'tmpl-005',
    name: 'Offer Letter - Email',
    type: 'Email',
    trigger: 'Offer Letter',
    subject: 'Job Offer - {position} in {country}',
    message: `Dear {name},

We are pleased to offer you the position of {position} with our client in {country}.

Job Offer Details:
------------------
Position: {position}
Country: {country}
Employer: {employer_name}
Salary: {salary} per month
Contract Duration: {contract_duration}
Benefits: {benefits}

Next Steps:
-----------
1. Review the attached employment contract
2. Sign and return the contract within 3 days
3. Complete medical examination
4. Submit all required documents
5. Attend pre-departure orientation

Required Documents:
-------------------
• Signed contract
• Medical fitness certificate
• Police clearance certificate
• Educational certificates (attested)
• Passport copy
• Passport-size photographs (6 copies)

Please confirm your acceptance by replying to this email within 48 hours.

Congratulations on your new opportunity!

Best regards,
{recruiter_name}
Falisha Manpower`,
    variables: ['name', 'position', 'country', 'employer_name', 'salary', 'contract_duration', 'benefits', 'recruiter_name'],
    autoSend: false,
    active: true,
    usageCount: 67
  },
  {
    id: 'tmpl-006',
    name: 'Application Status Update - SMS',
    type: 'SMS',
    trigger: 'Manual',
    message: `Hi {name}, your application (ID: {id}) for {position} is now {status}. Contact us for details: +92 300 1234567`,
    variables: ['name', 'id', 'position', 'status'],
    autoSend: false,
    active: true,
    usageCount: 423
  }
];

export function CommunicationTemplates() {
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({
    name: 'Ahmed Hassan',
    position: 'Electrician',
    country: 'UAE',
    date: '2024-12-13',
    id: 'CND-001',
    interview_date: '2024-12-20',
    interview_time: '10:00 AM',
    interview_location: 'Falisha Office, Lahore',
    recruiter_name: 'Sarah Ahmed',
    office_phone: '+92 300 1234567',
    office_email: 'info@falisha.com',
    employer_name: 'ABC Construction',
    salary: '1500 AED',
    contract_duration: '2 years',
    benefits: 'Accommodation, Food, Transportation',
    status: 'Under Review'
  });

  const filteredTemplates = filterType === 'all' 
    ? templates 
    : templates.filter(t => t.type === filterType);

  const renderPreview = (template: Template) => {
    let message = template.message;
    Object.entries(previewData).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return message;
  };

  const stats = {
    total: templates.length,
    whatsapp: templates.filter(t => t.type === 'WhatsApp').length,
    email: templates.filter(t => t.type === 'Email').length,
    sms: templates.filter(t => t.type === 'SMS').length,
    auto: templates.filter(t => t.autoSend).length,
    active: templates.filter(t => t.active).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Communication Templates</h1>
          <p className="text-gray-600 mt-1">Automated messages for WhatsApp, Email & SMS</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg">
          <Plus className="w-5 h-5" />
          Create Template
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total</span>
            <MessageSquare className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-700">WhatsApp</span>
            <MessageSquare className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-semibold text-green-900">{stats.whatsapp}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700">Email</span>
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-semibold text-blue-900">{stats.email}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-700">SMS</span>
            <Smartphone className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-semibold text-purple-900">{stats.sms}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-yellow-700">Auto-Send</span>
            <Send className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-semibold text-yellow-900">{stats.auto}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-700">Active</span>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-semibold text-green-900">{stats.active}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Templates
          </button>
          <button
            onClick={() => setFilterType('WhatsApp')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              filterType === 'WhatsApp' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={() => setFilterType('Email')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              filterType === 'Email' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
          <button
            onClick={() => setFilterType('SMS')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              filterType === 'SMS' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            SMS
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    template.type === 'WhatsApp' ? 'bg-green-100' :
                    template.type === 'Email' ? 'bg-blue-100' :
                    'bg-purple-100'
                  }`}>
                    {template.type === 'WhatsApp' && <MessageSquare className="w-6 h-6 text-green-600" />}
                    {template.type === 'Email' && <Mail className="w-6 h-6 text-blue-600" />}
                    {template.type === 'SMS' && <Smartphone className="w-6 h-6 text-purple-600" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{template.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        template.type === 'WhatsApp' ? 'bg-green-100 text-green-700' :
                        template.type === 'Email' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {template.type}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {template.trigger}
                      </span>
                      {template.autoSend && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          Auto-Send
                        </span>
                      )}
                      {template.active && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject (Email only) */}
              {template.subject && (
                <div className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">Subject:</div>
                  <div className="text-sm font-medium text-gray-900">{template.subject}</div>
                </div>
              )}

              {/* Message Preview */}
              <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
                <div className="text-xs text-gray-600 mb-2">Message:</div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap line-clamp-4 font-mono">
                  {template.message}
                </div>
              </div>

              {/* Variables */}
              <div className="mb-4">
                <div className="text-xs text-gray-600 mb-2">Variables Used:</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {template.variables.map((variable) => (
                    <span key={variable} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono">
                      {`{${variable}}`}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-1">
                  <Send className="w-4 h-4" />
                  <span>Used {template.usageCount} times</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowPreview(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm">
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Template Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Template Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">{selectedTemplate.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {selectedTemplate.type}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {selectedTemplate.trigger}
                  </span>
                </div>
              </div>

              {/* Preview with real data */}
              {selectedTemplate.subject && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">Subject:</div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    {renderPreview({ ...selectedTemplate, message: selectedTemplate.subject })}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">Message:</div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded whitespace-pre-wrap">
                  {renderPreview(selectedTemplate)}
                </div>
              </div>

              {/* Sample Data Info */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-sm text-yellow-800">
                  <strong>Note:</strong> This preview uses sample data. Actual messages will use real candidate information.
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send Test Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Automated Communication System</h3>
            <p className="text-sm text-gray-700 mb-3">
              Templates with "Auto-Send" enabled will automatically send messages when triggered. You can use variables like {`{name}`}, {`{position}`}, etc. to personalize messages.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Auto-send on CV received
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Personalized variables
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Multi-channel support
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Usage tracking
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
