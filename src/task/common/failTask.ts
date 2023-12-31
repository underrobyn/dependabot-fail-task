import * as tl from 'azure-pipelines-task-lib/task';
import { getRateLimitInfo, getDependabotData, DependabotAlert } from './github';
import { getRelativeMinutesFromNow, getApiSeverityString } from "./utils";

export default async function failTask() {
    const apiLimit = await getRateLimitInfo();
    const limitExpires = new Date(apiLimit.reset * 1000);
    const relativeTime = getRelativeMinutesFromNow(limitExpires);

    console.log(`Rate limit for token is ${apiLimit.remaining} / ${apiLimit.limit}, resets: ${limitExpires.toISOString()} (${relativeTime})`);
    if (apiLimit.remaining < 5) {
        throw new Error('Rate limit is too low to accurately fetch data');
    }

    const userSeverity = tl.getInput('failSeverity', true);

    const buildRepository = tl.getVariable('Build.Repository.Name');
    const owner = buildRepository.split('/')[0];
    const repoName = buildRepository.split('/')[1];

    const data = await getDependabotData(owner, repoName, getApiSeverityString(userSeverity));

    console.log(data);
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

        tl.setResult(tl.TaskResult.Failed, 'Dependabot alerts caused pipeline failure.');
    }

    tl.setResult(tl.TaskResult.Succeeded);
}
