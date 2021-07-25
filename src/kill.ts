import {TSignal} from './contracts'
import {spawn} from 'child_process'

function exec(command: string, args: string[]) {
	return new Promise<void>((resolve, reject) => {
		const killProc = spawn(command, args, {
			stdio: ['inherit', 'pipe', 'pipe'],
		})

		let hasError
		const chunks = []

		killProc
			.on('error', reject)
			.on('end', () => {
				const log = Buffer.concat(chunks).toString('utf-8')
				if (hasError) {
					reject(new Error(log))
					return
				}
				resolve(void 0)
			})

		killProc.stdout.on('data', (chunk) => {
			chunks.push(chunk)
		})

		killProc.stderr.on('data', (chunk) => {
			chunks.push(chunk)
			hasError = true
		})
	})
}

export async function kill(pid: number, signal: TSignal) {
	if (process.platform === 'win32') {
		if (signal === 'SIGHUP' || signal === 'SIGINT' || signal === 'SIGTERM') {
			// soft kill on Windows
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
