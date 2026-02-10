'use client';

import { useEffect, useState } from 'react';
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
  fetchRubricList,
  RubricListItem,
  deleteRubric
} from '@/service/api/rubric';
import { toast } from 'sonner';
import {
  Loader2,
  Eye,
  Trash,
  ClipboardList,
  AlertCircle,
  Calendar,
  BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';
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

export default function RubricsPage() {
  const router = useRouter();
  const [rubrics, setRubrics] = useState<RubricListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rubricToDelete, setRubricToDelete] = useState<RubricListItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRubrics = async () => {
    setIsLoading(true);
    try {
      const response = await fetchRubricList();
      setRubrics(response.results);
    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        toast.error('Please login to view rubrics');
        router.push('/auth/sign-in');
      } else {
        toast.error('Failed to load rubrics: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRubrics();
  }, []);

  const handleUploadSuccess = () => {
    loadRubrics();
  };

  const handleViewRubric = (rubricId: number) => {
    router.push(`/dashboard/rubrics/${rubricId}`);
  };

  const handleDeleteClick = (rubric: RubricListItem) => {
    setRubricToDelete(rubric);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!rubricToDelete) return;

    setIsDeleting(true);
    try {
      await deleteRubric(rubricToDelete.rubric_id);
      toast.success(
        `Rubric "${rubricToDelete.rubric_desc}" deleted successfully`
      );

      setRubrics(
        rubrics.filter((r) => r.rubric_id !== rubricToDelete.rubric_id)
      );
      setDeleteDialogOpen(false);
      setRubricToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete rubric');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className='mx-auto flex w-full max-w-[1600px] flex-col gap-8 p-6 md:p-8'>
      <div className='flex flex-col gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-8 md:p-12 dark:border-slate-800 dark:bg-slate-900/50'>
        <h1 className='text-foreground text-3xl font-bold tracking-tight'>
          Rubric Library
        </h1>
        <p className='text-muted-foreground max-w-2xl text-lg'>
          Standardized grading criteria for your classes. Manage, upload, and
          organize your assessment tools.
        </p>
      </div>

      <div className='grid items-start gap-8 lg:grid-cols-12'>
        <div className='sticky top-8 lg:col-span-4 xl:col-span-3'>
          <RubricUpload onSuccess={handleUploadSuccess} />
        </div>

        <div className='lg:col-span-8 xl:col-span-9'>
          <Card className='bg-card h-full border-slate-200 shadow-sm dark:border-slate-800'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'>
                  <BookOpen className='h-5 w-5' />
                </div>
                <div>
                  <CardTitle>Your Rubrics</CardTitle>
                  <CardDescription>
                    View and manage all your uploaded rubrics
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
                </div>
              ) : rubrics.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 text-center'>
                  <div className='bg-muted/50 mb-4 rounded-full p-4'>
                    <ClipboardList className='text-muted-foreground h-8 w-8' />
                  </div>
                  <h3 className='text-foreground text-lg font-semibold'>
                    No rubrics yet
                  </h3>
                  <p className='text-muted-foreground mt-1 max-w-xs text-sm'>
                    Upload your first rubric using the form on the left to get
                    started with AI grading.
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial='hidden'
                  animate='show'
                  className='space-y-4'
                >
                  <div className='border-border/50 hidden overflow-hidden rounded-xl border md:block'>
                    <Table>
                      <TableHeader className='bg-muted/30'>
                        <TableRow className='hover:bg-transparent'>
                          <TableHead className='text-foreground font-semibold'>
                            Name
                          </TableHead>
                          <TableHead className='text-foreground font-semibold'>
                            Created
                          </TableHead>
                          <TableHead className='text-foreground text-right font-semibold'>
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rubrics.map((rubric) => (
                          <TableRow
                            key={rubric.rubric_id}
                            className='hover:bg-muted/30 transition-colors'
                          >
                            <TableCell className='text-foreground py-4 font-medium'>
                              {rubric.rubric_desc}
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
                                  <span className='sr-only'>View</span>
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => handleDeleteClick(rubric)}
                                  className='h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                                >
                                  <Trash className='h-4 w-4' />
                                  <span className='sr-only'>Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className='space-y-4 md:hidden'>
                    {rubrics.map((rubric) => (
                      <motion.div
                        key={rubric.rubric_id}
                        variants={itemVariants}
                        className='border-border/50 bg-card rounded-xl border p-4 shadow-sm'
                      >
                        <div className='mb-3 flex items-start justify-between'>
                          <div>
                            <h4 className='text-foreground line-clamp-2 font-medium'>
                              {rubric.rubric_desc}
                            </h4>
                            <div className='text-muted-foreground mt-1 flex items-center text-xs'>
                              <Calendar className='mr-1 h-3 w-3' />
                              {formatDate(rubric.rubric_create_time)}
                            </div>
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20'
                            onClick={() => handleViewRubric(rubric.rubric_id)}
                          >
                            <Eye className='mr-1 h-4 w-4' />
                            View
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            className='flex-1 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20'
                            onClick={() => handleDeleteClick(rubric)}
                          >
                            <Trash className='mr-1 h-4 w-4' />
                            Delete
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
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
              Delete Rubric
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;
              {rubricToDelete?.rubric_desc}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
