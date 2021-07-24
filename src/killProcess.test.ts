/* eslint-disable no-shadow */
import assert from 'assert'
import {spawn} from "child_process"
import {killProcess} from './killProcess'
import {delay} from './delay'

xdescribe('killProcess', function () {
	this.timeout(60000)

	it('empty stages', async function () {
		let predicateCallsCount = 0
		await killProcess({
			description: 'TestDescription',
			stages: [
				{}, {}, {},
			],
			predicate() {
				predicateCallsCount++
				return true
			},
		})
			.then(() => {
				assert.fail('Should be error')
			})
			.catch(err => {
				assert.ok(/\bTestDescription\b/.test(err.message), err.message)
			})

		assert.strictEqual(predicateCallsCount, 0)
	})

	function checkPredicateArgs(proc, processTree, stage, stageIndex, stages) {
		assert.ok(proc && typeof proc === 'object', 'proc=' + proc)
		assert.ok(processTree && typeof processTree === 'object', 'processTree=' + processTree)
		assert.ok(stage && typeof stage === 'object', 'stage=' + stage)
		assert.ok(Number.isFinite(stageIndex) && stageIndex >= 0, 'stageIndex=' + stageIndex)
		assert.ok(Array.isArray(stages), 'stages=' + stages)
		assert.strictEqual(processTree[proc.pid], proc, 'proc=' + JSON.stringify(proc))
		assert.strictEqual(stages[stageIndex], stage, 'stage=' + JSON.stringify(stage))
	}

	it('not exist', async function () {
		let predicateCallsCount = 0
		const result = await killProcess({
			description: 'TestDescription',
			stages: [
				{signals: ['SIGKILL']},
			],
			predicate(proc, processTree, stage, stageIndex, stages) {
				checkPredicateArgs(proc, processTree, stage, stageIndex, stages)
				predicateCallsCount++
				return false
			},
		})

		assert.ok(predicateCallsCount >= 4)
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

		let predicateCallsCount = 0

		const result = await killProcess({
			description: 'TestDescription',
			stages: [
				{timeout: 1000},
				{signals: [0], timeout: 1000},
				{signals: ['IncorrectSignal' as any], timeout: 1000},
				{signals: ['SIGINT'], timeout: 1000},
				{signals: ['SIGKILL'], timeout: 1000},
			],
			predicate(proc, processTree, stage, stageIndex, stages) {
				predicateCallsCount++
				if (process.platform !== 'linux') {
					assert.ok(stage.signals[0] !== 'SIGKILL')
				}
				checkPredicateArgs(proc, processTree, stage, stageIndex, stages)
				return proc.command.indexOf(command) >= 0
			},
		})

		assert.ok(predicateCallsCount >= 4)

		assert.ok(Array.isArray(result), 'result=' + result)
		assert.ok(result.length === 3, `result.length=${result.length}: ` + JSON.stringify(result, null, 4))

		assert.strictEqual(result[0].signal, 0)
		assert.ok(result[0].process.command.indexOf(command) >= 0)
		assert.ok(!result[0].error)

		assert.strictEqual(result[1].signal, 'IncorrectSignal')
		assert.ok(result[1].process.command.indexOf(command) >= 0)
		assert.ok(result[1].error)

		assert.strictEqual(result[2].signal, 'SIGINT')
		assert.ok(result[2].process.command.indexOf(command) >= 0)
		assert.ok(!result[2].error)
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

		let predicateCallsCount = 0

		startProc()
		await delay(1000)

		const stage = {signal: 0, timeout: 1000}

		await killProcess({
			description: 'TestDescription',
			stages: [
				stage,
			],
			predicate(proc, processTree, _stage, stageIndex, stages) {
				predicateCallsCount++
				assert.strictEqual(_stage, stage)
				assert.strictEqual(_stage.signal, 0)
				assert.strictEqual(_stage.timeout, 1000)
				checkPredicateArgs(proc, processTree, _stage, stageIndex, stages)
				return proc.command.indexOf(command) >= 0
			},
		})
			.then(() => {
				assert.fail('Should be error')
			})
			.catch(err => {
				assert.ok(/\bTestDescription\b/.test(err.message), err.message)
			})

		assert.ok(predicateCallsCount >= 4)

		process.kill(proc.pid, 'SIGKILL')
	})
})
