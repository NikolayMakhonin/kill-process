/* eslint-disable no-shadow */
import assert from 'assert'
import {spawn} from "child_process"
import {killMany} from './killMany'
import {delay} from './delay'
import {TProcessTree} from '@flemist/ps-cross-platform'

describe('killMany', function () {
	this.timeout(30000)

	it('empty stages', async function () {
		await killMany({
			description: 'TestDescription',
			stages: [
				{}, {}, {},
			],
			filter(processTree) {
				return Object.values(processTree)
			},
		})
			.then(() => {
				assert.fail('Should be error')
			})
			.catch(err => {
				assert.ok(/\bTestDescription\b/.test(err.message), err.message)
			})
	})

	function checkFilterArgs(processTree: TProcessTree) {
		Object.values(processTree).map(proc => {
			assert.ok(proc && typeof proc === 'object', 'proc=' + proc)
			assert.ok(processTree && typeof processTree === 'object', 'processTree=' + processTree)
			assert.strictEqual(processTree[proc.pid], proc, 'proc=' + JSON.stringify(proc))
		})
	}

	it('not exist', async function () {
		let filterCallsCount = 0
		const result = await killMany({
			description: 'TestDescription',
			stages: [
				{signals: ['SIGKILL']},
			],
			filter(processTree) {
				checkFilterArgs(processTree)
				filterCallsCount++
				return null
			},
		})

		assert.strictEqual(filterCallsCount, 2)
		assert.deepStrictEqual(result, [])
	})

	it('close with delay', async function () {
 		const command = `setTimeout(function() { console.log('Completed') }, 30000)`

		let proc
		let error
		function startProc() {
			proc = spawn('node', ['-e', command], {
				windowsHide: true,
			})
			proc.on('error', err => {
				error = err
			})
		}

		startProc()
		await delay(1000)

		let filterCallsCount = 0

		const result = await killMany({
			description: 'TestDescription',
			stages: [
				{timeout: 1000},
				{signals: [0], timeout: 1000},
				{signals: ['IncorrectSignal' as any], timeout: 1000},
				{signals: ['SIGINT'], timeout: 1000},
				{signals: ['SIGKILL'], timeout: 1000},
			],
			filter(processTree) {
				filterCallsCount++
				checkFilterArgs(processTree)
				return Object.values(processTree).filter(proc => proc.command.indexOf(command) >= 0)
			},
		})

		assert.ok(filterCallsCount >= 4)

		assert.ok(Array.isArray(result), 'result=' + result)
		assert.ok(result.length === (process.platform === 'win32' ? 4 : 3), `result.length=${result.length}: ` + JSON.stringify(result, null, 4))

		assert.deepStrictEqual(result[0].signals, [0])
		assert.ok(result[0].process.command.indexOf(command) >= 0)
		assert.ok(!result[0].error)

		assert.deepStrictEqual(result[1].signals, ['IncorrectSignal'])
		assert.ok(result[1].process.command.indexOf(command) >= 0)
		assert.ok(result[1].error)

		assert.deepStrictEqual(result[2].signals, ['SIGINT'])
		assert.ok(result[2].process.command.indexOf(command) >= 0)
		assert.ok(process.platform === 'win32' ? result[2].error : !result[2].error)

		if (process.platform === 'win32') {
			assert.deepStrictEqual(result[3].signals, ['SIGKILL'])
			assert.ok(result[3].process.command.indexOf(command) >= 0)
			assert.ok(!result[3].error)
		}
	})

	it('timeout', async function () {
 		const command = `setTimeout(function() { console.log('Completed') }, 30000)`

		let proc
		let error
		function startProc() {
			proc = spawn('node', ['-e', command], {
				windowsHide: true,
			})
			proc.on('error', err => {
				error = err
			})
		}

		let filterCallsCount = 0

		startProc()
		await delay(1000)

		const stage = {signal: 0, timeout: 1000}

		await killMany({
			description: 'TestDescription',
			stages: [
				stage,
			],
			filter(processTree) {
				filterCallsCount++
				checkFilterArgs(processTree)
				return Object.values(processTree).filter(proc => proc.command.indexOf(command) >= 0)
			},
		})
			.then(() => {
				assert.fail('Should be error')
			})
			.catch(err => {
				assert.ok(/\bTestDescription\b/.test(err.message), err.message)
			})

		assert.ok(filterCallsCount >= 4)

		if (proc) {
			process.kill(proc.pid, 'SIGKILL')
		}
	})
})
