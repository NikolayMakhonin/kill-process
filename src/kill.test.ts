/* eslint-disable no-shadow */
import assert from 'assert'
import {ChildProcess, spawn} from 'child_process'
import {delay} from './delay'
import {kill} from './kill'
import {waitProcessTree} from '@flemist/find-process'

describe('kill', function () {
	this.timeout(60000)

	it('base', async function () {
 		const command = `setTimeout(function() { console.log('Completed') }, 30000)`

		let proc: ChildProcess
		let error
		function startProc() {
			proc = spawn('node', ['-e', command], {
				detached: true,
				stdio   : 'ignore',
				windowsHide: true,
			})
			proc.unref()
			// proc.on('error', err => {
			// 	error = err
			// })
		}

		startProc()
		await delay(1000)

		assert.strictEqual(proc.exitCode, null)

		process.kill(proc.pid, 0)
		let result = await waitProcessTree({
			description: 'TestDescription',
			timeout: 1000,
			checkInterval: 1000,
			predicate(processTree) {
				return Object.values(processTree).some(o => o.command.indexOf(command) >= 0)
			},
		})

		assert.ok(Object.values(result).some(o => o.command.indexOf(command) >= 0))


		await kill(proc.pid, 'SIGINT')
		await delay(1000)

		assert.throws(() => process.kill(proc.pid, 0))

		result = await waitProcessTree({
			description: 'TestDescription',
			timeout: 1000,
			checkInterval: 1000,
			predicate(processTree) {
				return Object.values(processTree).every(o => o.command.indexOf(command) < 0)
			},
		})

		assert.ok(Object.values(result).every(o => o.command.indexOf(command) < 0))
	})
})
