/* eslint-disable no-shadow */
import assert from 'assert'
import {ChildProcess, spawn} from 'child_process'
import {killProcess} from './killProcess'
import {delay} from './delay'
import {kill} from './kill'

describe('kill', function () {
	this.timeout(60000)

	it('base', async function () {
 		const command = `setTimeout(function() { console.log('Completed') }, 30000)`

		let proc: ChildProcess
		let error
		function startProc() {
			proc = spawn('node', ['-e', command], {
				// detached: true,
				// stdio   : 'ignore',
				windowsHide: true,
			})
			// proc.unref()
			proc.on('error', err => {
				error = err
			})
		}

		startProc()
		await delay(1000)

		assert.strictEqual(proc.exitCode, null)

		process.kill(proc.pid, 0)
		// proc.kill()
		kill(proc.pid, 'SIGKILL')
		await delay(1000)

		// process.kill(proc.pid, 0)
		assert.throws(() => process.kill(proc.pid, 0))

		// assert.strictEqual(proc.exitCode, 1)
	})
})
