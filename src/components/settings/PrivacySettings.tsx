"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Eye, 
  Lock, 
  Globe,
  Users,
  UserCheck,
  Download,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface User {
  sub: string;
  email: string;
  name?: string;
}

interface PrivacySettingsProps {
  user: User;
}

export function PrivacySettings({ user }: PrivacySettingsProps) {
  const [profileVisibility, setProfileVisibility] = useState('public'); // public, friends, private
  const [showEmail, setShowEmail] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowMessages, setAllowMessages] = useState('everyone'); // everyone, friends, none
  const [dataCollection, setDataCollection] = useState({
    analytics: true,
    personalization: true,
    marketing: false,
    thirdParty: false
  });
  const [loading, setLoading] = useState(false);

  const handleDataCollectionToggle = (key: keyof typeof dataCollection) => {
    setDataCollection(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const exportData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Simulăm descărcarea datelor
      console.log('Data export initiated');
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (confirm('Ești sigur că vrei să ștergi contul? Această acțiune nu poate fi anulată.')) {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Account deletion initiated');
      } catch (error) {
        console.error('Error deleting account:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Privacy settings saved:', {
        profileVisibility,
        showEmail,
        showOnlineStatus,
        allowMessages,
        dataCollection
      });
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const visibilityOptions = [
    { value: 'public', label: 'Public', desc: 'Oricine poate vedea profilul tău', icon: Globe },
    { value: 'friends', label: 'Prieteni', desc: 'Doar prietenii pot vedea profilul', icon: Users },
    { value: 'private', label: 'Privat', desc: 'Doar tu poți vedea profilul', icon: Lock }
  ];

  const messageOptions = [
    { value: 'everyone', label: 'Oricine', desc: 'Oricine îți poate trimite mesaje' },
    { value: 'friends', label: 'Prieteni', desc: 'Doar prietenii îți pot trimite mesaje' },
    { value: 'none', label: 'Nimeni', desc: 'Nu primești mesaje de la nimeni' }
  ];

  const dataCollectionOptions = [
    {
      key: 'analytics' as keyof typeof dataCollection,
      title: 'Date de analiză',
      description: 'Colectăm date pentru a îmbunătăți experiența utilizatorului',
      color: 'from-blue-500 to-blue-600'
    },
    {
      key: 'personalization' as keyof typeof dataCollection,
      title: 'Personalizare',
      description: 'Folosim datele pentru a personaliza conținutul',
      color: 'from-purple-500 to-purple-600'
    },
    {
      key: 'marketing' as keyof typeof dataCollection,
      title: 'Marketing',
      description: 'Primești conținut promotional personalizat',
      color: 'from-pink-500 to-pink-600'
    },
    {
      key: 'thirdParty' as keyof typeof dataCollection,
      title: 'Parteneri terți',
      description: 'Partajăm date anonime cu partenerii noștri',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Profile Visibility */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Vizibilitatea profilului
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Controlează cine poate vedea profilul tău
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {visibilityOptions.map((option) => (
              <motion.label
                key={option.value}
                whileHover={{ scale: 1.01 }}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  profileVisibility === option.value
                    ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                    : 'border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-slate-800/50 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="profileVisibility"
                  value={option.value}
                  checked={profileVisibility === option.value}
                  onChange={(e) => setProfileVisibility(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  profileVisibility === option.value ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  <option.icon size={16} />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{option.label}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{option.desc}</p>
                </div>
                {profileVisibility === option.value && (
                  <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                )}
              </motion.label>
            ))}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Informații personale
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Controlează ce informații sunt vizibile
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-slate-800/50">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Afișează email-ul</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Email-ul va fi vizibil pe profil</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEmail(!showEmail)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showEmail ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showEmail ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-slate-800/50">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Status online</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Afișează când ești online</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowOnlineStatus(!showOnlineStatus)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showOnlineStatus ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Mesaje private
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Cine îți poate trimite mesaje
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {messageOptions.map((option) => (
              <motion.label
                key={option.value}
                whileHover={{ scale: 1.01 }}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  allowMessages === option.value
                    ? 'border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20'
                    : 'border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-slate-800/50 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="allowMessages"
                  value={option.value}
                  checked={allowMessages === option.value}
                  onChange={(e) => setAllowMessages(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  allowMessages === option.value 
                    ? 'border-purple-500 bg-purple-500' 
                    : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {allowMessages === option.value && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{option.label}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{option.desc}</p>
                </div>
              </motion.label>
            ))}
          </div>
        </div>
      </div>

      {/* Data Collection */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Colectarea datelor
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Controlează cum folosim datele tale
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {dataCollectionOptions.map((option, index) => (
              <motion.div
                key={option.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center`}>
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{option.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{option.description}</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDataCollectionToggle(option.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    dataCollection[option.key] ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      dataCollection[option.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Gestionarea datelor
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Exportă sau șterge datele tale
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportData}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={20} />
              )}
              <span className="font-medium text-slate-900 dark:text-white">
                {loading ? 'Se exportă...' : 'Exportă toate datele'}
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={deleteAccount}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-600 dark:text-red-400"
            >
              <AlertTriangle size={20} />
              <span className="font-medium">Șterge contul definitiv</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={saveSettings}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Shield size={20} />
        )}
        {loading ? 'Se salvează...' : 'Salvează setările de privacy'}
      </motion.button>
    </motion.div>
  );
}
