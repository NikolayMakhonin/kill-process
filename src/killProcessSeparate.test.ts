/* eslint-disable no-shadow */
import {fork, spawn} from 'child_process'
import {waitProcessList} from '@flemist/find-process'
import {delay} from './delay'
import assert from 'assert'
import path from 'path'

describe('killProcessSeparate', function () {
	this.timeout(10000)

	xit('close with delay', async function () {
 		const command = `setTimeout(function() { console.log('Completed') }, 30000)`

		let proc
		let errors = []
		function startProc() {
			proc = spawn('node', ['-e', command])
			proc.on('error', err => {
				errors.push(err)
			})
		}

		startProc()
		await delay(1000)

		let predicateCallsCount = 0

		const appProc = spawn('node', [
			require.resolve('../dist/app-finalize-test.js'),
			command,
			path.resolve('tmp/log.txt'),
		], {
			stdio: ['inherit', 'ipc', 'pipe']
		})
		appProc.on('error', err => {
			errors.push(err)
		})
		appProc.stderr.on('data', chunk => {
			const error = chunk.toString()
			if (/debugger|inspector/i.test(error)) {
				return
			}
			errors.push(error)
			console.error(error)
		})

		await delay(1000)
		if (errors.length) {
			assert.fail(errors.join('\r\n'))
		}

		await waitProcessList({
			timeout: 1000,
			checkInterval: 100,
			description: 'Wait app open',
			predicate(processList) {
				return processList.some(o => o.command.indexOf('app-finalize-test') >= 0)
			}
		})

		process.kill(appProc.pid, 'SIGTERM')

		await waitProcessList({
			timeout: 1000,
			checkInterval: 100,
			description: 'Wait app close',
			predicate(processList) {
				return processList.every(o => o.command.indexOf('app-finalize-test') < 0)
					&& processList.some(o => o.command.indexOf(command) >= 0)
			}
		})

		await waitProcessList({
			timeout: 5000,
			checkInterval: 100,
			description: 'Wait app finalize',
			predicate(processList) {
				return processList.every(o => o.command.indexOf('app-finalize-test') < 0)
					&& processList.every(o => o.command.indexOf(command) < 0)
			}
		})

		await delay(1000)

		if (errors.length) {
			assert.fail(errors.join('\r\n'))
		}
	})
})
