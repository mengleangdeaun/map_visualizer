import * as React from "react";
import { format, parse, isValid, isBefore, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

interface DateTimePickerProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder,
  disabled,
  minDate = new Date(),
  className,
}: DateTimePickerProps) {
  const { t } = useTranslation('admin');
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [time, setTime] = React.useState<string>(
    value ? format(new Date(value), "HH:mm") : "00:00"
  );

  React.useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (isValid(d)) {
        setDate(d);
        setTime(format(d, "HH:mm"));
      }
    } else {
      setDate(undefined);
    }
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange(null);
      return;
    }

    const [hours, minutes] = time.split(":").map(Number);
    const newDateTime = new Date(selectedDate);
    newDateTime.setHours(hours || 0);
    newDateTime.setMinutes(minutes || 0);
    newDateTime.setSeconds(0);
    newDateTime.setMilliseconds(0);

    setDate(newDateTime);
    onChange(newDateTime.toISOString());
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);

    if (date) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDateTime = new Date(date);
      newDateTime.setHours(hours || 0);
      newDateTime.setMinutes(minutes || 0);
      
      setDate(newDateTime);
      onChange(newDateTime.toISOString());
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal bg-background h-10",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          {date ? format(date, "PPP p") : <span>{placeholder || t('select_date_time', 'Select date & time')}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 flex flex-col sm:flex-row shadow-2xl border-primary/10" align="start">
        <div className="p-3 border-r bg-muted/5">
            <div className="flex items-center gap-2 px-2 py-2 mb-2">
                <Clock className="size-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('set_time', 'Set Time')}</span>
            </div>
            <Input
                type="time"
                value={time}
                onChange={handleTimeChange}
                className="h-9 text-xs bg-background"
            />
            <div className="mt-4 space-y-1">
                <p className="text-[9px] text-muted-foreground italic px-2">
                    {t('time_hint', '24-hour format')}
                </p>
            </div>
        </div>
        <div className="p-0">
            <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                disabled={(date) => isBefore(startOfDay(date), startOfDay(minDate))}
                initialFocus
            />
        </div>
      </PopoverContent>
    </Popover>
  );
}
