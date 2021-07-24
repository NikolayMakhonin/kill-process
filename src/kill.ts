import {TSignal} from './contracts'
import {spawn} from 'child_process'

export function kill(pid: number, signal: TSignal): Promise<void>|void {
	if (process.platform === 'win32') {
		process.kill(pid, signal)
		return void 0
	}

	return new Promise<void>((resolve, reject) => {
		const killProc = spawn('kill', [
			typeof signal === 'number'
				? '-' + signal
				: '-' + signal.replace(/^sig/i, '').toUpperCase(),
			pid.toString(),
		], {
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
