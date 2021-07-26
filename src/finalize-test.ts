import {finalizeCurrentProcess} from './finalize'
import {spawn} from 'child_process'

setTimeout(() => {
	// to prevent auto close process
}, 30000)

const level = parseInt(process.argv[2], 10)
const cliId = process.argv[3]
const logFilePath = process.argv[4]

function runChild(shell: boolean) {
	const proc = spawn('node', [
		__filename,
		(level + 1).toString(),
		cliId,
	], {
		detached   : true,
		stdio      : 'ignore',
		windowsHide: true,
		shell,
	})
	proc.unref()
}

process.once('exit', () => {
	if (level === 0 || level === 2) {
		runChild(false)
		runChild(true)
	}

	if (level === 0) {
		finalizeCurrentProcess({
			description  : 'finalize-test',
			softKillFirst: true,
			softKillDelay: 1000,
			firstDelay   : 1000,
			logFilePath,
		})
	}

	// eslint-disable-next-line no-process-exit
	process.exit(0)
})

if (level === 0) {
	setTimeout(() => {
		// eslint-disable-next-line no-process-exit
		process.exit(0)
	}, 1500)
} else if (level === 2) {
	// eslint-disable-next-line no-process-exit
	process.exit(0)
} else if (level <= 3) {
	runChild(true)
	runChild(false)
}
