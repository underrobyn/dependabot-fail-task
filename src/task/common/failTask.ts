import * as tl from 'azure-pipelines-task-lib/task';
import { getRateLimitInfo, getDependabotData } from './github';
import { getRelativeMinutesFromNow } from "./utils";

export default async function failTask() {
    const apiLimit = await getRateLimitInfo();
    const limitExpires = new Date(apiLimit.reset * 1000);
    const relativeTime = getRelativeMinutesFromNow(limitExpires);

    console.log(`Rate limit for token is ${apiLimit.remaining} / ${apiLimit.limit}, resets: ${limitExpires.toISOString()} (${relativeTime})`);
    if (apiLimit.remaining < 5) {
        throw new Error('Rate limit is too low to accurately fetch data');
    }

    getDependabotData('underrobyn', 'vulnerability-testing-repo', 'critical').then((data) => {
        console.log('Dependabot data:');
        console.log(data);
        tl.debug(`${data}`);
    });
}
