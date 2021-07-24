/* eslint-disable no-shadow */
import assert from 'assert'
import {spawn} from "child_process"
import {killProcess} from './killProcess'
import {delay} from './delay'

describe('killProcess', function () {
	this.timeout(10000)

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
				{signal: 'SIGKILL'},
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
			proc = spawn('node', ['-e', command])
			proc.on('error', err => {
				error = err
			})
		}

		startProc()
		await delay(1000)

		const result = await killProcess({
			description: 'TestDescription',
			stages: [
				{timeout: 1000},
				{signal: 0, timeout: 1000},
				{signal: 'IncorrectSignal' as any, timeout: 1000},
				{signal: 'SIGTERM', timeout: 1000},
				{signal: 'SIGKILL', timeout: 1000},
			],
			predicate(proc, processTree, stage, stageIndex, stages) {
				assert.ok(stage.signal !== 'SIGKILL')
				checkPredicateArgs(proc, processTree, stage, stageIndex, stages)
				return proc.command.indexOf(command) >= 0
			},
		})

		assert.ok(Array.isArray(result), 'result=' + result)
		assert.ok(result.length === 3, 'result.length !== 2: ' + JSON.stringify(result, null, 4))

		assert.strictEqual(result[0].signal, 0)
		assert.ok(result[0].process.command.indexOf(command) >= 0)
		assert.ok(!result[0].error)

		assert.strictEqual(result[1].signal, 'IncorrectSignal')
		assert.ok(result[1].process.command.indexOf(command) >= 0)
		assert.ok(result[1].error)

		assert.strictEqual(result[2].signal, 'SIGTERM')
		assert.ok(result[2].process.command.indexOf(command) >= 0)
		assert.ok(!result[2].error)
	})
	//
	// it('timeout', async function () {
	// 	await waitProcessTree({
	// 		description: 'TestDescription',
	// 		timeout: 2000,
	// 		checkInterval: 200,
	// 		predicate(processTree) {
	// 			return false
	// 		},
	// 	})
	// 		.then(() => {
	// 			assert.fail('Should be error')
	// 		})
	// 		.catch(err => {
	// 			assert.ok(/\bTestDescription\b/.test(err.message), err.message)
	// 		})
	// })
})
