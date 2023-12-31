export function getRelativeMinutesFromNow(date: Date): string {
    const formatter = new Intl.RelativeTimeFormat('en', { style: 'narrow' });

    const timeDifference = date.getTime() - new Date().getTime();
    const minutesDifference = Math.round(timeDifference / (60 * 1000));

    return formatter.format(minutesDifference, 'minute');
}