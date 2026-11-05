import { DEMO_SCENARIOS, type DemoScenario } from '../services';

interface DemoBannerProps {
  scenario: DemoScenario;
  onScenarioChange: (scenario: DemoScenario) => void;
}

export function DemoBanner({ scenario, onScenarioChange }: DemoBannerProps) {
  const selected = DEMO_SCENARIOS.find((item) => item.value === scenario);

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-amber-500 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
            Modo demonstração
          </span>
          <p className="text-amber-900">
            As respostas são simuladas. Nenhuma mensagem é enviada de verdade.
          </p>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
          <label htmlFor="demo-scenario" className="font-medium text-amber-900">
            Cenário simulado
          </label>
          <select
            id="demo-scenario"
            value={scenario}
            onChange={(event) => onScenarioChange(event.target.value as DemoScenario)}
            className="rounded-lg border-0 bg-white px-3 py-1.5 text-slate-900 ring-1 ring-inset ring-amber-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {DEMO_SCENARIOS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          {selected && <span className="text-xs text-amber-800 sm:ml-1">{selected.description}</span>}
        </div>
      </div>
    </div>
  );
}
