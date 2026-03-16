import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, AlertCircle, Globe } from 'lucide-react';
import { translations, Language } from '../translations';

export default function SurveyForm() {
  const [step, setStep] = useState<'start' | 'survey' | 'success' | 'already_submitted'>('start');
  const [lang, setLang] = useState<Language>('DE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentQIndex, setCurrentQIndex] = useState(0);

  const t = translations[lang];
  const tDe = translations['DE']; // Used for storing values in DB

  useEffect(() => {
    // Check if user has already submitted the survey on this device/browser
    const hasSubmitted = localStorage.getItem('survey_completed');
    const isFilterDisabled = localStorage.getItem('disable_spam_filter') === 'true';
    
    if (hasSubmitted === 'true' && !isFilterDisabled) {
      setStep('already_submitted');
    }
  }, []);

  const [formData, setFormData] = useState({
    depot: '',
    satisfaction: '',
    support: '',
    communication: '',
    workload: '',
    tourPlanning: '',
    equipment: '',
    goodThings: '',
    suggestions: '',
    other: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let finalData = { ...formData };

      // Translate free-text fields to German if language is not DE
      if (lang !== 'DE') {
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourceLang: lang,
              texts: {
                goodThings: formData.goodThings,
                suggestions: formData.suggestions,
                other: formData.other
              }
            })
          });
          
          if (res.ok) {
            const { translated } = await res.json();
            if (translated) {
              const formatText = (original: string, translatedText: string) => {
                if (!original || !original.trim()) return original;
                if (!translatedText || translatedText === original) return original;
                return `[Übersetzung]: ${translatedText}\n\n[Original]: ${original}`;
              };

              finalData.goodThings = formatText(formData.goodThings, translated.goodThings);
              finalData.suggestions = formatText(formData.suggestions, translated.suggestions);
              finalData.other = formatText(formData.other, translated.other);
            }
          }
        } catch (translateErr) {
          console.error("Translation failed, falling back to original text", translateErr);
        }
      }

      const { error: supabaseError } = await supabase
        .from('responses')
        .insert([
          {
            ...finalData,
            language: lang
          }
        ]);

      if (supabaseError) {
        throw supabaseError;
      }

      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response: finalData })
        });
      } catch (emailErr) {
        console.error("Failed to send email notification", emailErr);
      }

      // Mark as completed in local storage to prevent spam
      localStorage.setItem('survey_completed', 'true');
      setStep('success');
    } catch (err: any) {
      console.error("Error submitting survey:", err);
      setError(t.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'already_submitted') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bereits teilgenommen</h2>
          <p className="text-gray-600">Sie haben diese Umfrage bereits ausgefüllt. Vielen Dank für Ihr Feedback!</p>
        </div>
      </div>
    );
  }

  if (step === 'start') {
    const isFilterDisabled = localStorage.getItem('disable_spam_filter') === 'true';
    
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6">
        {isFilterDisabled && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 text-xs py-1 px-4 text-center font-bold z-50">
            DEV MODE: Spam Filter is OFF
          </div>
        )}
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center mt-4">
          <Globe className="w-16 h-16 text-indigo-600 mx-auto mb-6" />
          
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.selectLang}
            </label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
            >
              <option value="DE">Deutsch</option>
              <option value="RO">Română</option>
              <option value="RU">Русский</option>
              <option value="BG">Български</option>
              <option value="UKR">Українська</option>
            </select>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.startTitle}</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {t.startDesc}
          </p>

          <button
            onClick={() => setStep('survey')}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {t.startBtn}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.thankYouTitle}</h2>
          <p className="text-gray-600">{t.thankYouDesc}</p>
        </div>
      </div>
    );
  }

  const isFilterDisabled = localStorage.getItem('disable_spam_filter') === 'true';

  const questions = [
    { id: 'q1', name: 'depot', type: 'radio', title: t.q1, options: t.q1_opts, dbOptions: tDe.q1_opts },
    { id: 'q2', name: 'satisfaction', type: 'radio', title: t.q2, options: t.q2_opts, dbOptions: tDe.q2_opts },
    { id: 'q3', name: 'support', type: 'radio', title: t.q3, options: t.q3_opts, dbOptions: tDe.q3_opts },
    { id: 'q4', name: 'communication', type: 'radio', title: t.q4, options: t.q4_opts, dbOptions: tDe.q4_opts },
    { id: 'q5', name: 'workload', type: 'radio', title: t.q5, options: t.q5_opts, dbOptions: tDe.q5_opts },
    { id: 'q6', name: 'tourPlanning', type: 'radio', title: t.q6, options: t.q6_opts, dbOptions: tDe.q6_opts },
    { id: 'q7', name: 'equipment', type: 'radio', title: t.q7, options: t.q7_opts, dbOptions: tDe.q7_opts },
    { id: 'q8', name: 'goodThings', type: 'text', title: t.q8 },
    { id: 'q9', name: 'suggestions', type: 'text', title: t.q9 },
    { id: 'q10', name: 'other', type: 'text', title: t.q10 },
  ];

  const currentQuestion = questions[currentQIndex];
  const progress = ((currentQIndex) / (questions.length - 1)) * 100;

  const currentAnswer = formData[currentQuestion.name as keyof typeof formData];
  const isCurrentQuestionAnswered = currentAnswer && currentAnswer.trim() !== '';

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
    }
  };

  const handleRadioSelect = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setTimeout(() => {
      if (currentQIndex < questions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      {isFilterDisabled && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 text-xs py-1 px-4 text-center font-bold z-50">
          DEV MODE: Spam Filter is OFF
        </div>
      )}
      <div className="max-w-2xl w-full bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden mt-4">
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-2">
          <div 
            className="bg-indigo-600 h-2 transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="px-5 py-8 sm:p-12">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="mb-8">
            <span className="text-sm font-semibold text-indigo-600 tracking-wider uppercase mb-2 block">
              {t.questionWord} {currentQIndex + 1} {t.ofWord} {questions.length}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight whitespace-pre-wrap">
              {currentQuestion.title}
            </h2>
          </div>

          <div className="min-h-[280px]">
            {currentQuestion.type === 'radio' ? (
              <div className="space-y-3">
                {currentQuestion.options?.map((option: string, index: number) => {
                  const dbValue = currentQuestion.dbOptions?.[index] || '';
                  const isSelected = formData[currentQuestion.name as keyof typeof formData] === dbValue;
                  
                  return (
                    <button
                      key={dbValue}
                      type="button"
                      onClick={() => handleRadioSelect(currentQuestion.name, dbValue)}
                      className={`w-full text-center px-6 py-4 rounded-xl border-2 transition-all duration-200 relative ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md transform scale-[1.02]' 
                          : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span className="text-lg font-medium flex items-center justify-center h-12">
                          {dbValue === 'GLS' ? (
                            <img src="https://i.postimg.cc/1tYcP3gv/d_GLS.png" alt="GLS" className="h-10 object-contain" referrerPolicy="no-referrer" />
                          ) : dbValue === 'DHL' ? (
                            <img src="https://i.postimg.cc/hj3bgtJp/d_DHL.png" alt="DHL" className="h-8 object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            option
                          )}
                        </span>
                        {isSelected && <CheckCircle2 className="w-6 h-6 text-indigo-600 absolute right-6" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <textarea
                  name={currentQuestion.name}
                  value={formData[currentQuestion.name as keyof typeof formData]}
                  onChange={handleChange}
                  rows={6}
                  className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-4 text-lg text-center transition-colors resize-none"
                  placeholder={t.placeholder}
                />
              </div>
            )}
          </div>

          <div className="mt-8 sm:mt-10 flex items-center justify-between pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentQIndex === 0}
              className="px-4 sm:px-6 py-3 text-gray-500 font-medium rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-sm sm:text-base"
            >
              {t.prevBtn}
            </button>
            
            {currentQIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isCurrentQuestionAnswered}
                className="px-6 sm:px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all active:scale-95 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 disabled:hover:shadow-md disabled:active:scale-100"
              >
                {t.nextBtn}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !isCurrentQuestionAnswered}
                className="px-6 sm:px-8 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center active:scale-95 text-sm sm:text-base disabled:hover:bg-emerald-600 disabled:hover:shadow-md disabled:active:scale-100"
              >
                {isSubmitting ? t.submitting : t.submitBtn}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
