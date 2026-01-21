'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RubricUpload } from '@/components/rubric/RubricUpload';
import { fetchRubricList, RubricListItem, deleteRubric } from '@/service/api/rubric';
import { toast } from 'sonner';
import { IconLoader2, IconEye, IconTrash, IconClipboardList, IconAlertCircle, IconCalendar } from '@tabler/icons-react';
import { motion } from 'motion/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function RubricsPage() {
  const router = useRouter();
  const [rubrics, setRubrics] = useState<RubricListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rubricToDelete, setRubricToDelete] = useState<RubricListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRubrics = async () => {
    setIsLoading(true);
    try {
      const response = await fetchRubricList();
      setRubrics(response.results);
    } catch (error: any) {
      console.error('Failed to load rubrics:', error);
      toast.error('Failed to load rubrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRubrics();
  }, []);

  const handleUploadSuccess = () => {
    // Reload rubrics list after successful upload
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
      toast.success(`Rubric "${rubricToDelete.rubric_desc}" deleted successfully`);
      
      // Remove from list
      setRubrics(rubrics.filter(r => r.rubric_id !== rubricToDelete.rubric_id));
      setDeleteDialogOpen(false);
      setRubricToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete rubric:', error);
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
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rubrics</h1>
          <p className="text-muted-foreground">
            Manage your grading rubrics and upload new ones
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RubricUpload onSuccess={handleUploadSuccess} />
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Your Rubrics</CardTitle>
              <CardDescription>
                View and manage all your uploaded rubrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : rubrics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <IconClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No rubrics yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your first rubric to get started
                  </p>
                </div>
              ) : (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {/* Desktop View: Table */}
                  <div className="hidden rounded-md border md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rubrics.map((rubric) => (
                          <TableRow key={rubric.rubric_id}>
                            <TableCell className="font-medium">
                              {rubric.rubric_desc}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(rubric.rubric_create_time)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewRubric(rubric.rubric_id)}
                                >
                                  <IconEye className="mr-1 h-4 w-4" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClick(rubric)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <IconTrash className="mr-1 h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile View: Cards */}
                  <div className="space-y-4 md:hidden">
                    {rubrics.map((rubric) => (
                      <motion.div
                        key={rubric.rubric_id}
                        variants={itemVariants}
                        className="rounded-lg border bg-card p-4 shadow-sm"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <h4 className="font-medium line-clamp-2">{rubric.rubric_desc}</h4>
                            <div className="mt-1 flex items-center text-xs text-muted-foreground">
                              <IconCalendar className="mr-1 h-3 w-3" />
                              {formatDate(rubric.rubric_create_time)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleViewRubric(rubric.rubric_id)}
                          >
                            <IconEye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(rubric)}
                          >
                            <IconTrash className="mr-1 h-4 w-4" />
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
            <AlertDialogTitle className="flex items-center gap-2">
              <IconAlertCircle className="h-5 w-5 text-destructive" />
              Delete Rubric
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{rubricToDelete?.rubric_desc}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
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
