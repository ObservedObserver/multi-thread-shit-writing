const fs = require('fs');
const threads = require('worker_threads');
const stdout = require("single-line-log").stdout;

const os = require('os');

const num_of_threads = 8//os.cpus().length;

const workerPool = [];
const workerStatePool = [];

function checkEnd() {
    const isAllEnd = workerStatePool.every(w => w.isEnd);
    if (isAllEnd) {
        workerPool.forEach(w => {
            w.terminate()
        })
        console.log('all worker is clear.')
    }
}

function printProgressBar(percent) {
    const BAR_LENGTH = 30;
    let bar = '';
    for (let i = 0; i < BAR_LENGTH; i++) {
        let perIndex = i / BAR_LENGTH;
        if (percent < perIndex) {
            bar += '░'
        } else {
            bar += '█'
        }
    }
    return `[${bar}]`
}

function logState() {
    let text = '==========\n';
    for (let i = 0; i < workerStatePool.length; i++) {
        const progress = workerStatePool[i].progress;
        text += `Thread ${i + 1} is running, progress: ${Math.round(progress * 100)}%. ${printProgressBar(progress)} \n`;
    }
    stdout(text)
}

for (let i = 0; i < num_of_threads; i++) {
    const worker = new threads.Worker('./io-worker.js');
    workerPool.push(worker);
    workerStatePool.push({
        id: "thread-" + (i + 1),
        progress: 0,
        isEnd: false
    });
    worker.on('message', (msg) => {
        // console.log('ev', ev)
        if (msg.type === 'done') {
            workerStatePool[i].progress = 1;
            workerStatePool[i].isEnd = true;
        } else {
            workerStatePool[i].progress = msg.data;
        }
        logState()
        checkEnd()
    })
}


for (let i = 0; i < num_of_threads; i++) {
    workerPool[i].postMessage({
        type: 'start',
        filePath: `./ans/big_3_${i}.txt`
    });
    // stdout.clear()
}