import { useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { todayISO } from '../lib/date'
import { PageHeader } from '../components/ui'
import type { PersistedData } from '../types'

export function SettingsPage() {
  const profiles = useStore((s) => s.profiles)
  const renameProfile = useStore((s) => s.renameProfile)
  const setProfileUnit = useStore((s) => s.setProfileUnit)
  const deleteProfile = useStore((s) => s.deleteProfile)
  const addProfile = useStore((s) => s.addProfile)

  const fields = useStore((s) => s.measurementFields)
  const addMeasurementField = useStore((s) => s.addMeasurementField)
  const removeMeasurementField = useStore((s) => s.removeMeasurementField)

  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const resetAll = useStore((s) => s.resetAll)

  const [newProfile, setNewProfile] = useState('')
  const [newField, setNewField] = useState('')
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gym-tracker-backup-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as PersistedData
        if (!data.program || !Array.isArray(data.profiles)) {
          throw new Error('missing fields')
        }
        if (!confirm('Importing will REPLACE all current data on this device. Continue?')) return
        importData(data)
        setImportMsg('✓ Backup imported successfully.')
      } catch {
        setImportMsg('⚠️ That file doesn’t look like a valid backup.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />

      {/* Profiles */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">People</h2>
        {profiles.map((p) => (
          <div key={p.id} className="card space-y-3 p-4">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
              <input
                className="input flex-1"
                value={p.name}
                onChange={(e) => renameProfile(p.id, e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-900/70 p-1">
                {(['lb', 'kg'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setProfileUnit(p.id, u)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${
                      p.unit === u ? 'bg-slate-700 text-white' : 'text-slate-400'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
              <button
                className="btn-ghost px-3 py-1.5 text-sm hover:text-rose-400 disabled:opacity-30"
                disabled={profiles.length <= 1}
                onClick={() =>
                  confirm(`Delete ${p.name} and all their logged data? This cannot be undone.`) &&
                  deleteProfile(p.id)
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        <div className="card flex items-center gap-2 p-3">
          <input
            className="input"
            placeholder="Add a person (e.g. your brother)"
            value={newProfile}
            onChange={(e) => setNewProfile(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newProfile.trim()) {
                addProfile(newProfile)
                setNewProfile('')
              }
            }}
          />
          <button
            className="btn-primary shrink-0"
            onClick={() => {
              if (newProfile.trim()) {
                addProfile(newProfile)
                setNewProfile('')
              }
            }}
          >
            Add
          </button>
        </div>
      </section>

      {/* Measurement fields */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Body measurements
        </h2>
        <div className="card p-4">
          <div className="flex flex-wrap gap-2">
            {fields.length === 0 && <span className="text-sm text-slate-500">No fields.</span>}
            {fields.map((f) => (
              <span
                key={f}
                className="flex items-center gap-2 rounded-full bg-slate-700/60 py-1 pl-3 pr-2 text-sm"
              >
                {f}
                <button
                  className="text-slate-400 hover:text-rose-400"
                  onClick={() => removeMeasurementField(f)}
                  aria-label={`Remove ${f}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              className="input"
              placeholder="Add measurement (e.g. Calves)"
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newField.trim()) {
                  addMeasurementField(newField)
                  setNewField('')
                }
              }}
            />
            <button
              className="btn-ghost shrink-0"
              onClick={() => {
                if (newField.trim()) {
                  addMeasurementField(newField)
                  setNewField('')
                }
              }}
            >
              Add
            </button>
          </div>
        </div>
      </section>

      {/* Backup */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Backup &amp; restore
        </h2>
        <div className="card space-y-3 p-4">
          <p className="text-sm text-slate-400">
            Your data lives only in this browser. Export regularly to back it up — and use the same
            file to move your data to another phone or browser.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="btn-primary flex-1" onClick={handleExport}>
              ⬇️ Export backup
            </button>
            <button className="btn-ghost flex-1" onClick={() => fileRef.current?.click()}>
              ⬆️ Import backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImportFile(file)
                e.target.value = ''
              }}
            />
          </div>
          {importMsg && <p className="text-sm text-slate-300">{importMsg}</p>}
        </div>
      </section>

      {/* Danger zone */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Danger zone</h2>
        <div className="card p-4">
          <button
            className="btn-danger w-full"
            onClick={() =>
              confirm(
                'Reset EVERYTHING back to the starter program and delete all logged data on this device? Export a backup first if you want to keep it.',
              ) && resetAll()
            }
          >
            Reset all data
          </button>
        </div>
      </section>

      <p className="pb-2 text-center text-xs text-slate-600">Gym Tracker · v1.0 · data stored on this device</p>
    </div>
  )
}
