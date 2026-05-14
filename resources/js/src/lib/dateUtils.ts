export const formatDateTime = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(d).replace(',', '');
};

export const formatForDateTimeLocal = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const pad = (num: number) => String(num).padStart(2, '0');
    
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const nowForDateTimeLocal = (): string => {
    return formatForDateTimeLocal(new Date());
};
