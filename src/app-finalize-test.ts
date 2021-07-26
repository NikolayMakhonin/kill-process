import {killManyOutside} from './killManyOutside'
import {createLogErrorToFile} from './logErrorToFile'
// import readline from 'readline'

setTimeout(() => {
	// to prevent auto close process
}, 30000)

const appLogFilePath = process.argv[2]
const logFilePath = process.argv[3]
const command = process.argv[4]
const logError = createLogErrorToFile(appLogFilePath)

function finalize() {
	// logError('finalize')
	try {
		killManyOutside({
			description: 'TestDescription',
			stages     : [
				{timeout: 1000},
				{signals: [0], timeout: 1000},
				{signals: ['IncorrectSignal' as any], timeout: 1000},
				{signals: ['SIGINT'], timeout: 1000},
				{signals: ['SIGKILL'], timeout: 1000},
			],
			state: {
				ignorePid: process.pid,
				command,
			},
			logFilePath,
			createFilter(state) {
				// eslint-disable-next-line global-require
				const {createProcessTreeFilterByPredicate} = require('@flemist/find-process')
				return createProcessTreeFilterByPredicate((proc, processTree) => {
					if (proc.pid === state.ignorePid) {
						return false
					}
					if (proc && typeof proc !== 'object') {
						throw new Error('proc=' + proc)
					}
					if (processTree && typeof processTree !== 'object') {
						throw new Error('processTree=' + processTree)
					}
					if (processTree[proc.pid] !== proc) {
						throw new Error('proc=' + JSON.stringify(proc))
					}
					return proc.command.indexOf(state.command) >= 0
				})
			},
		})
	} catch (err) {
		logError(err)
		throw err
	}
}

process.on('exit', () => {
	// logError('exit')
	finalize()
})

process.on('close', () => {
	logError('close')
	// finalize()
})

process.on('SIGHUP', () => {
	logError('SIGHUP')
	// finalize()
})

process.on('SIGINT', () => {
	logError('SIGINT')
	// finalize()
})

process.on('SIGTERM', () => {
	logError('SIGTERM')
	// finalize()
})


// if (process.platform === 'win32') {
//   const rl = readline.createInterface({
//     input : process.stdin,
//     output: process.stdout,
//   })
//
//   rl.on('SIGHUP', () => {
//     process.emit('SIGHUP', 'SIGHUP')
//   })
//
//   rl.on('SIGINT', () => {
//     process.emit('SIGINT', 'SIGINT')
//   })
//
//   rl.on('SIGTERM', () => {
//     process.emit('SIGTERM', 'SIGTERM')
//   })
// }

// finalize()
setTimeout(() => {
	// logError('self close')
	// eslint-disable-next-line no-process-exit
	process.exit(0)
}, 1500)
