import { taskError } from './common/utils';
import failTask from './common/failTask';

async function run() {
    try {
        await failTask();
    } catch (err) {
        taskError(err.message);
    }
}

run();
