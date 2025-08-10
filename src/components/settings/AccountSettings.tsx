"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Save,
  X,
  AlertCircle
} from 'lucide-react';

interface User {
  sub: string;
  email: string;
  name?: string;
}

interface AccountSettingsProps {
  user: User;
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changes, setChanges] = useState({
    name: user.name || '',
    email: user.email,
    phone: '+40 123 456 789',
    website: 'https://example.com',
    bio: 'Pasionat de tehnologie și inovație.',
    location: 'București, România',
    company: 'Tech Company SRL',
    jobTitle: 'Frontend Developer'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[field] = 'Email invalid';
        } else {
          delete newErrors[field];
        }
        break;
      case 'name':
        if (value.length < 2) {
          newErrors[field] = 'Numele trebuie să aibă cel puțin 2 caractere';
        } else {
          delete newErrors[field];
        }
        break;
      case 'phone':
        if (value && !/^\+?\d{10,}$/.test(value.replace(/\s/g, ''))) {
          newErrors[field] = 'Numărul de telefon nu este valid';
        } else {
          delete newErrors[field];
        }
        break;
      default:
        delete newErrors[field];
    }
    
    setErrors(newErrors);
  };

  const handleInputChange = (field: string, value: string) => {
    setChanges(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSave = async () => {
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      // Simulăm salvarea
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsEditing(false);
      // Aici ar fi call-ul la API pentru salvare
      console.log('Settings saved:', changes);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formFields = [
    {
      key: 'name',
      label: 'Nume complet',
      icon: User,
      type: 'text',
      placeholder: 'Numele tău complet'
    },
    {
      key: 'email',
      label: 'Adresa de email',
      icon: Mail,
      type: 'email',
      placeholder: 'email@example.com'
    },
    {
      key: 'phone',
      label: 'Număr de telefon',
      icon: Phone,
      type: 'tel',
      placeholder: '+40 123 456 789'
    },
    {
      key: 'website',
      label: 'Website personal',
      icon: Globe,
      type: 'url',
      placeholder: 'https://example.com'
    },
    {
      key: 'company',
      label: 'Companie',
      icon: User,
      type: 'text',
      placeholder: 'Numele companiei'
    },
    {
      key: 'jobTitle',
      label: 'Funcția',
      icon: User,
      type: 'text',
      placeholder: 'Funcția ta în companie'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Informații cont
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Gestionează informațiile personale
              </p>
            </div>
          </div>

          {!isEditing ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors"
            >
              <User size={16} />
              Editează
            </motion.button>
          ) : (
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                disabled={loading}
              >
                <X size={16} />
                Anulează
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={loading || Object.keys(errors).length > 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-400 text-white rounded-xl font-medium transition-colors"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {loading ? 'Se salvează...' : 'Salvează'}
              </motion.button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Bio Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Descriere
            </label>
            {isEditing ? (
              <textarea
                value={changes.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Scrie câteva cuvinte despre tine..."
              />
            ) : (
              <p className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {changes.bio || 'Nu ai adăugat încă o descriere'}
              </p>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {field.label}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                    <field.icon size={18} />
                  </div>
                  {isEditing ? (
                    <input
                      type={field.type}
                      value={changes[field.key as keyof typeof changes]}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border ${
                        errors[field.key] 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
                      } bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all`}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <div className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {changes[field.key as keyof typeof changes] || 'Nu este setat'}
                    </div>
                  )}
                  {errors[field.key] && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                      <AlertCircle size={14} />
                      {errors[field.key]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Locația
            </label>
            {isEditing ? (
              <input
                type="text"
                value={changes.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Orașul/Țara ta"
              />
            ) : (
              <p className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {changes.location || 'Nu este setată'}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
