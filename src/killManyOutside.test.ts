/* eslint-disable no-shadow */
import {spawn} from 'child_process'
import {waitProcessList} from '@flemist/find-process'
import {delay} from './delay'
import assert from 'assert'
import path from 'path'
import fs from 'fs'

describe('killManyOutside', function () {
	this.timeout(30000)

	it('close with delay', async function () {
 		const command = `setTimeout(function() { console.log('Completed') }, 60000)`

		let proc
		let errors = []
		function startProc() {
			proc = spawn('node', ['-e', command], {
				detached: true,
				windowsHide: true,
				stdio: 'ignore',
			})
			proc.unref()
			proc.on('error', err => {
				errors.push(err)
			})
		}

		startProc()
		await delay(1000)

		const appLogFilePath = path.resolve('tmp/app/log/log.txt')
		const logFilePath = path.resolve('tmp/module/log/log.txt')

		try {
			const appProc = spawn('node', [
				require.resolve('../dist/killManyOutside-test.js'),
				appLogFilePath,
				logFilePath,
				command,
			], {
				detached: true,
				stdio: 'ignore',
				// stdio: ['inherit', 'ipc', 'pipe'],
				windowsHide: true,
			})
			appProc.unref()
			// appProc.on('error', err => {
			// 	errors.push(err)
			// })
			// appProc.stderr.on('data', chunk => {
			// 	const error = chunk.toString()
			// 	if (/debugger|inspector/i.test(error)) {
			// 		return
			// 	}
			// 	errors.push(error)
			// 	console.error(error)
			// })

			await delay(1000)
			if (errors.length) {
				assert.fail(errors.join('\r\n'))
			}

			await waitProcessList({
				timeout: 1000,
				checkInterval: 100,
				description: 'Wait app open',
				predicate(processList) {
					return processList.some(o => o.command.indexOf('killManyOutside-test') >= 0)
				}
			})

			// await delay(5000)
			// if (errors.length) {
			// 	assert.fail(errors.join('\r\n'))
			// }

			// process.kill(appProc.pid, 'SIGINT')

			await waitProcessList({
				timeout: 2000,
				checkInterval: 100,
				description: 'Wait app close',
				predicate(processList) {
					return processList.every(o => o.command.indexOf('killManyOutside-test') < 0)
						&& processList.some(o => o.command.indexOf(command) >= 0)
						&& processList.some(o => /dist[\\/]cli.js/.test(o.command))
				}
			})

			await waitProcessList({
				timeout: 15000,
				checkInterval: 100,
				description: 'Wait app closer',
				predicate(processList) {
					return processList.every(o => o.command.indexOf('killManyOutside-test') < 0)
						&& processList.every(o => !/dist[\\/]cli.js/.test(o.command))
				}
			})

			await waitProcessList({
				timeout: 2000,
				checkInterval: 100,
				description: 'Wait app finalize',
				predicate(processList) {
					return processList.every(o => o.command.indexOf('killManyOutside-test') < 0)
						&& processList.every(o => o.command.indexOf(command) < 0)
						&& processList.every(o => !/dist[\\/]cli.js/.test(o.command))
				}
			})

			await delay(1000)

			if (errors.length) {
				assert.fail(errors.join('\r\n'))
			}
		} finally {
			let hasError
			if (fs.existsSync(appLogFilePath)) {
				hasError = true
				console.error(fs.readFileSync(appLogFilePath, { encoding: 'utf-8' }))
			}
			if (fs.existsSync(logFilePath)) {
				hasError = true
				console.error(fs.readFileSync(logFilePath, { encoding: 'utf-8' }))
			}
			if (hasError) {
				assert.fail('Error log files found')
			}
		}
	})
})
