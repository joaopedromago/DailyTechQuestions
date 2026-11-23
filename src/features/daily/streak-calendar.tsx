import { useState } from 'react';
import { Platform } from 'react-native';

import { Button, ButtonText } from '@/components/shared/button';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

import {
  buildCalendarMonth,
  getCalendarDayStatus,
  localDate,
  localDayKey,
} from './daily-challenge';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const dayStyles = {
  completed: 'bg-primary',
  frozen: 'bg-secondary',
  neutral: '',
  today: 'border border-primary',
};
const dayLabels = {
  completed: 'completed',
  frozen: 'streak frozen',
  neutral: '',
  today: 'today',
};

export function StreakCalendar({
  today,
  completedDays,
}: {
  today: string;
  completedDays: string[];
}) {
  const currentMonth = today.slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>();
  const month = selectedMonth && selectedMonth < currentMonth ? selectedMonth : currentMonth;
  const date = localDate(month + '-01');
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    calendar: 'gregory',
    month: 'long',
    year: 'numeric',
  });
  const dateLabel = new Intl.DateTimeFormat(undefined, { calendar: 'gregory', dateStyle: 'full' });
  const firstCompletion = completedDays[0];
  const completedSet = new Set(completedDays);
  const cells = buildCalendarMonth(date.getFullYear(), date.getMonth());

  const moveMonth = (direction: number) => {
    const next = new Date(date.getFullYear(), date.getMonth() + direction, 1);
    setSelectedMonth(localDayKey(next).slice(0, 7));
  };

  return (
    <Box className="gap-3 rounded-2xl border border-border bg-card p-4">
      <Box className="flex-row items-center justify-between gap-2">
        <Button
          size="icon"
          variant="outline"
          accessibilityLabel="Previous month"
          onPress={() => moveMonth(-1)}
        >
          <ButtonText>‹</ButtonText>
        </Button>
        <Text role="heading" className="text-center text-base font-bold text-foreground">
          {monthLabel.format(date)}
        </Text>
        <Button
          size="icon"
          variant="outline"
          accessibilityLabel="Next month"
          isDisabled={month >= currentMonth}
          onPress={() => moveMonth(1)}
        >
          <ButtonText>›</ButtonText>
        </Button>
      </Box>
      <Box className="flex-row">
        {weekdays.map((weekday) => (
          <Text key={weekday} className="flex-1 text-center text-xs text-muted-foreground">
            {weekday}
          </Text>
        ))}
      </Box>
      {Array.from({ length: cells.length / 7 }, (_, week) => (
        <Box key={week} className="flex-row">
          {cells.slice(week * 7, week * 7 + 7).map((cell, column) => {
            if (!cell) return <Box key={column} className="flex-1" />;
            const day = localDayKey(cell);
            const status = getCalendarDayStatus(day, today, completedSet, firstCompletion);
            const description = dayLabels[status];
            const textColor =
              status === 'completed' ? 'text-primary-foreground' : 'text-foreground';

            return (
              <Box key={day} className="min-w-0 flex-1 px-0.5">
                <Box
                  role={Platform.OS === 'web' ? 'group' : undefined}
                  accessible={Platform.OS === 'web' ? undefined : true}
                  aria-label={
                    description
                      ? dateLabel.format(cell) + ', ' + description
                      : dateLabel.format(cell)
                  }
                  className={'min-h-10 items-center justify-center rounded-lg ' + dayStyles[status]}
                >
                  <Text className={'text-sm font-medium ' + textColor}>{cell.getDate()}</Text>
                  {status === 'completed' || status === 'frozen' ? (
                    <Text aria-hidden className={'text-xs leading-3 ' + textColor}>
                      {status === 'completed' ? '✓' : '❄'}
                    </Text>
                  ) : null}
                </Box>
              </Box>
            );
          })}
        </Box>
      ))}
      <Box className="flex-row flex-wrap gap-4">
        <Text className="text-xs text-muted-foreground">✓ Completed</Text>
        <Text className="text-xs text-muted-foreground">❄ Streak frozen</Text>
      </Box>
    </Box>
  );
}
