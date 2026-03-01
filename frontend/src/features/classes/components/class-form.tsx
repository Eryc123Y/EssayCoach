'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { classService, rubricService } from '@/service/api/v2';
import type {
  ClassItem,
  ClassCreateInput,
  RubricListItem
} from '@/service/api/v2/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ClassFormProps {
  classId?: number;
  initialData?: ClassItem;
}

export function ClassForm({ classId, initialData }: ClassFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const [formData, setFormData] = useState<ClassCreateInput>({
    unit_id_unit: '',
    class_name: '',
    class_desc: '',
    class_join_code: '',
    class_term: 'full_year',
    class_year: new Date().getFullYear(),
    class_size: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (classId && initialData) {
        await classService.updateClass(classId, formData);
      } else {
        await classService.createClass(formData);
      }
      router.push('/dashboard/classes');
    } catch (err: any) {
      setError(err.message || 'Failed to save class');
    } finally {
      setLoading(false);
    }
  };

  const generateJoinCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCode(code);
    setFormData({ ...formData, class_join_code: code });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{classId ? 'Edit Class' : 'Create New Class'}</CardTitle>
        <CardDescription>
          {classId
            ? 'Update class details'
            : 'Create a new class for your students'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className='space-y-2'>
            <Label htmlFor='name'>Class Name *</Label>
            <Input
              id='name'
              value={formData.class_name}
              onChange={(e) =>
                setFormData({ ...formData, class_name: e.target.value })
              }
              required
              placeholder='e.g., English Composition 101'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='desc'>Description</Label>
            <Textarea
              id='desc'
              value={formData.class_desc || ''}
              onChange={(e) =>
                setFormData({ ...formData, class_desc: e.target.value })
              }
              rows={3}
              placeholder='Brief description of the class'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='unit'>Unit Code *</Label>
              <Input
                id='unit'
                value={formData.unit_id_unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit_id_unit: e.target.value })
                }
                required
                placeholder='e.g., ENG101'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='term'>Term</Label>
              <Select
                value={formData.class_term}
                onValueChange={(value) =>
                  setFormData({ ...formData, class_term: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='spring'>Spring</SelectItem>
                  <SelectItem value='summer'>Summer</SelectItem>
                  <SelectItem value='fall'>Fall</SelectItem>
                  <SelectItem value='full_year'>Full Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='year'>Year</Label>
              <Input
                id='year'
                type='number'
                value={formData.class_year || new Date().getFullYear()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    class_year: parseInt(e.target.value)
                  })
                }
                min={2020}
                max={2099}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='join-code'>Join Code (optional)</Label>
              <div className='flex gap-2'>
                <Input
                  id='join-code'
                  value={formData.class_join_code || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      class_join_code: e.target.value.toUpperCase()
                    })
                  }
                  placeholder='Auto-generated'
                  className='uppercase'
                />
                <Button
                  type='button'
                  variant='outline'
                  onClick={generateJoinCode}
                >
                  Generate
                </Button>
              </div>
              {generatedCode && (
                <p className='text-muted-foreground text-sm'>
                  Share this code with students to join the class
                </p>
              )}
            </div>
          </div>

          <div className='flex gap-4 pt-4'>
            <Button type='submit' disabled={loading}>
              {loading
                ? 'Saving...'
                : classId
                  ? 'Update Class'
                  : 'Create Class'}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/dashboard/classes')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
