import {TSignal} from './contracts'
import {spawn} from 'child_process'

function exec(command: string, args: string[]) {
	return new Promise<void>((resolve, reject) => {
		const killProc = spawn(command, args, {
			stdio      : ['inherit', 'pipe', 'pipe'],
			windowsHide: true,
		})

		let hasError
		const chunks = []

		function end() {
			const log = Buffer.concat(chunks).toString()
			if (hasError) {
				reject(new Error(log))
				return
			}
			resolve(void 0)
		}

		killProc
			.on('error', reject)
			.on('end', end)

		killProc.stdout
			.on('data', (chunk) => {
				chunks.push(chunk)
			})
			.on('end', end)

		killProc.stderr
			.on('data', (chunk) => {
				chunks.push(chunk)
				hasError = true
			})
			.on('end', end)
	})
}

export async function kill(pid: number, signal: TSignal) {
	if (process.platform === 'win32') {
		if (signal === 'SIGHUP' || signal === 'SIGINT' || signal === 'SIGTERM') {
			// soft kill on Windows, worked only if app has windows
			// !! It is not possible to soft kill process on windows in any other way !!
			await exec('taskkill', [
				'/PID',
				pid.toString(),
			])
		} else {
			process.kill(pid, signal)
		}
	} else {
		process.kill(pid, signal)

		// await exec('kill', [
		// 	typeof signal === 'number'
		// 		? '-' + signal
		// 		: '-' + signal.replace(/^sig/i, '').toUpperCase(),
		// 	pid.toString(),
		// ])
	}
}
