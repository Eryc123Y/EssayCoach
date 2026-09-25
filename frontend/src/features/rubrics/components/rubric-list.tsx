'use client';

import { localized } from '@/locales';

import { useState, useEffect } from 'react';
import { usePreferences } from '@/components/layout/preference-provider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { RubricUpload } from '@/components/rubric/RubricUpload';
import {
  RubricListItem,
  deleteRubric,
  toggleRubricVisibility
} from '@/service/api/rubric';
import { rubricActionsService } from '@/service/api/v2/rubrics';
import { toast } from 'sonner';
import {
  Loader2,
  Eye,
  Trash,
  ClipboardList,
  AlertCircle,
  Calendar,
  BookOpen,
  Globe,
  Lock,
  Copy,
  Plus
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { AnimatedTableWrapper } from '@/components/ui/animated-table-wrapper';
import { VisibilityBadge } from '@/features/rubrics/components/visibility-toggle';
import { cn } from '@/lib/utils';

interface RubricsClientProps {
  initialRubrics: RubricListItem[];
  userRole: 'student' | 'lecturer' | 'admin';
  userId: number;
}

type FilterType = 'all' | 'my' | 'public';

export function RubricsClient({
  initialRubrics,
  userRole,
  userId
}: RubricsClientProps) {
  const router = useRouter();
  const { locale } = usePreferences();
  const t = (en: string, zh?: string) => localized(locale, en, zh);
  const [rubrics, setRubrics] = useState<RubricListItem[]>(initialRubrics);
  useEffect(() => setRubrics(initialRubrics), [initialRubrics]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rubricToDelete, setRubricToDelete] = useState<RubricListItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [visibilityTogglingId, setVisibilityTogglingId] = useState<number | null>(
    null
  );
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

  const handleUploadSuccess = () => {
    router.refresh();
  };

  const handleViewRubric = (rubricId: number) => {
    router.push(`/dashboard/rubrics/${rubricId}`);
  };

  const handleDeleteClick = (rubric: RubricListItem) => {
    setRubricToDelete(rubric);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {    if (!rubricToDelete) return;

    setIsDeleting(true);
    try {
      await deleteRubric(rubricToDelete.rubric_id);
      toast.success(t(`Rubric "${rubricToDelete.rubric_desc}" deleted`, `已删除量表“${rubricToDelete.rubric_desc}”`));

      setRubrics((prev) =>
        prev.filter((r) => r.rubric_id !== rubricToDelete.rubric_id)
      );
      setDeleteDialogOpen(false);
      setRubricToDelete(null);
    } catch (error: any) {
      toast.error(error.message || t('ui.couldNotDeleteRubric'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (rubric: RubricListItem) => {
    setDuplicatingId(rubric.rubric_id);
    try {
      await rubricActionsService.duplicateRubric(rubric.rubric_id, {});
      toast.success(t(`Rubric "${rubric.rubric_desc}" duplicated`, `已复制量表“${rubric.rubric_desc}”`));
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || t('ui.couldNotDuplicateRubric'));
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleToggleVisibility = async (
    rubricId: number,
    currentVisibility: 'public' | 'private'
  ) => {
    const newVisibility: 'public' | 'private' =
      currentVisibility === 'public' ? 'private' : 'public';

    setVisibilityTogglingId(rubricId);

    try {
      await toggleRubricVisibility(rubricId, newVisibility);

      // Update local state
      setRubrics((prev) =>
        prev.map((rubric) =>
          rubric.rubric_id === rubricId
            ? { ...rubric, visibility: newVisibility }
            : rubric
        )
      );

      toast.success(t(`Rubric is now ${newVisibility}`, newVisibility === 'public' ? '量表已公开' : '量表已设为私有'));
    } catch (error: any) {
      toast.error(error.message || t('ui.couldNotUpdateVisibility'));
    } finally {
      setVisibilityTogglingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter rubrics based on selected filter
  const filteredRubrics = (() => {
    switch (filter) {
      case 'public':
        return rubrics.filter((r) => r.visibility === 'public');
      case 'my':
        return rubrics.filter((r) => r.user_id_user === userId);
      case 'all':
      default:
        // Show all rubrics accessible to the user (own + public)
        return rubrics;
    }
  })();

  // Can user create public rubrics? (lecturers and admins only)
  const canCreatePublic = userRole === 'lecturer' || userRole === 'admin';

  return (
    <div className='mx-auto flex w-full max-w-[1600px] flex-col gap-8 p-6 md:p-8'>
      <div className='flex flex-col gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-8 md:p-12 dark:border-slate-800 dark:bg-slate-900/50'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <h1 className='text-foreground text-3xl font-bold tracking-tight'>
              {t('ui.rubricLibrary743df9')}
            </h1>
            <p className='text-muted-foreground max-w-2xl text-lg'>
              {userRole === 'student'
                ? t('ui.explorePublicRubricsAndBuildAPrivateStudyGuide')
                : t('ui.manageGradingCriteriaForYourClasses')}
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard/rubrics/new')}><Plus size={16} /> {t('ui.createRubric')}</Button>
        </div>
      </div>

      <div className='grid items-start gap-8 lg:grid-cols-12'>
        {/* Upload section - only for lecturers and admins */}
        {canCreatePublic && (
          <div className='sticky top-8 lg:col-span-4 xl:col-span-3'>
            <RubricUpload onSuccess={handleUploadSuccess} />
          </div>
        )}

        {/* Rubrics list */}
        <div
          className={cn(
            canCreatePublic ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'
          )}
        >
          <Card className='bg-card h-full border-slate-200 shadow-sm dark:border-slate-800'>
            <CardHeader>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'>
                    <BookOpen className='h-5 w-5' />
                  </div>
                  <div>
                    <CardTitle>
                      {filter === 'public' ? t('ui.publicRubrics') : filter === 'my' ? t('ui.myRubrics') : t('ui.allRubrics')}
                    </CardTitle>
                    <CardDescription>
                      {filter === 'public'
                        ? t('ui.rubricsSharedWithEveryone')
                        : filter === 'my'
                        ? t('ui.yourPersonalRubrics')
                        : t('ui.viewAndManageAllYourRubrics')}
                    </CardDescription>
                  </div>
                </div>

                {/* Every role can browse public and personally owned rubrics. */}
                {(
                  <div className='flex items-center gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800'>
                    <Button
                      variant={filter === 'all' ? 'default' : 'ghost'}
                      size='sm'
                      onClick={() => setFilter('all')}
                      className='h-8 text-xs'
                    >
                      <BookOpen className='mr-1 h-3.5 w-3.5' />
                      {t('ui.all')}
                    </Button>
                    <Button
                      variant={filter === 'my' ? 'default' : 'ghost'}
                      size='sm'
                      onClick={() => setFilter('my')}
                      className='h-8 text-xs'
                    >
                      <Lock className='mr-1 h-3.5 w-3.5' />
                      {t('ui.myRubrics')}
                    </Button>
                    <Button
                      variant={filter === 'public' ? 'default' : 'ghost'}
                      size='sm'
                      onClick={() => setFilter('public')}
                      className='h-8 text-xs'
                    >
                      <Globe className='mr-1 h-3.5 w-3.5' />
                      {t('ui.public')}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredRubrics.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 text-center'>
                  <div className='bg-muted/50 mb-4 rounded-full p-4'>
                    <ClipboardList className='text-muted-foreground h-8 w-8' />
                  </div>
                  <h3 className='text-foreground text-lg font-semibold'>
                    {filter === 'public'
                      ? t('ui.noPublicRubricsYet')
                      : filter === 'my'
                      ? t('ui.noRubricsYet')
                      : t('ui.noRubricsYet')}
                  </h3>
                  <p className='text-muted-foreground mt-1 max-w-xs text-sm'>
                    {userRole === 'student'
                      ? filter === 'public' ? t('ui.yourLecturerHasNotSharedAnyRubricsYet') : t('ui.createAPrivateRubricOrBrowseSharedOnes')
                      : filter === 'public'
                      ? t('ui.shareYourFirstRubricToMakeItAvailableToStudents')
                      : t('ui.uploadYourFirstRubricToGetStarted')}
                  </p>
                </div>
              ) : (
                <AnimatedTableWrapper>
                  <div className='border-border/50 hidden overflow-hidden rounded-xl border md:block'>
                    <Table>
                      <TableHeader className='bg-muted/30'>
                        <TableRow className='hover:bg-transparent'>
                          <TableHead className='text-foreground font-semibold'>
                            {t('ui.name72219d')}
                          </TableHead>
                          <TableHead className='text-foreground font-semibold'>
                            {t('ui.visibility')}
                          </TableHead>
                          <TableHead className='text-foreground font-semibold'>
                            {t('ui.createdd2c502')}
                          </TableHead>
                          <TableHead className='text-foreground text-right font-semibold'>
                            {t('ui.actions')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRubrics.map((rubric) => (
                          <TableRow
                            key={rubric.rubric_id}
                            className='hover:bg-muted/30 transition-colors'
                          >
                            <TableCell className='text-foreground py-4 font-medium'>
                              {rubric.rubric_desc}
                            </TableCell>
                            <TableCell>
                              <VisibilityBadge
                                visibility={rubric.visibility || 'private'}
                              />
                            </TableCell>
                            <TableCell className='text-muted-foreground text-sm'>
                              {formatDate(rubric.rubric_create_time)}
                            </TableCell>
                            <TableCell className='text-right'>
                              <div className='flex justify-end gap-2'>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() =>
                                    handleViewRubric(rubric.rubric_id)
                                  }
                                  className='h-8 w-8 p-0 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400'
                                >
                                  <Eye className='h-4 w-4' />
                                  <span className='sr-only'>{t('ui.view')}</span>
                                </Button>
                                {(
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => handleDuplicate(rubric)}
                                    disabled={duplicatingId === rubric.rubric_id}
                                    className='h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
                                  >
                                    {duplicatingId === rubric.rubric_id ? (
                                      <Loader2 className='h-4 w-4 animate-spin' />
                                    ) : (
                                      <Copy className='h-4 w-4' />
                                    )}
                                    <span className='sr-only'>{t('ui.duplicate')}</span>
                                  </Button>
                                )}
                                {(userRole === 'admin' || (userRole !== 'student' && rubric.user_id_user === userId)) && (
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() =>
                                      handleToggleVisibility(
                                        rubric.rubric_id,
                                        rubric.visibility || 'private'
                                      )
                                    }
                                    disabled={visibilityTogglingId === rubric.rubric_id}
                                    className='h-8 w-8 p-0 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20 dark:hover:text-amber-400'
                                  >
                                    {visibilityTogglingId === rubric.rubric_id ? (
                                      <Loader2 className='h-4 w-4 animate-spin' />
                                    ) : rubric.visibility === 'public' ? (
                                      <Lock className='h-4 w-4' />
                                    ) : (
                                      <Globe className='h-4 w-4' />
                                    )}
                                    <span className='sr-only'>
                                      {t('ui.toggleVisibility')}
                                    </span>
                                  </Button>
                                )}
                                {(userRole === 'admin' || rubric.user_id_user === userId) && <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => handleDeleteClick(rubric)}
                                  className='h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                                >
                                  <Trash className='h-4 w-4' />
                                  <span className='sr-only'>{t('ui.delete')}</span>
                                </Button>}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile view */}
                  <div className='space-y-4 md:hidden'>
                    {filteredRubrics.map((rubric) => (
                      <div
                        key={rubric.rubric_id}
                        className='border-border/50 bg-card rounded-xl border p-4 shadow-sm'
                      >
                        <div className='mb-3 flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-2'>
                              <VisibilityBadge
                                visibility={rubric.visibility || 'private'}
                              />
                            </div>
                            <h4 className='text-foreground line-clamp-2 font-medium'>
                              {rubric.rubric_desc}
                            </h4>
                            <div className='text-muted-foreground mt-1 flex items-center text-xs'>
                              <Calendar className='mr-1 h-3 w-3' />
                              {formatDate(rubric.rubric_create_time)}
                            </div>
                          </div>
                        </div>
                        <div className='flex flex-wrap gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20'
                            onClick={() => handleViewRubric(rubric.rubric_id)}
                          >
                            <Eye className='mr-1 h-4 w-4' />
                            {t('ui.view')}
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            className='flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20'
                            onClick={() => handleDuplicate(rubric)}
                            disabled={duplicatingId === rubric.rubric_id}
                          >
                            {duplicatingId === rubric.rubric_id ? <Loader2 className='mr-1 h-4 w-4 animate-spin' /> : <Copy className='mr-1 h-4 w-4' />}
                            {t('ui.copy')}
                          </Button>
                          {(userRole === 'admin' || (userRole !== 'student' && rubric.user_id_user === userId)) && (
                            <Button
                              variant='outline'
                              size='sm'
                              className='flex-1 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20'
                              onClick={() =>
                                handleToggleVisibility(
                                  rubric.rubric_id,
                                  rubric.visibility || 'private'
                                )
                              }
                              disabled={visibilityTogglingId === rubric.rubric_id}
                            >
                              {visibilityTogglingId === rubric.rubric_id ? (
                                <Loader2 className='mr-1 h-4 w-4 animate-spin' />
                              ) : rubric.visibility === 'public' ? (
                                <Lock className='mr-1 h-4 w-4' />
                              ) : (
                                <Globe className='mr-1 h-4 w-4' />
                              )}
                              {rubric.visibility === 'public' ? t('ui.makePrivate') : t('ui.makePublic')}
                            </Button>
                          )}
                          {(userRole === 'admin' || rubric.user_id_user === userId) && <Button
                            variant='outline'
                            size='sm'
                            className='flex-1 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20'
                            onClick={() => handleDeleteClick(rubric)}
                          >
                            <Trash className='mr-1 h-4 w-4' />
                            {t('ui.delete')}
                          </Button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </AnimatedTableWrapper>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-destructive flex items-center gap-2'>
              <AlertCircle className='h-5 w-5' />
              {t('ui.deleteRubric')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(`Delete "${rubricToDelete?.rubric_desc}"? This cannot be undone.`, `确定删除“${rubricToDelete?.rubric_desc}”吗？此操作无法撤销。`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('ui.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t('ui.deleting')}
                </>
              ) : (
                t('ui.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
