import {ps, psTree, TProcess, TProcessNode, TProcessTree} from '@flemist/ps-cross-platform'

export async function findInProcessList(
	predicate: (proc: TProcess, processList: TProcess[]) => boolean,
): Promise<TProcess[]> {
	const processList = await ps()
	return processList
		.filter(proc => predicate(proc, processList))
}

export async function findInProcessTree(
	predicate: (proc: TProcessNode, processTree: TProcessTree) => boolean,
): Promise<TProcessNode[]> {
	const processTree = await psTree()
	return Object
		.values(processTree)
		.filter(proc => predicate(proc, processTree))
}
