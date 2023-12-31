import * as tl from 'azure-pipelines-task-lib/task';
import {Octokit} from "@octokit/core";
import {paginateRest} from "@octokit/plugin-paginate-rest";
import {createTokenAuth} from "@octokit/auth-token";

export interface DependabotAlert {
    security_advisory: {
        cve_id: string,
        ghsa_id: string,
        severity: string,
        cvss: {
            score: string
        }
    };
    html_url: string;
}

async function getGitHubInstance() {
    tl.debug('Fetching GitHub instance');

    const OktokitPaginate = Octokit.plugin(paginateRest);

    const auth = createTokenAuth(getGitHubToken());
    const authentication = await auth();

    return new OktokitPaginate({
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
        return []
    }
}

function getGitHubEndpointToken(connectionName: string): string {
    const endpoint = tl.getEndpointAuthorization(connectionName, false);

    if (!endpoint) return null;

    tl.debug("Endpoint scheme: " + endpoint.scheme);

    if (endpoint.scheme === "PersonalAccessToken") {
        return endpoint.parameters.accessToken;
    } else if (endpoint.scheme === "OAuth" || endpoint.scheme === "Token") {
        return endpoint.parameters.AccessToken;
    }

    tl.error(`Unknown scheme "${endpoint.scheme}" for GitHub Service Connection.`);

    return null;
}

function getGitHubToken() {
    let token: string = tl.getInput("githubToken");
    if (token) {
        tl.debug("User specified a token");
        return token;
    }

    const githubConnection = tl.getInput("githubServiceConnection");
    if (githubConnection) {
        tl.debug("User specified a service connection.");
        token = getGitHubEndpointToken(githubConnection);
        if (token) {
            tl.debug("Returning token from service connection");
            return token;
        }
    }

    // Check for token in environment variable if it has not been found already
    token = tl.getVariable('GITHUB_TOKEN');
    if (token) {
        tl.debug("Found token in environment variable GITHUB_TOKEN");
        return token;
    }

    throw new Error('No authentication method was supplied for the task!');
}
