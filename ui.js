function printProgressBar(percent) {
    const BAR_LENGTH = 30;
    let bar = "";
    for (let i = 0; i < BAR_LENGTH; i++) {
        let perIndex = i / BAR_LENGTH;
        if (percent < perIndex) {
            bar += "░";
        } else {
            bar += "█";
        }
    }
    return `[${bar}]`;
}


module.exports.printProgressBar = printProgressBar;