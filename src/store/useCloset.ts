// Minimal v2-pro store (foundation slice).
//
// NOTE: zustand + zundo are NOT installed, and the task forbids new deps
// without asking. So this is a dependency-free temporal store with the
// same spirit: undo/redo history (limit 50), transient state (selection,
// camera) kept out of persistence, config persisted to localStorage under
// a NEW v2 key that never clobbers v1 ('forme-closet-project-v1').
//
// When zustand/zundo are approved later, swap this file's internals for:
//   create<State>()(temporal(persist(...), { limit: 50, partialize }))
// without changing the hook's public shape.
//
// Current v1 UI (App.tsx) is NOT rewired yet — it keeps its own useState.
// This store is the foundation the next slice migrates to.

import { useSyncExternalStore } from 'react'
import {
  copyProject,
  DEFAULT_DIMENSIONS,
  FINISHES,
  type ClosetProject,
} from '../closet'

/** NEW v2 persistence key — never touches the v1 key. */
export const V2_STORAGE_KEY = 'forme-closet-project-v2'

/** Max undo steps (mirrors planned zundo `limit: 50`). */
export const HISTORY_LIMIT = 50

/** Transient UI state: kept in memory, never persisted (zundo partialize). */
export type TransientState = {
  selectedPart: ClosetProject['selectedPart']
  camera: { position: [number, number, number]; target: [number, number, number] } | null
}

type Listener = () => void

function defaultV2Project(): ClosetProject {
  return {
    format: 'forme-closet',
    version: 1,
    savedAt: new Date().toISOString(),
    name: 'Walk-in wardrobe',
    dimensions: { ...DEFAULT_DIMENSIONS },
    shelves: 3,
    doors: true,
    doorOpen: false,
    finish: FINISHES[0].color,
    selectedPart: null,
    partOverrides: {},
    assembly: 0,
    language: 'en',
    unit: 'mm',
  }
}

function readPersisted(): ClosetProject | null {
  try {
    const raw = localStorage.getItem(V2_STORAGE_KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    // Light shape check — full validation lives in isClosetProject.
    if (!value || typeof value !== 'object') return null
    const candidate = value as Partial<ClosetProject>
    if (candidate.format !== 'forme-closet' || !candidate.dimensions) return null
    return candidate as ClosetProject
  } catch {
    return null
  }
}

/** Strip transient fields before persisting (mimics zundo partialize). */
function toPersisted(project: ClosetProject): ClosetProject {
  const snapshot = copyProject(project)
  snapshot.selectedPart = null
  return snapshot
}

function persist(project: ClosetProject) {
  try {
    localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(toPersisted(project)))
  } catch (error) {
    console.error('Could not persist v2 closet project', error)
  }
}

// --- Tiny external store -------------------------------------------------

let present: ClosetProject = readPersisted() ?? defaultV2Project()
let past: ClosetProject[] = []
let future: ClosetProject[] = []
let transient: TransientState = { selectedPart: present.selectedPart, camera: null }
const listeners = new Set<Listener>()

function emit() {
  refresh()
  for (const listener of listeners) listener()
}

function pushHistory(previous: ClosetProject) {
  past = [...past, copyProject(previous)].slice(-HISTORY_LIMIT)
  future = []
}

/** Full snapshot for useSyncExternalStore (present + transient + pointers). */
type Snapshot = {
  project: ClosetProject
  transient: TransientState
  canUndo: boolean
  canRedo: boolean
  historyLength: number
}

function getSnapshot(): Snapshot {
  return cached
}

function refresh() {
  cached = {
    project: present,
    transient,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    historyLength: past.length + 1 + future.length,
  }
}

let cached: Snapshot = {
  project: present,
  transient,
  canUndo: false,
  canRedo: false,
  historyLength: 1,
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const useClosetStore = {
  subscribe,
  getSnapshot,
  /** Replace/merge the project config (records undo step + persists). */
  set(changes: Partial<ClosetProject>) {
    const previous = present
    present = { ...present, ...changes, savedAt: new Date().toISOString() }
    pushHistory(previous)
    persist(present)
    emit()
  },
  /** Set transient selection (no history, no persist). */
  select(selectedPart: ClosetProject['selectedPart']) {
    transient = { ...transient, selectedPart }
    emit()
  },
  /** Set transient camera (no history, no persist). */
  setCamera(camera: TransientState['camera']) {
    transient = { ...transient, camera }
    emit()
  },
  undo() {
    const previous = past[past.length - 1]
    if (!previous) return
    past = past.slice(0, -1)
    future = [copyProject(present), ...future].slice(0, HISTORY_LIMIT)
    present = copyProject(previous)
    persist(present)
    emit()
  },
  redo() {
    const next = future[0]
    if (!next) return
    future = future.slice(1)
    past = [...past, copyProject(present)].slice(-HISTORY_LIMIT)
    present = copyProject(next)
    persist(present)
    emit()
  },
  reset() {
    pushHistory(present)
    present = defaultV2Project()
    transient = { selectedPart: null, camera: null }
    persist(present)
    emit()
  },
  /** zundo-style temporal handle for the future migration. */
  temporal: {
    undo() {
      useClosetStore.undo()
    },
    redo() {
      useClosetStore.redo()
    },
    clear() {
      past = []
      future = []
      emit()
    },
  },
}

/**
 * Selector hook (zustand-style): `useCloset((s) => s.project)`.
 * Re-renders only when the selected slice changes by Object.is.
 */
export function useCloset<T>(selector: (snapshot: Snapshot) => T): T {
  const selected = useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getSnapshot()),
  )
  return selected
}
