import * as tl from 'azure-pipelines-task-lib/task';

export function getRelativeMinutesFromNow(date: Date): string {
    const formatter = new Intl.RelativeTimeFormat('en', { style: 'narrow' });

    const timeDifference = date.getTime() - new Date().getTime();
    const minutesDifference = Math.round(timeDifference / (60 * 1000));

    return formatter.format(minutesDifference, 'minute');
}

export function getApiSeverityString(severity: string): string {
    return {
        'low': 'low,moderate,high,critical',
        'moderate': 'moderate,high,critical',
        'high': 'high,critical'
    }[severity] || 'critical';
}

export function taskError(message: string): void {
    const failOnError = tl.getBoolInput("failOnError");
    tl.debug(`failOnError: ${failOnError}`);

    const exitResult = failOnError ? tl.TaskResult.Failed : tl.TaskResult.Cancelled;

    tl.setResult(exitResult, message);
}