'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RubricUpload } from '@/components/rubric/RubricUpload';
import { fetchRubricList, RubricListItem, deleteRubric } from '@/service/api/rubric';
import { toast } from 'sonner';
import { IconLoader2, IconEye, IconTrash, IconClipboardList, IconAlertCircle } from '@tabler/icons-react';
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
          <Card>
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
                <div className="rounded-md border">
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
