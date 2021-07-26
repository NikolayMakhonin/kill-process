/* eslint-disable no-shadow */
import {spawn} from 'child_process'
import {findInProcessList, waitProcessList, waitProcessTree} from '@flemist/find-process'
import assert from 'assert'
import path from "path"
import fs from "fs"

describe('finalize', function () {
	this.timeout(30000)

	const _cliId = 'finalize-test-app'

	it('finalizeCurrentProcess', async function () {
		let processes = await findInProcessList(proc => {
			return proc.command.indexOf(_cliId) >= 0
				|| proc.command.indexOf('finalize-test.js') >= 0
				|| /dist[\\/]cli.js/.test(proc.command)
		})
		assert.deepStrictEqual(processes, [])

		const logFilePath = path.resolve('tmp/module/log/log.txt')

		try {
			const proc = spawn('node', [
				require.resolve('../dist/finalize-test.js'),
				'0',
				_cliId,
				logFilePath,
			], {
				detached: true,
				windowsHide: true,
				stdio: 'ignore',
			})
			proc.unref()

			console.log('App pid: ' + proc.pid)

			processes = await waitProcessList({
				timeout: 1000,
				checkInterval: 100,
				description: 'Wait app open',
				predicate(processList) {
					return processList.some(o => o.command.indexOf('finalize-test.js 0 ') >= 0)
				}
			})
			processes = processes.filter(o => o.command.indexOf(_cliId) >= 0)
			assert.strictEqual(processes.length, 1)
			assert.ok(processes[0].command.indexOf('finalize-test.js 0 ') >= 0)

			processes = await waitProcessList({
				timeout: 4000,
				checkInterval: 100,
				description: 'Wait app close',
				predicate(processList) {
					return processList.every(o => o.command.indexOf('finalize-test.js 0 ') < 0)
						&& processList.some(o => /dist[\\/]cli.js/.test(o.command))
				}
			})
			processes = processes.filter(o => o.command.indexOf(_cliId) >= 0)
			assert.ok(processes.length >= 2)

			await waitProcessList({
				timeout: 5000,
				checkInterval: 100,
				description: 'Wait app closer',
				predicate(processList) {
					return processList.every(o => !/dist[\\/]cli.js/.test(o.command))
				}
			})

			try {
				await waitProcessTree({
					timeout: 5000,
					checkInterval: 100,
					description: 'Wait app finalize',
					predicate(processTree) {
						processes = Object.values(processTree).filter(o => o.command.indexOf(_cliId) >= 0)
						return processes.length === 0
					}
				})
			} catch (err) {
				console.error(JSON.stringify(processes, null, 4))
				throw err
			}
		} finally {
			let hasError
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
