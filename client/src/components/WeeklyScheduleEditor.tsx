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

    // Find the last break's end time, or use 12:00 as default
    let suggestedStart = '12:00';
    if (daySchedule.breaks.length > 0) {
      const lastBreak = daySchedule.breaks[daySchedule.breaks.length - 1];
      suggestedStart = lastBreak.end;
    }

    // Suggest 1 hour break
    const [hours, minutes] = suggestedStart.split(':').map(Number);
    const startDate = new Date(2000, 0, 1, hours, minutes);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

    const suggestedEnd = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

    const newBreak = { start: suggestedStart, end: suggestedEnd };
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

  const validateBreaks = (breaks: Array<{ start: string; end: string }>, currentIndex?: number): string | null => {
    for (let i = 0; i < breaks.length; i++) {
      // Skip validation for the current break being edited
      if (currentIndex !== undefined && i === currentIndex) continue;

      const break1 = breaks[i];
      const [start1Hours, start1Min] = break1.start.split(':').map(Number);
      const [end1Hours, end1Min] = break1.end.split(':').map(Number);

      const start1 = start1Hours * 60 + start1Min;
      const end1 = end1Hours * 60 + end1Min;

      // Check if start is after end
      if (start1 >= end1) {
        return `La pausa ${i + 1} tiene una hora de inicio posterior o igual a la hora de fin`;
      }

      // Check for overlaps with other breaks
      for (let j = i + 1; j < breaks.length; j++) {
        if (currentIndex !== undefined && j === currentIndex) continue;

        const break2 = breaks[j];
        const [start2Hours, start2Min] = break2.start.split(':').map(Number);
        const [end2Hours, end2Min] = break2.end.split(':').map(Number);

        const start2 = start2Hours * 60 + start2Min;
        const end2 = end2Hours * 60 + end2Min;

        // Check if breaks overlap
        // Overlap exists if: start1 < end2 AND end1 > start2
        if (start1 < end2 && end1 > start2) {
          return `Las pausas ${i + 1} y ${j + 1} se solapan. Ajusta los horarios para que no se entrecrucen.`;
        }
      }
    }
    return null;
  };

  const updateBreak = (dayOfWeek: number, breakIndex: number, field: 'start' | 'end', value: string) => {
    const daySchedule = getDaySchedule(dayOfWeek);
    if (!daySchedule) return;

    const updatedBreaks = daySchedule.breaks.map((br, i) =>
      i === breakIndex ? { ...br, [field]: value } : br
    );

    // Validate before updating
    const error = validateBreaks(updatedBreaks, breakIndex);
    if (error) {
      // Show error to user - we'll use a simple alert for now
      alert(error);
      return;
    }

    updateDaySchedule(dayOfWeek, {
      breaks: updatedBreaks,
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
                <div className="ml-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
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
                          className="flex items-center gap-2 p-3 bg-muted/50 rounded-md border"
                          data-testid={`break-${day.value}-${index}`}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Label className="text-xs text-muted-foreground min-w-[40px]">
                              Inicio
                            </Label>
                            <Input
                              type="time"
                              value={breakItem.start}
                              onChange={(e) => updateBreak(day.value, index, 'start', e.target.value)}
                              className="w-32"
                              data-testid={`input-break-start-${day.value}-${index}`}
                            />
                            <span className="text-muted-foreground px-1">-</span>
                            <Label className="text-xs text-muted-foreground min-w-[30px]">
                              Fin
                            </Label>
                            <Input
                              type="time"
                              value={breakItem.end}
                              onChange={(e) => updateBreak(day.value, index, 'end', e.target.value)}
                              className="w-32"
                              data-testid={`input-break-end-${day.value}-${index}`}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBreak(day.value, index)}
                            className="shrink-0"
                            data-testid={`button-remove-break-${day.value}-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
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
