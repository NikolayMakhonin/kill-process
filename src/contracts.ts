import {TProcessNode, TProcessTree} from '@flemist/ps-cross-platform'

export type TSignal = NodeJS.Signals | number

export type TKillStage = {
	signal?: TSignal
	/** milliseconds, wait timeout after kill */
	timeout?: number
}

export type TKillProcessArgs = {
	description?: string,
	stages: TKillStage[],
	predicate: (
		proc: TProcessNode,
		processTree: TProcessTree,
		stage: TKillStage,
		stageIndex: number,
		stages: TKillStage[],
	) => boolean
}

export type TKillProcessArgsSerializable = Omit<TKillProcessArgs, 'predicate'> & {
	predicate: string
}

export type TKillResult = {
	signal: TSignal
	process: TProcessNode
	error?: Error
}
