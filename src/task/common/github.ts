import * as tl from 'azure-pipelines-task-lib/task';
import {Octokit} from "@octokit/rest";
import {createTokenAuth} from "@octokit/auth-token";

async function getGitHubInstance() {
    const auth = createTokenAuth('');
    const authentication = await auth();

    return new Octokit({
        auth: authentication.token,
    });
}

export async function getRateLimitInfo() {
    const octokit = await getGitHubInstance();

    let rateLimit = {
        limit: 5000,
        remaining: 5000,
        reset: 0
    }

    try {
        // Fetch the rate limit information
        const response = await octokit.request('GET /rate_limit');

        rateLimit = {
            limit: response.data.resources.core.limit,
            remaining: response.data.resources.core.remaining,
            reset: response.data.resources.core.reset,
        };

        tl.debug(`Rate Limit: ${rateLimit}`);
    } catch (error) {
        tl.warning(`Warning! Failed to fetch API rate limit: ${error.message}`);
    }

    return rateLimit;
}

export async function getDependabotData(owner: string, repoName: string, severity: string) {
    tl.debug(`Connecting to GitHub API to get alerts for ${owner}/${repoName}`);
    let gh = await getGitHubInstance();

    let params = {
        state: 'open',
        severity,
        per_page: 100
    };
    tl.debug(`${params}`);

    try {
        const response = await gh.paginate(
            `GET /repos/${owner}/${repoName}/dependabot/alerts`,
            params
        );
        tl.debug(`Got API response: (${response.length} alerts)`);

        return response;
    } catch (error) {
        tl.error(`Error: ${error.message}`);
        tl.setResult(tl.TaskResult.Failed, `Failed to get GitHub API data: ${error.message}`);
        return {}
    }
}
