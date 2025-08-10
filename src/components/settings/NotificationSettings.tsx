"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Heart, 
  User,
  TrendingUp,
  Clock,
  Volume2,
  VolumeX
} from 'lucide-react';

interface User {
  sub: string;
  email: string;
  name?: string;
}

interface NotificationSettingsProps {
  user: User;
}

export function NotificationSettings({ user }: NotificationSettingsProps) {
  const [emailNotifications, setEmailNotifications] = useState({
    newComments: true,
    newLikes: true,
    newFollowers: false,
    weeklyDigest: true,
    productUpdates: false,
    securityAlerts: true
  });

  const [pushNotifications, setPushNotifications] = useState({
    newComments: true,
    newLikes: false,
    newFollowers: true,
    mentions: true,
    directMessages: true
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleEmailToggle = (key: keyof typeof emailNotifications) => {
    setEmailNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePushToggle = (key: keyof typeof pushNotifications) => {
    setPushNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Notification settings saved:', { emailNotifications, pushNotifications, soundEnabled });
    } catch (error) {
      console.error('Error saving notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const emailNotificationOptions = [
    {
      key: 'newComments' as keyof typeof emailNotifications,
      icon: MessageSquare,
      title: 'Comentarii noi',
      description: 'Când cineva comentează la postările tale',
      color: 'from-blue-500 to-blue-600'
    },
    {
      key: 'newLikes' as keyof typeof emailNotifications,
      icon: Heart,
      title: 'Like-uri noi',
      description: 'Când cineva dă like la postările tale',
      color: 'from-pink-500 to-pink-600'
    },
    {
      key: 'newFollowers' as keyof typeof emailNotifications,
      icon: User,
      title: 'Urmăritori noi',
      description: 'Când cineva începe să te urmărească',
      color: 'from-green-500 to-green-600'
    },
    {
      key: 'weeklyDigest' as keyof typeof emailNotifications,
      icon: TrendingUp,
      title: 'Rezumat săptămânal',
      description: 'Statistici și activități din ultima săptămână',
      color: 'from-purple-500 to-purple-600'
    },
    {
      key: 'productUpdates' as keyof typeof emailNotifications,
      icon: Bell,
      title: 'Actualizări produs',
      description: 'Noutăți și îmbunătățiri ale platformei',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      key: 'securityAlerts' as keyof typeof emailNotifications,
      icon: Clock,
      title: 'Alerte de securitate',
      description: 'Notificări importante despre cont',
      color: 'from-red-500 to-red-600'
    }
  ];

  const pushNotificationOptions = [
    {
      key: 'newComments' as keyof typeof pushNotifications,
      icon: MessageSquare,
      title: 'Comentarii noi',
      description: 'Notificări instant pentru comentarii',
      color: 'from-blue-500 to-blue-600'
    },
    {
      key: 'newLikes' as keyof typeof pushNotifications,
      icon: Heart,
      title: 'Like-uri noi',
      description: 'Notificări instant pentru like-uri',
      color: 'from-pink-500 to-pink-600'
    },
    {
      key: 'newFollowers' as keyof typeof pushNotifications,
      icon: User,
      title: 'Urmăritori noi',
      description: 'Notificări pentru urmăritori noi',
      color: 'from-green-500 to-green-600'
    },
    {
      key: 'mentions' as keyof typeof pushNotifications,
      icon: Bell,
      title: 'Mențiuni',
      description: 'Când ești menționat în postări sau comentarii',
      color: 'from-orange-500 to-orange-600'
    },
    {
      key: 'directMessages' as keyof typeof pushNotifications,
      icon: Mail,
      title: 'Mesaje directe',
      description: 'Notificări pentru mesaje private',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Email Notifications */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Notificări email
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Controlează ce notificări primești pe email
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {emailNotificationOptions.map((option, index) => (
              <motion.div
                key={option.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center`}>
                    <option.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{option.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{option.description}</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEmailToggle(option.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailNotifications[option.key] ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      emailNotifications[option.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Notificări push
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Notificări instant în browser și pe mobil
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {pushNotificationOptions.map((option, index) => (
              <motion.div
                key={option.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center`}>
                    <option.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{option.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{option.description}</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePushToggle(option.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    pushNotifications[option.key] ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      pushNotifications[option.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Sound Settings */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                {soundEnabled ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Sunete notificări
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Redă sunete pentru notificările push
                </p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                soundEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
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
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Bell size={20} />
        )}
        {loading ? 'Se salvează...' : 'Salvează setările de notificare'}
      </motion.button>
    </motion.div>
  );
}
