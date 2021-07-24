/* eslint-disable no-shadow */
import {fork, spawn} from 'child_process'
import {waitProcessList} from '@flemist/find-process'
import {delay} from './delay'

describe('killProcessSeparate', function () {
	this.timeout(10000)

	it('close with delay', async function () {
 		const command = `setTimeout(function() { console.log('Completed') }, 30000)`

		let proc
		let error
		function startProc() {
			proc = spawn('node', ['-e', command])
			proc.on('error', err => {
				error = err
			})
		}

		startProc()
		await delay(1000)

		let predicateCallsCount = 0

		const appProc = fork(require.resolve('../dist/app-finalize-test.js'), [command])
		appProc.stdout.on('data', chunk => {
			console.log(chunk.toString())
		})
		appProc.stderr.on('data', chunk => {
			console.error(chunk.toString())
		})

		waitProcessList({
			timeout: 1000,
			checkInterval: 100,
			description: 'Wait app close',
			predicate(processList) {
				return processList.every(o => o.command.indexOf('app-finalize-test') < 0)
			}
		})

		process.kill(appProc.pid, 'SIGTERM')

		waitProcessList({
			timeout: 1000,
			checkInterval: 100,
			description: 'Wait app close',
			predicate(processList) {
				return processList.every(o => o.command.indexOf('app-finalize-test') < 0)
					&& processList.some(o => o.command.indexOf(command) >= 0)
			}
		})

		waitProcessList({
			timeout: 1000,
			checkInterval: 100,
			description: 'Wait app close',
			predicate(processList) {
				return processList.every(o => o.command.indexOf('app-finalize-test') < 0)
					&& processList.every(o => o.command.indexOf(command) < 0)
			}
		})
	})
})
