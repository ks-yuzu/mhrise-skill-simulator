import {writable} from 'svelte/store'

export const isSeriesVisible = writable({} as {[key: string]: boolean})
