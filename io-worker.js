const threads = require("worker_threads");
const fs = require('fs')

const { parentPort } = threads;

// const WRITE_NUM = 1000;
// const STR_LEN = 1000000;

const WRITE_NUM = 100;
const STR_LEN = 1000000;
let state = {
    taskId: -1
}

function writeSingleFile(filePath) {
    for (let i = 0; i < WRITE_NUM; i++) {
        let raw = "";
        for (let j = 0; j < STR_LEN; j++) {
            raw += String.fromCharCode(Math.round(65 + 24 * Math.random()));
        }
        fs.writeFileSync(filePath, raw, {
            flag: "as",
        });
        parentPort.postMessage({
            type: 'running',
            data: i / WRITE_NUM,
            taskId: state.taskId
        })
    }
}

parentPort.on("message", (job) => {
    if (job.type === 'start') {
        state.taskId = job.taskId;
        try {
            writeSingleFile(job.filePath);
        } catch (error) {
            console.error(error)
            parentPort.postMessage({
                type: 'done',
                taskId: state.taskId
            });
        }
        parentPort.postMessage({
            type: 'done',
            taskId: state.taskId
        });
        state.taskId = -1;
    }
});


