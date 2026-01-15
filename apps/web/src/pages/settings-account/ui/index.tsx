import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Layout, toast, Card, Button, ConfirmModal } from '@/shared/ui';
import { useUserStore } from '@/entities/user/model';
import { userApi } from '@/entities/user/api';

export function SettingsAccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await userApi.deleteAccount();
      clearUser();
      navigate('/login');
      toast.success(t('settings.account.deleted'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Layout hideBottomNav showBackButton title={t('settings.account.title')}>
      {/* User Info */}
      <section className="mb-8">
        <h3 className="section-title">{t('settings.account.info')}</h3>
        <Card>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">{t('settings.account.email')}</span>
              <span className="text-text-primary font-medium">{user?.email || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">{t('settings.account.name')}</span>
              <span className="text-text-primary font-medium">{user?.nickname || '-'}</span>
            </div>
          </div>
        </Card>
      </section>

      {/* Account Deletion */}
      <section className="mb-8">
        <h3 className="section-title">{t('settings.account.dangerZone')}</h3>
        <Card>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              {t('settings.account.description')}
            </p>
            <Button
              variant="danger"
              size="md"
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t('settings.account.delete')}
            </Button>
          </div>
        </Card>
      </section>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title={t('settings.account.delete')}
        message={t('settings.account.confirmMessage')}
        confirmText={t('settings.account.confirmDelete')}
        cancelText={t('common.cancel')}
        isLoading={isDeleting}
        variant="danger"
      />
    </Layout>
  );
}
