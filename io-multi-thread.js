const fs = require('fs');
const threads = require('worker_threads');
const stdout = require("single-line-log").stdout;
const path = require('path');
const { printProgressBar } = require('./ui.js')

const os = require('os');

const WORKER_PATH = path.resolve(__dirname, './io-worker.js');
const DATA_DIR = path.resolve(__dirname, './ans');

const num_of_threads = os.cpus().length;

class WorkerPool {
    constructor () {
        this.pool = [];
        this.state = [];
        this.taskList = [];
        this.taskCount = 0;
        this.queueHead = 0;
        this.clock = -1;
        this.startTime = 0;
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR);
        }
        this.registerWorkers()
    }
    feedTasks (size) {
        for (let i = 0; i < size; i++) {
            const filePath = path.resolve(DATA_DIR, `./data_task_${i}.txt`);
            this.taskList.push({ type: "start", taskId: this.taskCount, progress: 0, finish: false, filePath });
            this.taskCount++;
        }
    }
    runTaskInWorker (worker, task) {
        worker.postMessage(task);
    }
    runTaskIfExistsFreeThread () {
        if (this.queueHead === this.taskList.length) return;
        for (let i = 0; i < this.state.length; i++) {
            const workerState = this.state[i];
            if (workerState.free && this.queueHead < this.taskList.length) {
                const task = this.taskList[this.queueHead++];
                workerState.free = false;
                this.runTaskInWorker(this.pool[i], task);
            }
        }
    }
    log () {
        const { taskList } = this;
        let text = `==========[${this.startTime}s]\n`;
        for (let i = 0; i < taskList.length; i++) {
            const progress = taskList[i].progress;
            text += `Task ${i + 1}, progress: ${Math.round(
                progress * 100
            )}%. ${printProgressBar(progress)} \n`;
        }
        stdout(text);
    }
    registerWorkers () {
        const { pool, state, taskList } = this;
        for (let i = 0; i < num_of_threads; i++) {
            const worker = new threads.Worker("./io-worker.js");
            pool.push(worker);
            state.push({
                id: "thread-" + (i + 1),
                free: true,
            });
            worker.on("message", (msg) => {
                const { taskId } = msg;
                if (msg.type === "done") {
                    taskList[taskId].progress = 1;
                    taskList[taskId].finish = true;
                    state[i].free = true
                } else {
                    taskList[taskId].progress = msg.data;
                }
            });
        }
    }
    checkEnd() {
        if (this.queueHead < this.taskList.length) return;
        const isAllEnd = this.state.every((w) => w.free);
        if (isAllEnd) {
            this.pool.forEach((w) => {
                w.terminate();
            });
            console.log("all worker is clear.");
            clearInterval(this.clock);
        }
    }
    start () {
        this.clock = setInterval(() => {
            this.runTaskIfExistsFreeThread();
            this.startTime += 0.5;
            this.log();
            this.checkEnd();
        }, 500)
    }
}

const pool = new WorkerPool();

pool.feedTasks(20);
pool.start();