import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { LogOut, QrCode, FileText, Calendar, Users, Shield, ShieldOff } from 'lucide-react';

export default function AdminDashboard() {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [isFilterDisabled, setIsFilterDisabled] = useState(() => {
    return localStorage.getItem('disable_spam_filter') === 'true';
  });
  const navigate = useNavigate();

  // Use the specific Vercel domain for the QR code
  const surveyUrl = 'https://formsnt.vercel.app';

  const toggleFilter = () => {
    const newValue = !isFilterDisabled;
    setIsFilterDisabled(newValue);
    if (newValue) {
      localStorage.setItem('disable_spam_filter', 'true');
    } else {
      localStorage.removeItem('disable_spam_filter');
    }
  };

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const { data, error } = await supabase
          .from('responses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Map created_at to createdAt for compatibility with existing UI
        const mappedData = (data || []).map(item => ({
          ...item,
          createdAt: new Date(item.created_at)
        }));
        
        setResponses(mappedData);
      } catch (error) {
        console.error("Error fetching responses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();

    // Set up realtime subscription
    const subscription = supabase
      .channel('responses_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'responses' }, 
        (payload) => {
          fetchResponses(); // Re-fetch on any change to keep it simple and sorted
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-white mr-2" />
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={toggleFilter}
                className={`flex items-center px-2 sm:px-3 py-2 border text-sm leading-4 font-medium rounded-md focus:outline-none ${
                  isFilterDisabled 
                    ? 'border-yellow-400 text-yellow-100 bg-yellow-600 hover:bg-yellow-700' 
                    : 'border-indigo-400 text-indigo-100 hover:bg-indigo-700'
                }`}
                title="Spam-Filter für Entwicklung umschalten"
              >
                {isFilterDisabled ? (
                  <><ShieldOff className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Filter AUS</span></>
                ) : (
                  <><Shield className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Filter EIN</span></>
                )}
              </button>
              <button
                onClick={() => setShowQR(true)}
                className="flex items-center px-2 sm:px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none"
                title="QR Code anzeigen"
              >
                <QrCode className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">QR Code</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-2 sm:px-3 py-2 border border-indigo-400 text-sm leading-4 font-medium rounded-md text-white hover:bg-indigo-700 focus:outline-none"
                title="Abmelden"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Abmelden</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Umfrageergebnisse</h2>
            <p className="mt-1 text-sm text-gray-500">
              Übersicht aller eingegangenen anonymen Antworten.
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 flex items-center self-start sm:self-auto">
            <Users className="w-5 h-5 text-indigo-500 mr-2" />
            <span className="text-lg font-semibold text-gray-900">{responses.length}</span>
            <span className="ml-2 text-sm text-gray-500">Antworten</span>
          </div>
        </div>

        {responses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Noch keine Antworten</h3>
            <p className="mt-2 text-sm text-gray-500">
              Sobald Mitarbeiter die Umfrage ausfüllen, erscheinen die Ergebnisse hier.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {responses.map((response, index) => (
              <div key={response.id} className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-50 border-b border-gray-200 gap-2">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Antwort #{responses.length - index}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    {response.createdAt.toLocaleString('de-DE')}
                  </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                  <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">1. Depot</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{response.depot || '-'}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">2. Zufriedenheit</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{response.satisfaction || '-'}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">3. Unterstützung</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{response.support || '-'}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">4. Kommunikation</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{response.communication || '-'}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">5. Arbeitsbelastung</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{response.workload || '-'}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">6. Tourenplanung</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{response.tourPlanning || '-'}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">7. Arbeitsmittel</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{response.equipment || '-'}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">8. Was läuft gut?</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{response.goodThings || '-'}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">9. Verbesserungsvorschläge</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{response.suggestions || '-'}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">10. Sonstiges</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{response.other || '-'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowQR(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Umfrage QR-Code
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Drucken Sie diesen QR-Code aus oder teilen Sie ihn mit den Mitarbeitern.
                    </p>
                    <div className="flex justify-center bg-white p-4 rounded-lg border border-gray-200">
                      <QRCodeSVG value={surveyUrl} size={200} />
                    </div>
                    <p className="mt-4 text-xs text-gray-400 break-all">
                      {surveyUrl}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  onClick={() => setShowQR(false)}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
