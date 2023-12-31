import * as tl from 'azure-pipelines-task-lib/task';
import failTask from './common/failTask';

async function run() {
    try {
        await failTask();
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();
