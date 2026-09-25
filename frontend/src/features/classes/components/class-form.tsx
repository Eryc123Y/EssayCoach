'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classService } from '@/service/api/v2';
import type { ClassItem, ClassCreateInput, ClassCreatableUnit } from '@/service/api/v2/types';
import { usePreferences } from '@/components/layout/preference-provider';
import { classTermLabel } from './class-labels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ClassFormProps {
  classId?: number;
  initialData?: ClassItem;
}

export function ClassForm({ classId, initialData }: ClassFormProps) {
  const router = useRouter();
  const { locale } = usePreferences();
  const zh = locale === 'zh';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<ClassCreatableUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(!initialData);
  
  const [formData, setFormData] = useState<ClassCreateInput>({
    unit_id_unit: initialData?.unit_id_unit ?? '',
    class_name: initialData?.class_name ?? '',
    class_desc: initialData?.class_desc ?? '',
    class_join_code: initialData?.class_join_code ?? '',
    class_term: initialData?.class_term ?? 'full_year',
    class_year: initialData?.class_year ?? new Date().getFullYear(),
  });

  useEffect(() => {
    if (initialData) return;
    let active = true;
    classService.listCreatableUnits().then((list) => {
      if (!active) return;
      setUnits(list);
      setFormData((current) => ({ ...current, unit_id_unit: current.unit_id_unit || list[0]?.unit_id || '' }));
    }).catch(() => {
      if (active) setError(zh ? '无法加载可选课程，请刷新页面重试。' : 'Could not load available courses. Refresh and try again.');
    }).finally(() => { if (active) setUnitsLoading(false); });
    return () => { active = false; };
  }, [initialData, zh]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : (zh ? '保存班级失败。' : 'Failed to save class.'));
    } finally {
      setLoading(false);
    }
  };

  const generateJoinCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    const code = Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
    setFormData({ ...formData, class_join_code: code });
  };

  return (
    <Card className='mx-auto max-w-3xl'>
      <CardHeader>
        <CardTitle>{classId ? (zh ? '编辑班级' : 'Edit class') : (zh ? '新建班级' : 'Create class')}</CardTitle>
        <CardDescription>
          {classId ? (zh ? '更新班级资料' : 'Update class details') : (zh ? '为课程建立教学班级' : 'Create a teaching class for a course')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" role='alert'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!classId && !unitsLoading && units.length === 0 && !error && <Alert><AlertDescription>{zh ? '你尚无可创建班级的课程，请联系管理员分配课程负责人。' : 'You have no courses available for class creation. Ask an admin to assign you as course lead.'}</AlertDescription></Alert>}

          <div className="space-y-2">
            <Label htmlFor="name">{zh ? '班级名称 *' : 'Class name *'}</Label>
            <Input
              id="name"
              value={formData.class_name}
              onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
              required
              maxLength={100}
              placeholder={zh ? '例如：学术写作 A 班' : 'e.g. Academic Writing A'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">{zh ? '描述' : 'Description'}</Label>
            <Textarea
              id="desc"
              value={formData.class_desc || ''}
              onChange={(e) => setFormData({ ...formData, class_desc: e.target.value })}
              rows={3}
              placeholder={zh ? '简要介绍教学安排' : 'Briefly describe the class'}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit">{zh ? '课程 *' : 'Course *'}</Label>
              {classId ? <Input id='unit' value={formData.unit_id_unit} disabled /> : <Select value={formData.unit_id_unit} onValueChange={(value) => setFormData({ ...formData, unit_id_unit: value })} disabled={unitsLoading || units.length === 0}>
                <SelectTrigger id='unit'><SelectValue placeholder={unitsLoading ? (zh ? '加载中…' : 'Loading…') : (zh ? '选择课程' : 'Select a course')} /></SelectTrigger>
                <SelectContent>{units.map((unit) => <SelectItem key={unit.unit_id} value={unit.unit_id}>{unit.unit_id} · {unit.unit_name}</SelectItem>)}</SelectContent>
              </Select>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">{zh ? '学期' : 'Term'}</Label>
              <Select
                value={formData.class_term}
                onValueChange={(value) => setFormData({ ...formData, class_term: value })}
              >
                <SelectTrigger id='term'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['semester1', 'semester2', 'term1', 'term2', 'full_year'].map((term) => <SelectItem key={term} value={term}>{classTermLabel(term, locale)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="year">{zh ? '年份' : 'Year'}</Label>
              <Input
                id="year"
                type="number"
                value={formData.class_year || new Date().getFullYear()}
                onChange={(e) => setFormData({ ...formData, class_year: parseInt(e.target.value) })}
                min={2000}
                max={2100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="join-code">{zh ? '加入代码（可选）' : 'Join code (optional)'}</Label>
              <div className="flex gap-2">
                <Input
                  id="join-code"
                  value={formData.class_join_code || ''}
                  onChange={(e) => setFormData({ ...formData, class_join_code: e.target.value.toUpperCase() })}
                  placeholder={zh ? '留空则自动生成' : 'Generated if blank'}
                  maxLength={10}
                  className="uppercase"
                />
                <Button type="button" variant="outline" onClick={generateJoinCode}>
                  {zh ? '生成' : 'Generate'}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading || (!classId && (unitsLoading || !formData.unit_id_unit))}>
              {loading ? (zh ? '保存中…' : 'Saving…') : classId ? (zh ? '保存更改' : 'Save changes') : (zh ? '创建班级' : 'Create class')}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/classes')}>
              {zh ? '取消' : 'Cancel'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
