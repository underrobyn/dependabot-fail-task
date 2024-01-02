import * as tl from 'azure-pipelines-task-lib/task';
import { getRateLimitInfo, getDependabotData, DependabotAlert } from './github';
import { getRelativeMinutesFromNow, getApiSeverityString, taskError } from "./utils";

export default async function failTask() {
    const apiLimit = await getRateLimitInfo();
    const limitExpires = new Date(apiLimit.reset * 1000);
    const relativeTime = getRelativeMinutesFromNow(limitExpires);

    console.log(`Rate limit for token is ${apiLimit.remaining} / ${apiLimit.limit}, resets: ${limitExpires.toISOString()} (${relativeTime})`);
    if (apiLimit.remaining < 5) {
        taskError(`Rate limit for GitHub connection is too low (${apiLimit.remaining / apiLimit.limit})! Resets ${relativeTime}`);
        return;
    }

    const userSeverity = tl.getInput('failSeverity', true);

    const buildRepository = tl.getVariable('Build.Repository.Name');
    const owner = buildRepository.split('/')[0];
    const repoName = buildRepository.split('/')[1];

    const data = await getDependabotData(owner, repoName, getApiSeverityString(userSeverity));
    tl.debug(`${data}`);

    if (data.length > 0) {
        console.log('Pipeline failed due to the following Dependabot Alerts being open.');
        data.forEach(function(alert: DependabotAlert) {
            let cveId = alert?.security_advisory?.cve_id || 'No CVE';
            let ghsaId = alert?.security_advisory?.ghsa_id || 'No GHSA';
            let severity = alert?.security_advisory?.severity || 'Unknown Severity';
            let cvssScore = alert?.security_advisory?.cvss?.score || 'Unknown CVSS score';
            let alertURL = alert?.html_url || 'to view alert, visit repository Security tab.';

            let identifier = `${cveId} / ${ghsaId} (${severity} - ${cvssScore})\n\t${alertURL}`;

            console.log(identifier);
        });

        // If in audit mode then we will succeed with issues, else we fail the task to halt the pipeline.
        const auditMode = tl.getBoolInput('auditMode');
        const taskResult = auditMode ? tl.TaskResult.Failed : tl.TaskResult.SucceededWithIssues;

        return tl.setResult(taskResult, 'Dependabot alerts caused pipeline failure.');
    }

    // If there are no issues the pipeline may continue
    tl.setResult(tl.TaskResult.Succeeded);
}
