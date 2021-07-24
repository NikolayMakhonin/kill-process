import {TSignal} from './contracts'
// import treeKill from 'tree-kill'
import {spawn} from 'child_process'

export function kill(pid: number, signal: TSignal) {
	if (process.platform === 'win32') {
	// 	treeKill(-pid, signal)
		process.kill(-pid, signal)
		return
	}

	// return new Promise<void>((resolve, reject) => {
		spawn('kill', [
			// typeof signal === 'number' ? '-n' : '-s',
			// signal.toString().toUpperCase(),
			pid.toString(),
		], {
			detached: true,
			stdio   : 'ignore',
			// stdio: ['inherit', 'pipe', 'pipe'],
		})
			.unref()

		// let hasError
		// const chunks = []
		//
		// killProc
		// 	.on('error', reject)
		// 	.on('end', () => {
		// 		const log = Buffer.concat(chunks).toString('utf-8')
		// 		if (hasError) {
		// 			reject(new Error(log))
		// 			return
		// 		}
		// 		resolve(void 0)
		// 	})
		//
		// killProc.stdout.on('data', (chunk) => {
		// 	chunks.push(chunk)
		// })
		//
		// killProc.stderr.on('data', (chunk) => {
		// 	chunks.push(chunk)
		// 	hasError = true
		// })
	// })
}
