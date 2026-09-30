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
import { localized } from '@/locales';

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
      if (active) setError(localized(locale, 'ui.couldNotLoadAvailableCoursesRefreshAndTry'));
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
      setError(err instanceof Error ? err.message : (localized(locale, 'ui.failedToSaveClass')));
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
        <CardTitle>{classId ? (localized(locale, 'ui.editClass')) : (localized(locale, 'ui.createClassa388b8'))}</CardTitle>
        <CardDescription>
          {classId ? (localized(locale, 'ui.updateClassDetails')) : (localized(locale, 'ui.createATeachingClassForACourse'))}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" role='alert'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!classId && !unitsLoading && units.length === 0 && !error && <Alert><AlertDescription>{localized(locale, 'ui.youHaveNoCoursesAvailableForClassCreation')}</AlertDescription></Alert>}

          <div className="space-y-2">
            <Label htmlFor="name">{localized(locale, 'ui.className840bf2')}</Label>
            <Input
              id="name"
              value={formData.class_name}
              onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
              required
              maxLength={100}
              placeholder={localized(locale, 'ui.eGAcademicWritingA')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">{localized(locale, 'ui.description644c26')}</Label>
            <Textarea
              id="desc"
              value={formData.class_desc || ''}
              onChange={(e) => setFormData({ ...formData, class_desc: e.target.value })}
              rows={3}
              placeholder={localized(locale, 'ui.brieflyDescribeTheClass')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit">{localized(locale, 'ui.course8e191a')}</Label>
              {classId ? <Input id='unit' value={formData.unit_id_unit} disabled /> : <Select value={formData.unit_id_unit} onValueChange={(value) => setFormData({ ...formData, unit_id_unit: value })} disabled={unitsLoading || units.length === 0}>
                <SelectTrigger id='unit'><SelectValue placeholder={unitsLoading ? (localized(locale, 'ui.loadingd1185a')) : (localized(locale, 'ui.selectACourse'))} /></SelectTrigger>
                <SelectContent>{units.map((unit) => <SelectItem key={unit.unit_id} value={unit.unit_id}>{unit.unit_id} · {unit.unit_name}</SelectItem>)}</SelectContent>
              </Select>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">{localized(locale, 'ui.term743be0')}</Label>
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
              <Label htmlFor="year">{localized(locale, 'ui.year')}</Label>
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
              <Label htmlFor="join-code">{localized(locale, 'ui.joinCodeOptional')}</Label>
              <div className="flex gap-2">
                <Input
                  id="join-code"
                  value={formData.class_join_code || ''}
                  onChange={(e) => setFormData({ ...formData, class_join_code: e.target.value.toUpperCase() })}
                  placeholder={localized(locale, 'ui.generatedIfBlank')}
                  maxLength={10}
                  className="uppercase"
                />
                <Button type="button" variant="outline" onClick={generateJoinCode}>
                  {localized(locale, 'ui.generate')}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading || (!classId && (unitsLoading || !formData.unit_id_unit))}>
              {loading ? (localized(locale, 'ui.saving83ad29')) : classId ? (localized(locale, 'ui.saveChanges')) : (localized(locale, 'ui.createClass'))}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/classes')}>
              {localized(locale, 'community.cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
