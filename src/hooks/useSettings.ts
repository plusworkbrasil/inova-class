import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface SystemSettings {
  general: {
    school_name: string;
    academic_year: string;
    language: string;
    timezone: string;
  };
  school: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    principal: string;
  };
  users: {
    auto_approve_teachers: boolean;
    require_email_verification: boolean;
    password_policy: string;
  };
  notifications: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    digest_frequency: string;
  };
  security: {
    two_factor_auth: boolean;
    session_timeout: number;
    login_attempts: number;
    audit_logs: boolean;
  };
}

export const useSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      school_name: '',
      academic_year: '',
      language: '',
      timezone: '',
    },
    school: {
      name: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      principal: '',
    },
    users: {
      auto_approve_teachers: false,
      require_email_verification: true,
      password_policy: 'medium',
    },
    notifications: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      digest_frequency: 'weekly',
    },
    security: {
      two_factor_auth: false,
      session_timeout: 30,
      login_attempts: 5,
      audit_logs: true,
    },
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('category, key, value');

      if (error) {
        console.error('Error loading settings:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao carregar configurações."
        });
        return;
      }

      // Transform flat data into nested structure
      const newSettings = { ...settings };
      
      data?.forEach((item) => {
        const category = item.category as keyof SystemSettings;
        const key = item.key;
        const value = item.value;
        
        if (newSettings[category] && typeof newSettings[category] === 'object') {
          (newSettings[category] as any)[key] = value;
        }
      });

      setSettings(newSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar configurações."
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: SystemSettings) => {
    try {
      setSaving(true);
      
      // Convert nested object to flat array for database
      const flatSettings: Array<{category: string, key: string, value: any}> = [];
      
      Object.entries(newSettings).forEach(([category, categorySettings]) => {
        Object.entries(categorySettings).forEach(([key, value]) => {
          flatSettings.push({
            category,
            key,
            value
          });
        });
      });

      // Update each setting
      for (const setting of flatSettings) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            category: setting.category,
            key: setting.key,
            value: setting.value,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'category,key'
          });

        if (error) {
          console.error('Error saving setting:', setting, error);
          throw error;
        }
      }

      setSettings(newSettings);
      toast({
        title: "Sucesso!",
        description: "Configurações salvas com sucesso."
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar configurações."
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (category: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    loading,
    saving,
    updateSettings,
    saveSettings,
    refreshSettings: loadSettings
  };
};