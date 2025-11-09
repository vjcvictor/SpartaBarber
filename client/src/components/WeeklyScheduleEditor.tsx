import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import type { WeeklySchedule } from '@shared/schema';

interface WeeklyScheduleEditorProps {
  value: WeeklySchedule[];
  onChange: (schedule: WeeklySchedule[]) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

export default function WeeklyScheduleEditor({ value, onChange }: WeeklyScheduleEditorProps) {
  const getDaySchedule = (dayOfWeek: number): WeeklySchedule | null => {
    return value.find(s => s.dayOfWeek === dayOfWeek) || null;
  };

  const isDayEnabled = (dayOfWeek: number): boolean => {
    return !!getDaySchedule(dayOfWeek);
  };

  const toggleDay = (dayOfWeek: number, enabled: boolean) => {
    if (enabled) {
      const newSchedule: WeeklySchedule = {
        dayOfWeek,
        start: '09:00',
        end: '17:00',
        breaks: [],
      };
      onChange([...value, newSchedule]);
    } else {
      onChange(value.filter(s => s.dayOfWeek !== dayOfWeek));
    }
  };

  const updateDaySchedule = (dayOfWeek: number, updates: Partial<WeeklySchedule>) => {
    onChange(value.map(s => 
      s.dayOfWeek === dayOfWeek ? { ...s, ...updates } : s
    ));
  };

  const addBreak = (dayOfWeek: number) => {
    const daySchedule = getDaySchedule(dayOfWeek);
    if (!daySchedule) return;

    const newBreak = { start: '12:00', end: '13:00' };
    updateDaySchedule(dayOfWeek, {
      breaks: [...daySchedule.breaks, newBreak],
    });
  };

  const removeBreak = (dayOfWeek: number, breakIndex: number) => {
    const daySchedule = getDaySchedule(dayOfWeek);
    if (!daySchedule) return;

    updateDaySchedule(dayOfWeek, {
      breaks: daySchedule.breaks.filter((_, i) => i !== breakIndex),
    });
  };

  const updateBreak = (dayOfWeek: number, breakIndex: number, field: 'start' | 'end', value: string) => {
    const daySchedule = getDaySchedule(dayOfWeek);
    if (!daySchedule) return;

    updateDaySchedule(dayOfWeek, {
      breaks: daySchedule.breaks.map((br, i) => 
        i === breakIndex ? { ...br, [field]: value } : br
      ),
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Horario Semanal</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configura los días y horarios de trabajo
          </p>
        </div>

        {DAYS_OF_WEEK.map((day) => {
          const daySchedule = getDaySchedule(day.value);
          const enabled = isDayEnabled(day.value);

          return (
            <div
              key={day.value}
              className="border rounded-lg p-4 space-y-3"
              data-testid={`schedule-day-${day.value}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={enabled}
                    onCheckedChange={(checked) => toggleDay(day.value, !!checked)}
                    data-testid={`checkbox-day-${day.value}`}
                  />
                  <Label className="text-base font-medium w-24">
                    {day.label}
                  </Label>
                </div>

                {enabled && daySchedule && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={daySchedule.start}
                      onChange={(e) => updateDaySchedule(day.value, { start: e.target.value })}
                      className="w-32"
                      data-testid={`input-start-${day.value}`}
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={daySchedule.end}
                      onChange={(e) => updateDaySchedule(day.value, { end: e.target.value })}
                      className="w-32"
                      data-testid={`input-end-${day.value}`}
                    />
                  </div>
                )}
              </div>

              {enabled && daySchedule && (
                <div className="ml-7 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">
                      Pausas
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBreak(day.value)}
                      data-testid={`button-add-break-${day.value}`}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Agregar Pausa
                    </Button>
                  </div>

                  {daySchedule.breaks.length > 0 && (
                    <div className="space-y-2">
                      {daySchedule.breaks.map((breakItem, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-muted/50 rounded"
                          data-testid={`break-${day.value}-${index}`}
                        >
                          <Input
                            type="time"
                            value={breakItem.start}
                            onChange={(e) => updateBreak(day.value, index, 'start', e.target.value)}
                            className="w-28"
                            data-testid={`input-break-start-${day.value}-${index}`}
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="time"
                            value={breakItem.end}
                            onChange={(e) => updateBreak(day.value, index, 'end', e.target.value)}
                            className="w-28"
                            data-testid={`input-break-end-${day.value}-${index}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBreak(day.value, index)}
                            data-testid={`button-remove-break-${day.value}-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
