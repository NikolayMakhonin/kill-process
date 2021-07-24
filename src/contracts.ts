import {TProcessNode, TProcessTree} from '@flemist/ps-cross-platform'

export type TSignal = NodeJS.Signals | number

export type TKillStage = {
	signal?: TSignal
	/** milliseconds, wait timeout after kill */
	timeout?: number
}

export type TKillProcessPredicate = (
	proc: TProcessNode,
	processTree: TProcessTree,
	stage: TKillStage,
	stageIndex: number,
	stages: TKillStage[],
) => boolean

export type TKillProcessArgs = {
	description?: string,
	stages: TKillStage[],
	predicate: TKillProcessPredicate,
}

export type TKillProcessArgsSerializable<TState> = Omit<TKillProcessArgs, 'predicate'> & {
	state?: TState
	/** For write errors to file. Use absolute path. */
	logFilePath?: string
	createPredicate: (state: TState) => TKillProcessPredicate
}

export type TKillProcessArgsSerialized<TState> = Omit<
	TKillProcessArgsSerializable<TState>,
	'createPredicate'
> & {
	createPredicate: string
}

export type TKillResult = {
	signal: TSignal
	process: TProcessNode
	error?: Error
}
