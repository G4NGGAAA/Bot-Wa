import colors from './colors.js';

export const logHeader = (title) => {
    console.log(`\n${colors.bright}${colors.green}========================================${colors.reset}`);
    console.log(`${colors.bright}${colors.green}        ${title}        ${colors.reset}`);
    console.log(`${colors.bright}${colors.green}========================================${colors.reset}`);
};

export const logFooter = () => {
    console.log(`${colors.bright}${colors.green}========================================${colors.reset}\n`);
};

export const logIncomingMessage = (logSender, logType, messageBody, isGroup) => {
    const groupStatus = isGroup ? `${colors.success}Ya` : `${colors.error}Tidak`;
    console.log(`${colors.info}[PESAN] Dari: ${logSender} | Tipe: ${logType}`);
    console.log(`${colors.info}[PESAN] Grup: ${groupStatus}`);
    console.log(`${colors.gray}[BODY] "${messageBody}"${colors.reset}`);
};

export const logNonCommand = (messageBody) => {
    console.log(`${colors.bright}${colors.gray}[INFO] Pesan bukan perintah: "${messageBody}"${colors.reset}`);
};

export const logCommandDetection = (command, args) => {
    console.log(`${colors.bright}${colors.magenta}[PERINTAH] Terdeteksi: "${command}" | Argumen: "${args}"${colors.reset}`);
};

export const logCommandStatus = (status, command) => {
    let logMessage;
    switch (status) {
        case 'running':
            logMessage = `${colors.bright}${colors.yellow}[STATUS] Menjalankan plugin untuk perintah: "${command}"${colors.reset}`;
            break;
        case 'success':
            logMessage = `${colors.success}[EKSEKUSI] Perintah "${command}" berhasil dieksekusi.${colors.reset}`;
            break;
        case 'notfound':
            logMessage = `${colors.bright}${colors.red}[PERINTAH] Perintah "${command}" tidak ditemukan.${colors.reset}`;
            break;
        default:
            logMessage = '';
    }
    console.log(logMessage);
};

export const logWarning = (message) => {
    console.log(`${colors.warning}[PERINGATAN] ${message}${colors.reset}`);
};

export const logError = (message, error) => {
    console.error(`${colors.error}[ERROR] ${message}`, error, colors.reset);
};

export const logLimitInfo = (message) => {
    console.log(`${colors.info}[LIMIT] ${message}${colors.reset}`);
};

export const logLimitBlocked = (message) => {
    console.log(`${colors.warning}[LIMIT] ${message}${colors.reset}`);
};
